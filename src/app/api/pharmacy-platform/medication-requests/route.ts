import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { MEDICATION_ADD_REQUEST_STATUSES } from "@/lib/pharmacy-platform";

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "view_own_dashboard");
  if (access.response) return access.response;

  const isAdmin = hasPharmacyPermission(access.role, "view_all_pharmacies");
  const requests = await db.medicationAddRequest.findMany({
    where: isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } },
    include: {
      pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
      medication: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ requests, statuses: MEDICATION_ADD_REQUEST_STATUSES });
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "update_inventory");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const proposedName = String(body.proposedName ?? body.name ?? "").trim();
  if (!proposedName) {
    return NextResponse.json({ error: "Nom proposé obligatoire." }, { status: 400 });
  }

  const requestedSlug = String(body.pharmacySlug ?? access.session?.pharmacySlug ?? "").trim();
  const isAdmin = hasPharmacyPermission(access.role, "view_all_pharmacies");
  if (!isAdmin && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== requestedSlug) {
    return NextResponse.json({ error: "Une pharmacie ne peut créer une demande que pour elle-même." }, { status: 403 });
  }

  const pharmacy = requestedSlug ? await db.pharmacy.findUnique({ where: { slug: requestedSlug } }) : null;
  if (!pharmacy && !isAdmin) {
    return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  }

  const request = await db.medicationAddRequest.create({
    data: {
      pharmacyId: pharmacy?.id ?? null,
      proposedName,
      genericName: String(body.genericName ?? body.dci ?? "").trim() || null,
      dosage: String(body.dosage ?? "").trim() || null,
      form: String(body.form ?? "").trim() || null,
      packaging: String(body.packaging ?? body.conditionnement ?? "").trim() || null,
      manufacturer: String(body.manufacturer ?? body.laboratoire ?? "").trim() || null,
      photoUrl: String(body.photoUrl ?? "").trim() || null,
      remark: String(body.remark ?? "").trim() || null,
      status: "En attente",
      createdByRole: access.role ?? "Pharmacien responsable",
    },
  });

  await db.professionalActionLog.create({
    data: {
      scope: isAdmin ? "admin" : "pharmacy",
      action: "medication-add-request",
      label: "Demande d’ajout au référentiel",
      entityType: "medication-add-request",
      entityId: request.id,
      pharmacyId: pharmacy?.id ?? null,
      pharmacySlug: pharmacy?.slug ?? null,
      actorRole: access.role,
      status: "à vérifier",
      message: "Demande ajoutée à la file de validation du référentiel.",
      newValue: JSON.stringify(request),
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "validate_pharmacy");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  if (!id || !(MEDICATION_ADD_REQUEST_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Identifiant et statut valide obligatoires." }, { status: 400 });
  }

  const updated = await db.medicationAddRequest.update({
    where: { id },
    data: {
      status,
      medicationId: String(body.medicationId ?? "").trim() || undefined,
      reviewedBy: access.session?.name ?? access.role ?? null,
      reviewedAt: new Date(),
    },
  });

  await db.professionalActionLog.create({
    data: {
      scope: "admin",
      action: "medication-add-request-review",
      label: "Validation demande référentiel",
      entityType: "medication-add-request",
      entityId: updated.id,
      actorRole: access.role,
      status: "réussi",
      message: `Demande référentiel mise à jour : ${status}.`,
      newValue: JSON.stringify(updated),
    },
  });

  return NextResponse.json({ request: updated });
}
