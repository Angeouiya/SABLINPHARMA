import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  DATA_SOURCES,
  PUBLIC_AVAILABILITY_STATUSES,
  RELIABILITY_LEVELS,
  publicAvailabilityStatus,
} from "@/lib/pharmacy-platform";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "pharmacy.inventory.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug");

  if (!pharmacySlug && !hasPharmacyPermission(access.role, "manage_any_inventory")) {
    return NextResponse.json(
      { error: "Une pharmacie doit consulter uniquement son propre inventaire." },
      { status: 403 }
    );
  }

  const where = pharmacySlug
    ? { pharmacy: { slug: pharmacySlug } }
    : hasPharmacyPermission(access.role, "manage_any_inventory")
      ? {}
      : { pharmacy: { slug: access.session?.pharmacySlug } };
  const inventory = await db.pharmacyMedication.findMany({
    where,
    include: {
      pharmacy: true,
      medication: { include: { category: true } },
    },
    orderBy: { lastUpdatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    inventory: inventory.map((item) => ({
      id: item.id,
      pharmacy: item.pharmacy.name,
      medication: item.medication.name,
      dci: item.medication.genericName,
      dosage: item.medication.dosage,
      form: item.medication.form,
      category: item.medication.category?.name ?? "Autres",
      price: item.price,
      internalQuantity: item.internalQuantity,
      privateStatus: item.availabilityStatus,
      publicStatus: publicAvailabilityStatus({
        status: item.availabilityStatus,
        reliabilityLevel: item.reliabilityLevel,
        lastUpdatedAt: item.lastUpdatedAt,
      }),
      dataSource: item.dataSource,
      reliabilityLevel: item.reliabilityLevel,
      lastUpdatedAt: item.lastUpdatedAt,
      remark: item.remark,
    })),
  });
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "pharmacy.inventory.update");
  if (access.response) return access.response;

  const body = await req.json();
  const pharmacyId = String(body.pharmacyId ?? "");
  const medicationId = String(body.medicationId ?? "");
  const price = Number(body.price ?? 0);

  if (!pharmacyId || !medicationId || price <= 0) {
    return NextResponse.json(
      { error: "Pharmacie, médicament et prix indicatif sont obligatoires." },
      { status: 400 }
    );
  }

  const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  }
  if (
    !hasPharmacyPermission(access.role, "manage_any_inventory") &&
    access.session?.kind === "pharmacy" &&
    access.session.pharmacySlug !== pharmacy.slug
  ) {
    return NextResponse.json(
      { error: "Une pharmacie ne peut modifier que son propre inventaire." },
      { status: 403 }
    );
  }

  const availabilityStatus = PUBLIC_AVAILABILITY_STATUSES.includes(body.availabilityStatus)
    ? body.availabilityStatus
    : "À confirmer";
  const dataSource = DATA_SOURCES.includes(body.dataSource) ? body.dataSource : "Saisie pharmacie";
  const reliabilityLevel = RELIABILITY_LEVELS.includes(body.reliabilityLevel)
    ? body.reliabilityLevel
    : "À vérifier";

  const existing = await db.pharmacyMedication.findFirst({
    where: { pharmacyId, medicationId },
  });

  const internalQuantity =
    body.internalQuantity === undefined || body.internalQuantity === null || body.internalQuantity === ""
      ? null
      : Number(body.internalQuantity);
  const lowStockThreshold =
    body.lowStockThreshold === undefined || body.lowStockThreshold === null || body.lowStockThreshold === ""
      ? null
      : Number(body.lowStockThreshold);
  const autoStatusEnabled = Boolean(body.autoStatusEnabled);
  const computedAvailability =
    autoStatusEnabled && internalQuantity !== null
      ? internalQuantity <= 0
        ? "Rupture"
        : lowStockThreshold !== null && internalQuantity <= lowStockThreshold
          ? "Stock faible"
          : "Disponible"
      : availabilityStatus;

  const data = {
    price,
    inStock: computedAvailability !== "Rupture",
    availabilityStatus: computedAvailability,
    dataSource,
    reliabilityLevel,
    internalQuantity,
    lowStockThreshold,
    autoStatusEnabled,
    publicationStatus: String(body.publicationStatus ?? "Publiée"),
    priceUpdatedAt: new Date(),
    priceSource: dataSource,
    priceReliabilityLevel: reliabilityLevel,
    pricePublicationStatus: String(body.pricePublicationStatus ?? "Publiée"),
    modifiedByRole: access.role ?? null,
    modifiedByName: access.session?.name ?? null,
    internalRemark: String(body.internalRemark ?? "").trim() || null,
    remark: String(body.remark ?? "").trim() || null,
    lastUpdatedAt: new Date(),
  };

  const item = existing
    ? await db.pharmacyMedication.update({ where: { id: existing.id }, data })
    : await db.pharmacyMedication.create({ data: { pharmacyId, medicationId, ...data } });

  await db.pharmacy.update({
    where: { id: pharmacyId },
    data: { lastDataUpdate: new Date(), dataQuality: "Données à jour" },
  });

  await db.professionalActionLog.create({
    data: {
      scope: hasPharmacyPermission(access.role, "manage_any_inventory") ? "admin" : "pharmacy",
      action: existing ? "inventory-update" : "inventory-create",
      label: existing ? "Modification inventaire" : "Ajout inventaire",
      entityType: "pharmacy-medication",
      entityId: item.id,
      pharmacyId,
      pharmacySlug: pharmacy.slug,
      actorRole: access.role,
      status: "réussi",
      source: dataSource,
      newValue: JSON.stringify(data),
      message: "Inventaire mis à jour avec source, fiabilité et publication.",
    },
  });

  return NextResponse.json({ item });
}
