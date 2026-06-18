import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { addRequestHistory, serializeRequest } from "@/lib/user-requests";

async function loadRequest(reference: string, userId: string) {
  return db.pharmacyRequest.findFirst({
    where: { reference, userId },
    include: {
      pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
      medication: { select: { name: true, slug: true, dosage: true, form: true, packSize: true } },
      responses: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      disputes: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  const { reference } = await params;
  const request = await loadRequest(reference, user.id);
  if (!request) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  return NextResponse.json({ request: serializeRequest(request) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  const { reference } = await params;
  const body = await req.json().catch(() => ({}));
  const request = await db.pharmacyRequest.findFirst({ where: { reference, userId: user.id } });
  if (!request) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

  if (body.action === "open-dispute") {
    if (request.disputeAllowedUntil && request.disputeAllowedUntil < new Date()) {
      return NextResponse.json({ error: "La période de réclamation est dépassée." }, { status: 400 });
    }
    const dispute = await db.requestDispute.create({
      data: {
        requestId: request.id,
        userId: user.id,
        reason: String(body.reason ?? "autre"),
        description: String(body.description ?? "").trim(),
        status: "Nouveau",
      },
    });
    const previousStatus = request.status;
    await db.pharmacyRequest.update({ where: { id: request.id }, data: { status: "Litige" } });
    await addRequestHistory({
      requestId: request.id,
      previousStatus,
      newStatus: "Litige",
      changedBy: user.name,
      changedByRole: "Utilisateur",
      reason: dispute.reason,
    });
    return NextResponse.json({ dispute });
  }

  if (body.action === "cancel" && ["Nouvelle", "Reçue"].includes(request.status)) {
    await db.pharmacyRequest.update({ where: { id: request.id }, data: { status: "Annulée", closedAt: new Date() } });
    await addRequestHistory({
      requestId: request.id,
      previousStatus: request.status,
      newStatus: "Annulée",
      changedBy: user.name,
      changedByRole: "Utilisateur",
      reason: "Annulation avant traitement.",
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action non autorisée." }, { status: 400 });
}
