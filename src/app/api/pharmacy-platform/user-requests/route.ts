import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { addRequestHistory, REQUEST_RESPONSE_STATUSES, serializeRequest } from "@/lib/user-requests";

function canManageAny(role: Parameters<typeof hasPharmacyPermission>[0]) {
  return hasPharmacyPermission(role, "admin.pharmacies.manage_context") || hasPharmacyPermission(role, "admin.imports.manage");
}

async function loadRequestForProfessional(reference: string, pharmacySlug?: string | null) {
  return db.pharmacyRequest.findFirst({
    where: { reference, ...(pharmacySlug ? { pharmacy: { slug: pharmacySlug } } : {}) },
    include: {
      user: { select: { name: true, commune: true } },
      pharmacy: { select: { id: true, name: true, slug: true, commune: true, district: true } },
      medication: { select: { id: true, name: true, slug: true, dosage: true, form: true, packSize: true } },
      responses: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      disputes: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "pharmacy.requests.read");
  if (access.response) return access.response;
  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug") || access.session?.pharmacySlug;
  const status = searchParams.get("status") || "all";
  const workflow = searchParams.get("workflow") || "all";
  const priority = searchParams.get("priority") || "all";
  const query = (searchParams.get("q") || "").trim();

  if (!canManageAny(access.role) && access.session?.kind === "pharmacy" && pharmacySlug !== access.session.pharmacySlug) {
    return NextResponse.json({ error: "Une pharmacie ne peut consulter que ses propres demandes." }, { status: 403 });
  }

  const where: Prisma.PharmacyRequestWhereInput = canManageAny(access.role) && !pharmacySlug ? {} : { pharmacy: { slug: pharmacySlug ?? "" } };
  if (status !== "all") where.status = status;
  if (priority !== "all") where.priority = priority;
  if (workflow === "confirmations") where.requestType = { in: ["confirm_availability", "confirm_price", "confirm_full"] };
  if (workflow === "advice") where.requestType = "advice_pharmacy";
  if (query) {
    where.OR = [
      { reference: { contains: query } },
      { serviceName: { contains: query } },
      { medication: { name: { contains: query } } },
      { userMessage: { contains: query } },
    ];
  }

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
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 150,
  });

  const statsWhere: Prisma.PharmacyRequestWhereInput = canManageAny(access.role) && !pharmacySlug ? {} : { pharmacy: { slug: pharmacySlug ?? "" } };
  if (workflow === "confirmations") statsWhere.requestType = { in: ["confirm_availability", "confirm_price", "confirm_full"] };
  if (workflow === "advice") statsWhere.requestType = "advice_pharmacy";
  const [total, fresh, inProgress, answered, expired, highPriority] = await Promise.all([
    db.pharmacyRequest.count({ where: statsWhere }),
    db.pharmacyRequest.count({ where: { ...statsWhere, status: "Nouvelle" } }),
    db.pharmacyRequest.count({ where: { ...statsWhere, status: { in: ["Reçue", "Acceptée", "En cours"] } } }),
    db.pharmacyRequest.count({ where: { ...statsWhere, status: "Répondue" } }),
    db.pharmacyRequest.count({ where: { ...statsWhere, status: { in: ["Expirée", "Refusée", "Annulée"] } } }),
    db.pharmacyRequest.count({ where: { ...statsWhere, priority: "Haute" } }),
  ]);

  return NextResponse.json({
    requests: requests.map(serializeRequest),
    pending: fresh + inProgress,
    stats: { total, new: fresh, inProgress, answered, expired, highPriority },
    filters: { status, workflow, priority, query },
  });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "pharmacy.requests.respond");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "");
  const targetSlug = body.pharmacySlug ? String(body.pharmacySlug) : access.session?.pharmacySlug;
  if (!reference) return NextResponse.json({ error: "Référence obligatoire." }, { status: 400 });
  if (!canManageAny(access.role) && access.session?.kind === "pharmacy" && targetSlug !== access.session.pharmacySlug) {
    return NextResponse.json({ error: "Une pharmacie ne peut traiter que ses propres demandes." }, { status: 403 });
  }

  const request = await loadRequestForProfessional(reference, canManageAny(access.role) ? targetSlug : access.session?.pharmacySlug);
  if (!request) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

  const actor = access.session?.name ?? "Espace pharmacie";
  const actorRole = access.role ?? "Pharmacie";
  const action = String(body.action ?? "");

  if (action === "mark-received" || action === "accept" || action === "take") {
    const status = action === "mark-received" ? "Reçue" : action === "accept" ? "Acceptée" : "En cours";
    await db.pharmacyRequest.update({
      where: { id: request.id },
      data: {
        status,
        receivedAt: action === "mark-received" ? new Date() : request.receivedAt,
        acceptedAt: action === "accept" ? new Date() : request.acceptedAt,
        assignedToName: action === "take" ? actor : request.assignedToName,
        assignedToId: action === "take" ? access.session?.accountId ?? null : request.assignedToId,
        assignedAt: action === "take" ? new Date() : request.assignedAt,
        assignedBy: action === "take" ? actor : request.assignedBy,
      },
    });
    await addRequestHistory({ requestId: request.id, previousStatus: request.status, newStatus: status, changedBy: actor, changedByRole: actorRole });
    await db.notification.create({
      data: {
        userId: request.userId,
        type: "info",
        title: "Demande prise en charge",
        message: `Votre demande ${request.reference} est maintenant ${status.toLowerCase()} par ${request.pharmacy.name}.`,
        icon: "Bell",
        link: "requests",
      },
    });
    return NextResponse.json({ ok: true, status });
  }

  if (action === "refuse") {
    const reason = String(body.reason ?? "").trim();
    if (!reason) return NextResponse.json({ error: "Motif de refus obligatoire." }, { status: 400 });
    await db.pharmacyRequest.update({ where: { id: request.id }, data: { status: "Refusée", closedAt: new Date() } });
    await addRequestHistory({ requestId: request.id, previousStatus: request.status, newStatus: "Refusée", changedBy: actor, changedByRole: actorRole, reason });
    await db.notification.create({
      data: {
        userId: request.userId,
        type: "warning",
        title: "Demande refusée",
        message: `${request.pharmacy.name} ne peut pas traiter la demande ${request.reference}. Motif : ${reason}`,
        icon: "AlertTriangle",
        link: "requests",
      },
    });
    return NextResponse.json({ ok: true, status: "Refusée" });
  }

  if (action === "respond") {
    const availabilityStatus = body.availabilityStatus ? String(body.availabilityStatus) : null;
    const confirmedPrice = body.confirmedPrice === undefined || body.confirmedPrice === "" ? null : Number(body.confirmedPrice);
    const responseMessage = String(body.responseMessage ?? "").trim();
    if (!responseMessage || responseMessage.length < 6) {
      return NextResponse.json({ error: "Réponse structurée obligatoire." }, { status: 400 });
    }
    if (availabilityStatus && !(REQUEST_RESPONSE_STATUSES as readonly string[]).includes(availabilityStatus)) {
      return NextResponse.json({ error: "Statut de disponibilité invalide." }, { status: 400 });
    }
    if (confirmedPrice !== null && (!Number.isFinite(confirmedPrice) || confirmedPrice <= 0)) {
      return NextResponse.json({ error: "Prix confirmé invalide." }, { status: 400 });
    }

    let oldInventoryValue: string | null = null;
    let newInventoryValue: string | null = null;
    if (body.updateInventory && request.medicationId && (availabilityStatus || confirmedPrice)) {
      const current = await db.pharmacyMedication.findFirst({
        where: { pharmacyId: request.pharmacy.id, medicationId: request.medicationId },
      });
      oldInventoryValue = current ? JSON.stringify({ price: current.price, status: current.availabilityStatus }) : null;
      const price = confirmedPrice ?? current?.price ?? 0;
      if (price > 0) {
        const data = {
          price,
          availabilityStatus: availabilityStatus ?? current?.availabilityStatus ?? "À confirmer",
          inStock: (availabilityStatus ?? current?.availabilityStatus) !== "Rupture",
          dataSource: "Confirmation utilisateur",
          reliabilityLevel: "Confirmé",
          priceUpdatedAt: confirmedPrice ? new Date() : current?.priceUpdatedAt ?? null,
          priceSource: confirmedPrice ? "Confirmation utilisateur" : current?.priceSource ?? null,
          lastUpdatedAt: new Date(),
          verifiedAt: new Date(),
          verifiedBy: actor,
        };
        if (current) await db.pharmacyMedication.update({ where: { id: current.id }, data });
        else await db.pharmacyMedication.create({ data: { pharmacyId: request.pharmacy.id, medicationId: request.medicationId, ...data } });
        newInventoryValue = JSON.stringify({ price: data.price, status: data.availabilityStatus });
      }
    }

    const response = await db.pharmacyRequestResponse.create({
      data: {
        requestId: request.id,
        responderId: access.session?.accountId ?? null,
        responderName: actor,
        responderRole: String(actorRole),
        availabilityStatus,
        confirmedPrice,
        packaging: body.packaging ? String(body.packaging) : null,
        responseMessage,
        validUntil: body.validUntil ? new Date(String(body.validUntil)) : new Date(Date.now() + 2 * 60 * 60 * 1000),
        dataSource: canManageAny(access.role) ? "Saisie administrateur après échange avec la pharmacie" : "Saisie pharmacie",
        updateInventory: Boolean(body.updateInventory),
        oldInventoryValue,
        newInventoryValue,
      },
    });
    await db.pharmacyRequest.update({ where: { id: request.id }, data: { status: "Répondue", respondedAt: new Date() } });
    await addRequestHistory({ requestId: request.id, previousStatus: request.status, newStatus: "Répondue", changedBy: actor, changedByRole: actorRole, reason: "Réponse transmise à l’utilisateur." });
    await db.notification.create({
      data: {
        userId: request.userId,
        type: "success",
        title: "Réponse disponible",
        message: `${request.pharmacy.name} a répondu à votre demande ${request.reference}.`,
        icon: "CheckCircle2",
        link: "requests",
      },
    });
    return NextResponse.json({ response, status: "Répondue" });
  }

  return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
}
