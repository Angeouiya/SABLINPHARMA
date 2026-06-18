import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { CREDIT_FCFA_VALUE } from "@/config/user-services";
import { addRequestHistory, serializeRequest } from "@/lib/user-requests";

function canRefund(role: Parameters<typeof hasPharmacyPermission>[0]) {
  return hasPharmacyPermission(role, "admin.transactions.refund") || hasPharmacyPermission(role, "admin.transactions.adjust");
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.pharmacies.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const pharmacySlug = searchParams.get("pharmacySlug");
  const where = {
    ...(status ? { status } : {}),
    ...(pharmacySlug ? { pharmacy: { slug: pharmacySlug } } : {}),
  };

  const requests = await db.pharmacyRequest.findMany({
    where,
    include: {
      user: { select: { name: true, commune: true } },
      pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
      medication: { select: { name: true, slug: true, dosage: true, form: true, packSize: true } },
      responses: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      disputes: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const stats = {
    total: await db.pharmacyRequest.count(),
    today: await db.pharmacyRequest.count({ where: { createdAt: { gte: todayStart } } }),
    new: await db.pharmacyRequest.count({ where: { status: "Nouvelle" } }),
    inProgress: await db.pharmacyRequest.count({ where: { status: { in: ["Reçue", "Acceptée", "En cours"] } } }),
    answered: await db.pharmacyRequest.count({ where: { status: "Répondue" } }),
    expired: await db.pharmacyRequest.count({ where: { status: "Expirée" } }),
    disputes: await db.pharmacyRequest.count({ where: { status: "Litige" } }),
    refunded: await db.requestRefund.count({ where: { status: "Remboursé" } }),
  };

  return NextResponse.json({
    stats,
    requests: requests.map(serializeRequest),
  });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.pharmacies.manage_context");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "");
  const action = String(body.action ?? "");
  const request = await db.pharmacyRequest.findUnique({
    where: { reference },
    include: {
      user: true,
      pharmacy: true,
      refunds: true,
      disputes: true,
    },
  });
  if (!request) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  const actor = access.session?.name ?? "Administration SABLIN";

  if (action === "refund") {
    if (!canRefund(access.role)) {
      return NextResponse.json({ error: "Permission remboursement insuffisante." }, { status: 403 });
    }
    if (request.refunds.some((refund) => refund.status === "Remboursé")) {
      return NextResponse.json({ error: "Cette demande a déjà été remboursée." }, { status: 409 });
    }
    const reason = String(body.reason ?? "Remboursement validé par l’administration").trim();
    const idempotencyKey = String(body.idempotencyKey ?? `refund-${request.id}`);
    const result = await db.$transaction(async (tx) => {
      const duplicate = await tx.requestRefund.findUnique({ where: { idempotencyKey } });
      if (duplicate?.status === "Remboursé") return { duplicate, balance: request.user.credits };
      const user = await tx.user.findUnique({ where: { id: request.userId }, select: { credits: true } });
      const before = user?.credits ?? 0;
      const after = before + request.creditCost;
      await tx.user.update({ where: { id: request.userId }, data: { credits: after } });
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: request.userId,
          type: "refund",
          amount: request.creditCost,
          description: `Remboursement ${request.reference} — ${reason}`,
          fcfaEquivalent: request.creditCost * CREDIT_FCFA_VALUE,
          balanceBefore: before,
          balanceAfter: after,
          status: "réussi",
        },
      });
      const refund = await tx.requestRefund.upsert({
        where: { idempotencyKey },
        update: {
          status: "Remboursé",
          transactionId: transaction.id,
          processedBy: actor,
          completedAt: new Date(),
        },
        create: {
          requestId: request.id,
          userId: request.userId,
          creditAmount: request.creditCost,
          fcfaEquivalent: request.creditCost * CREDIT_FCFA_VALUE,
          reason,
          status: "Remboursé",
          idempotencyKey,
          transactionId: transaction.id,
          processedBy: actor,
          completedAt: new Date(),
        },
      });
      await tx.pharmacyRequest.update({ where: { id: request.id }, data: { status: "Remboursée", closedAt: new Date() } });
      await tx.requestStatusHistory.create({
        data: {
          requestId: request.id,
          previousStatus: request.status,
          newStatus: "Remboursée",
          changedBy: actor,
          changedByRole: String(access.role ?? "Admin"),
          reason,
        },
      });
      await tx.notification.create({
        data: {
          userId: request.userId,
          type: "success",
          title: "Remboursement effectué",
          message: `${request.creditCost} crédit(s) recrédité(s) pour la demande ${request.reference}.`,
          icon: "CheckCircle2",
          link: "requests",
        },
      });
      return { refund, balance: after };
    });
    return NextResponse.json(result);
  }

  if (action === "remind") {
    await db.professionalActionLog.create({
      data: {
        scope: "admin",
        action: "request-reminder",
        label: "Relance pharmacie",
        entityType: "pharmacy-request",
        entityId: request.id,
        pharmacyId: request.pharmacyId,
        pharmacySlug: request.pharmacy.slug,
        actorRole: access.role,
        status: "réussi",
        message: `Relance envoyée pour ${request.reference}.`,
      },
    });
    await addRequestHistory({
      requestId: request.id,
      previousStatus: request.status,
      newStatus: request.status,
      changedBy: actor,
      changedByRole: String(access.role ?? "Admin"),
      reason: "Relance administrative envoyée.",
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "prolong") {
    const hours = Math.max(1, Math.min(24, Number(body.hours ?? 2)));
    const expiresAt = new Date(request.expiresAt.getTime() + hours * 60 * 60 * 1000);
    await db.pharmacyRequest.update({ where: { id: request.id }, data: { expiresAt } });
    await addRequestHistory({
      requestId: request.id,
      previousStatus: request.status,
      newStatus: request.status,
      changedBy: actor,
      changedByRole: String(access.role ?? "Admin"),
      reason: `Délai prolongé de ${hours}h.`,
    });
    return NextResponse.json({ ok: true, expiresAt });
  }

  if (action === "close") {
    await db.pharmacyRequest.update({ where: { id: request.id }, data: { status: "Fermée", closedAt: new Date() } });
    await addRequestHistory({
      requestId: request.id,
      previousStatus: request.status,
      newStatus: "Fermée",
      changedBy: actor,
      changedByRole: String(access.role ?? "Admin"),
      reason: String(body.reason ?? "Dossier clôturé par l’administration."),
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action admin non reconnue." }, { status: 400 });
}
