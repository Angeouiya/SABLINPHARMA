import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lockedFeaturePayload } from "@/lib/credit-gates";
import { buildMedicationPlaceholderUrl } from "@/lib/medication-enrichment";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { publicMedicationWhere } from "@/lib/public-platform-stats";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueMedicationSlug(name: string, id?: string) {
  const base = slugify(name) || "medicament";
  let slug = base;
  let index = 1;
  while (await db.medication.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } })) {
    index += 1;
    slug = `${base}-${index}`;
  }
  return slug;
}

async function categoryForName(name: string | null | undefined) {
  const label = String(name ?? "Autres").trim() || "Autres";
  const existing = await db.category.findFirst({ where: { OR: [{ name: label }, { slug: slugify(label) }] } });
  if (existing) return existing;
  return db.category.create({
    data: {
      name: label,
      slug: slugify(label) || "autres",
      description: "Catégorie créée depuis le référentiel Admin SABLIN PHARMA.",
      iconName: "Pill",
      color: "#0f8a5f",
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  if (scope === "admin") {
    const access = requirePharmacyPermission(req, "admin.medications.read");
    if (access.response) return access.response;

    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "all";
    const verificationStatus = searchParams.get("verificationStatus")?.trim() ?? "all";
    const limit = Math.min(Number(searchParams.get("limit") ?? 120) || 120, 250);
    const where = {
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { genericName: { contains: q } },
              { dosage: { contains: q } },
              { form: { contains: q } },
              { manufacturer: { contains: q } },
              { barcode: { contains: q } },
            ],
          }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(verificationStatus !== "all" ? { verificationStatus } : {}),
    };

    const [medications, categories, total, active, published, toVerify, inactive, requestsPending] = await Promise.all([
      db.medication.findMany({
        where,
        orderBy: [{ verificationStatus: "asc" }, { name: "asc" }],
        take: limit,
        include: {
          category: true,
          _count: { select: { pharmacies: true, addRequests: true, images: true, aliases: true } },
        },
      }),
      db.category.findMany({ orderBy: { name: "asc" } }),
      db.medication.count(),
      db.medication.count({ where: { status: "Actif" } }),
      db.medication.count({ where: { verificationStatus: { in: ["Publié", "Publiée", "Validé"] } } }),
      db.medication.count({ where: { verificationStatus: { in: ["À vérifier", "Conflit"] } } }),
      db.medication.count({ where: { status: "Inactif" } }),
      db.medicationAddRequest.count({ where: { status: { in: ["En attente", "En analyse"] } } }),
    ]);

    return NextResponse.json({
      medications: medications.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        genericName: item.genericName,
        dosage: item.dosage,
        form: item.form,
        packSize: item.packSize,
        packaging: item.packaging,
        manufacturer: item.manufacturer,
        barcode: item.barcode ? "Référencé" : null,
        category: item.category,
        status: item.status,
        verificationStatus: item.verificationStatus,
        confidenceLevel: item.confidenceLevel,
        requiresRx: item.requiresRx,
        avgPrice: item.avgPrice,
        verifiedAt: item.verifiedAt,
        verifiedBy: item.verifiedBy,
        createdAt: item.createdAt,
        counts: item._count,
      })),
      categories,
      summary: {
        total,
        active,
        published,
        toVerify,
        inactive,
        requestsPending,
        visible: medications.length,
      },
    });
  }

  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const where: Record<string, unknown> = publicMedicationWhere();
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { genericName: { contains: q } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }

  const meds = await db.medication.findMany({
    where,
    include: {
      category: true,
      images: {
        where: { validationStatus: "Publiée" },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      descriptions: {
        where: { validationStatus: "Publiée" },
        orderBy: [{ validatedAt: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  const result = meds.map((m) => {
    const image = m.images.find((item) => item.validationStatus === "Publiée") ?? m.images[0];
    const description = m.descriptions[0];
    const imageUrl = image?.url ?? buildMedicationPlaceholderUrl({
      name: m.name,
      genericName: m.genericName,
      dosage: m.dosage,
      form: m.form,
    });
    return ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    genericName: m.genericName,
    categoryId: m.categoryId,
    category: m.category,
    form: m.form,
    dosage: m.dosage,
    packSize: m.packSize,
    description: description?.shortText ?? m.shortDescription ?? m.description,
    imageUrl,
    imageBadge: image
      ? image.isPlaceholder
        ? "Image illustrative"
        : image.imageType === "pharmacy_photo"
          ? "Photo fournie par une pharmacie"
          : "Photo officielle"
      : "Image illustrative",
    imageAttribution: image?.attributionText ?? null,
    informationBadge: "Information générale",
    verificationStatus: m.verificationStatus,
    requiresRx: m.requiresRx,
    avgPrice: null,
    priceLocked: true,
    priceLabel: "Prix verrouillé — 1 crédit",
    createdAt: m.createdAt,
    availabilityLocked: true,
    availabilityLabel: "Disponibilité verrouillée — 1 crédit",
    pharmacyCountLocked: true,
    access: lockedFeaturePayload({
      featureKey: "seeMedicationPharmacies",
      isAuthenticated: false,
    }),
  });
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.create");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const genericName = String(body.genericName ?? body.dci ?? "").trim();
  const dosage = String(body.dosage ?? "").trim();
  const form = String(body.form ?? "").trim();
  if (!name || !genericName || !dosage || !form) {
    return NextResponse.json({ error: "Nom commercial, DCI, dosage et forme sont obligatoires." }, { status: 400 });
  }

  const category = await categoryForName(String(body.category ?? body.categoryName ?? "Autres").trim());
  const medication = await db.medication.create({
    data: {
      name,
      slug: await uniqueMedicationSlug(`${name}-${dosage}-${form}`),
      genericName,
      categoryId: category.id,
      form,
      dosage,
      packSize: String(body.packSize ?? body.packaging ?? "Conditionnement à préciser").trim() || "Conditionnement à préciser",
      packaging: String(body.packaging ?? "").trim() || null,
      manufacturer: String(body.manufacturer ?? "").trim() || null,
      barcode: String(body.barcode ?? "").trim() || null,
      verificationStatus: String(body.verificationStatus ?? "Validé"),
      verifiedAt: new Date(),
      verifiedBy: access.session?.name ?? access.role ?? "Admin SABLIN",
      confidenceLevel: Number(body.confidenceLevel ?? 90),
      status: "Actif",
      description:
        String(body.description ?? "").trim() ||
        `${name} (${genericName}) ${dosage} ${form}. Les informations présentées sont indicatives et ne remplacent pas le conseil d’un pharmacien ou d’un professionnel de santé.`,
      shortDescription: String(body.shortDescription ?? "").trim() || `${genericName} ${dosage} · ${form}`,
      requiresRx: Boolean(body.requiresRx),
      avgPrice: Math.max(0, Number(body.avgPrice ?? 0) || 0),
    },
  });

  await db.professionalActionLog.create({
    data: {
      scope: "admin",
      action: "medication-reference-created",
      label: "Ajout référentiel médicaments",
      entityType: "medication",
      entityId: medication.id,
      actorRole: access.role,
      status: "réussi",
      message: `${name} ajouté au référentiel central.`,
      newValue: JSON.stringify({ name, genericName, dosage, form, category: category.name }),
    },
  });

  return NextResponse.json({ medication }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  const action = String(body.action ?? "update").trim();
  if (!id) return NextResponse.json({ error: "Médicament obligatoire." }, { status: 400 });

  const current = await db.medication.findUnique({ where: { id }, include: { category: true } });
  if (!current) return NextResponse.json({ error: "Médicament introuvable." }, { status: 404 });

  if (action === "disable") {
    const updated = await db.medication.update({
      where: { id },
      data: { status: "Inactif", verificationStatus: "Archivé" },
    });
    await db.professionalActionLog.create({
      data: {
        scope: "admin",
        action: "medication-reference-disabled",
        label: "Désactivation référentiel",
        entityType: "medication",
        entityId: id,
        actorRole: access.role,
        status: "réussi",
        oldValue: JSON.stringify({ status: current.status, verificationStatus: current.verificationStatus }),
        newValue: JSON.stringify({ status: updated.status, verificationStatus: updated.verificationStatus }),
      },
    });
    return NextResponse.json({ medication: updated });
  }

  const nextName = String(body.name ?? current.name).trim();
  const category = body.category ? await categoryForName(String(body.category)) : current.category;
  const updated = await db.medication.update({
    where: { id },
    data: {
      name: nextName,
      slug: nextName !== current.name ? await uniqueMedicationSlug(`${nextName}-${current.dosage}-${current.form}`, id) : current.slug,
      genericName: String(body.genericName ?? current.genericName).trim(),
      categoryId: category.id,
      dosage: String(body.dosage ?? current.dosage).trim(),
      form: String(body.form ?? current.form).trim(),
      packSize: String(body.packSize ?? current.packSize).trim(),
      packaging: String(body.packaging ?? current.packaging ?? "").trim() || null,
      manufacturer: String(body.manufacturer ?? current.manufacturer ?? "").trim() || null,
      barcode: String(body.barcode ?? current.barcode ?? "").trim() || null,
      verificationStatus: String(body.verificationStatus ?? current.verificationStatus),
      verifiedAt: new Date(),
      verifiedBy: access.session?.name ?? access.role ?? current.verifiedBy,
      confidenceLevel: Number(body.confidenceLevel ?? current.confidenceLevel),
      status: String(body.status ?? current.status),
      shortDescription: String(body.shortDescription ?? current.shortDescription ?? "").trim() || current.shortDescription,
      description: String(body.description ?? current.description).trim(),
      requiresRx: typeof body.requiresRx === "boolean" ? body.requiresRx : current.requiresRx,
      avgPrice: Math.max(0, Number(body.avgPrice ?? current.avgPrice) || 0),
    },
  });

  await db.professionalActionLog.create({
    data: {
      scope: "admin",
      action: "medication-reference-updated",
      label: "Mise à jour référentiel",
      entityType: "medication",
      entityId: id,
      actorRole: access.role,
      status: "réussi",
      oldValue: JSON.stringify({ name: current.name, status: current.status, verificationStatus: current.verificationStatus }),
      newValue: JSON.stringify({ name: updated.name, status: updated.status, verificationStatus: updated.verificationStatus }),
    },
  });

  return NextResponse.json({ medication: updated });
}
