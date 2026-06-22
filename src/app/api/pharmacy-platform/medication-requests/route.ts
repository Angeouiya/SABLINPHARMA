import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { MEDICATION_ADD_REQUEST_STATUSES } from "@/lib/pharmacy-platform";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueMedicationSlug(name: string) {
  const base = slugify(name) || "medicament";
  let slug = base;
  let index = 1;
  while (await db.medication.findUnique({ where: { slug }, select: { id: true } })) {
    index += 1;
    slug = `${base}-${index}`;
  }
  return slug;
}

async function defaultCategory() {
  const slug = "autres";
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return existing;
  return db.category.create({
    data: {
      name: "Autres",
      slug,
      iconName: "Pill",
      color: "#0f8a5f",
      description: "Catégorie par défaut du référentiel SABLIN PHARMA.",
    },
  });
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "view_own_dashboard");
  if (access.response) return access.response;

  const isAdmin = hasPharmacyPermission(access.role, "view_all_pharmacies");
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "all";
  const pharmacySlug = searchParams.get("pharmacySlug")?.trim() ?? "";
  const where = {
    ...(isAdmin
      ? pharmacySlug && pharmacySlug !== "all"
        ? { pharmacy: { slug: pharmacySlug } }
        : {}
      : { pharmacy: { slug: access.session?.pharmacySlug } }),
    ...(status && status !== "all" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { proposedName: { contains: q } },
            { genericName: { contains: q } },
            { dosage: { contains: q } },
            { form: { contains: q } },
            { manufacturer: { contains: q } },
            { pharmacy: { name: { contains: q } } },
          ],
        }
      : {}),
  };
  const requests = await db.medicationAddRequest.findMany({
    where,
    include: {
      pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
      medication: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const [total, pending, analysis, validated, refused, merged] = await Promise.all([
    db.medicationAddRequest.count({ where: isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } } }),
    db.medicationAddRequest.count({ where: { ...(isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } }), status: "En attente" } }),
    db.medicationAddRequest.count({ where: { ...(isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } }), status: "En analyse" } }),
    db.medicationAddRequest.count({ where: { ...(isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } }), status: "Validée" } }),
    db.medicationAddRequest.count({ where: { ...(isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } }), status: "Refusée" } }),
    db.medicationAddRequest.count({ where: { ...(isAdmin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } }), status: "Fusionnée avec un médicament existant" } }),
  ]);

  return NextResponse.json({
    requests,
    statuses: MEDICATION_ADD_REQUEST_STATUSES,
    summary: {
      total,
      pending,
      analysis,
      validated,
      refused,
      merged,
      visible: requests.length,
    },
  });
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

  const current = await db.medicationAddRequest.findUnique({
    where: { id },
    include: { medication: true },
  });
  if (!current) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

  const requestedMedicationId = String(body.medicationId ?? "").trim();
  let medicationId: string | null = requestedMedicationId || current.medicationId || null;
  let finalStatus = status;

  if (status === "Validée" && !medicationId) {
    const genericName = current.genericName?.trim();
    const dosage = current.dosage?.trim();
    const form = current.form?.trim();
    if (!genericName || !dosage || !form) {
      return NextResponse.json(
        { error: "DCI, dosage et forme sont obligatoires pour créer un médicament référentiel." },
        { status: 400 }
      );
    }
    const existing = await db.medication.findFirst({
      where: {
        OR: [
          { name: { contains: current.proposedName } },
          { genericName, dosage, form },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      medicationId = existing.id;
      finalStatus = "Fusionnée avec un médicament existant";
    } else {
      const category = await defaultCategory();
      const created = await db.medication.create({
        data: {
          name: current.proposedName,
          slug: await uniqueMedicationSlug(`${current.proposedName}-${dosage}-${form}`),
          genericName,
          categoryId: category.id,
          dosage,
          form,
          packSize: current.packaging?.trim() || "Conditionnement à préciser",
          packaging: current.packaging?.trim() || null,
          manufacturer: current.manufacturer?.trim() || null,
          verificationStatus: "Validé",
          verifiedAt: new Date(),
          verifiedBy: access.session?.name ?? access.role ?? "Admin SABLIN",
          confidenceLevel: 85,
          status: "Actif",
          description: `${current.proposedName} (${genericName}) ${dosage} ${form}. Les informations présentées sont indicatives et ne remplacent pas le conseil d’un pharmacien ou d’un professionnel de santé.`,
          shortDescription: `${genericName} ${dosage} · ${form}`,
          requiresRx: false,
          avgPrice: 0,
        },
      });
      medicationId = created.id;
    }
  }

  if (status === "Fusionnée avec un médicament existant" && !medicationId) {
    return NextResponse.json({ error: "Sélectionnez le médicament existant à fusionner." }, { status: 400 });
  }

  const updated = await db.medicationAddRequest.update({
    where: { id },
    data: {
      status: finalStatus,
      medicationId: medicationId || undefined,
      reviewedBy: access.session?.name ?? access.role ?? null,
      reviewedAt: new Date(),
    },
  });

  if (finalStatus === "Fusionnée avec un médicament existant" && medicationId) {
    const alias = current.proposedName.trim();
    const normalizedAlias = slugify(alias);
    const existingAlias = await db.medicationAlias.findFirst({
      where: { medicationId, normalizedAlias },
      select: { id: true },
    });
    if (!existingAlias && normalizedAlias) {
      await db.medicationAlias.create({
        data: {
          medicationId,
          alias,
          normalizedAlias,
          source: "Demande pharmacie validée par l’administration",
        },
      });
    }
  }

  await db.professionalActionLog.create({
    data: {
      scope: "admin",
      action: "medication-add-request-review",
      label: "Validation demande référentiel",
      entityType: "medication-add-request",
      entityId: updated.id,
      actorRole: access.role,
      status: "réussi",
      oldValue: JSON.stringify({ status: current.status, medicationId: current.medicationId }),
      message: `Demande référentiel mise à jour : ${finalStatus}.`,
      newValue: JSON.stringify({ status: updated.status, medicationId: updated.medicationId }),
    },
  });

  return NextResponse.json({ request: updated });
}
