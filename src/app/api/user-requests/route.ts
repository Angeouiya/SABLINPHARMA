import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { createManualPharmacyRequest, serializeRequest, UserRequestError } from "@/lib/user-requests";
import type { UserServiceId } from "@/config/user-services";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });

  const requests = await db.pharmacyRequest.findMany({
    where: { userId: user.id },
    include: {
      pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
      medication: { select: { name: true, slug: true, dosage: true, form: true, packSize: true } },
      responses: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      disputes: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ requests: requests.map(serializeRequest) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    const result = await createManualPharmacyRequest({
      userId: user.id,
      pharmacyId: String(body.pharmacyId ?? ""),
      medicationId: body.medicationId ? String(body.medicationId) : null,
      prescriptionId: body.prescriptionId ? String(body.prescriptionId) : null,
      requestType: String(body.requestType ?? "") as UserServiceId,
      userMessage: body.userMessage ? String(body.userMessage) : null,
      requestedQuantity: body.requestedQuantity ? String(body.requestedQuantity) : null,
      dosage: body.dosage ? String(body.dosage) : null,
      form: body.form ? String(body.form) : null,
      packaging: body.packaging ? String(body.packaging) : null,
      preferredResponse: body.preferredResponse ? String(body.preferredResponse) : null,
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : req.headers.get("idempotency-key"),
    });
    return NextResponse.json(result, { status: result.reused ? 200 : 201 });
  } catch (error) {
    if (error instanceof UserRequestError) {
      return NextResponse.json({ error: error.message, ...error.details }, { status: error.status });
    }
    return NextResponse.json({ error: "Erreur lors de la création de la demande." }, { status: 500 });
  }
}
