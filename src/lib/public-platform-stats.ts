import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export function publicPharmacyWhere(): Prisma.PharmacyWhereInput {
  return {
    accountStatus: "Validée",
    publicationStatus: "Publiée",
  };
}

export function publicMedicationWhere(extra: Prisma.MedicationWhereInput = {}): Prisma.MedicationWhereInput {
  return {
    status: "Actif",
    ...extra,
  };
}

export function publicInventoryWhere(extra: Prisma.PharmacyMedicationWhereInput = {}): Prisma.PharmacyMedicationWhereInput {
  return {
    publicationStatus: "Publiée",
    pharmacy: publicPharmacyWhere(),
    medication: publicMedicationWhere(),
    ...extra,
  };
}

export function publicPharmacyMediaWhere(extra: Prisma.PharmacyMediaWhereInput = {}): Prisma.PharmacyMediaWhereInput {
  return {
    visibility: "public",
    isPublic: true,
    isValidated: true,
    validationStatus: { in: ["Validée", "Publiée"] },
    pharmacy: publicPharmacyWhere(),
    ...extra,
  };
}

export async function getPublicPlatformStats() {
  const [medications, pharmacies, onDutyPharmacies, open247Pharmacies, publishedInventory, publicMedia] =
    await Promise.all([
      db.medication.count({ where: publicMedicationWhere() }),
      db.pharmacy.count({ where: publicPharmacyWhere() }),
      db.pharmacy.count({ where: { ...publicPharmacyWhere(), isOnDuty: true } }),
      db.pharmacy.count({ where: { ...publicPharmacyWhere(), isOpen247: true } }),
      db.pharmacyMedication.count({ where: publicInventoryWhere() }),
      db.pharmacyMedia.count({ where: publicPharmacyMediaWhere() }),
    ]);

  return {
    medications,
    pharmacies,
    onDutyPharmacies,
    open247Pharmacies,
    publishedInventory,
    publicMedia,
  };
}
