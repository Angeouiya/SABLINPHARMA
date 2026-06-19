import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const publicPharmacyWhere = {
    accountStatus: "Validée",
    publicationStatus: "Publiée",
  };

  const [
    medications,
    pharmacies,
    onDutyPharmacies,
    publishedInventory,
  ] = await Promise.all([
    db.medication.count({ where: { status: "Actif" } }),
    db.pharmacy.count({ where: publicPharmacyWhere }),
    db.pharmacy.count({ where: { ...publicPharmacyWhere, isOnDuty: true } }),
    db.pharmacyMedication.count({
      where: {
        publicationStatus: "Publiée",
        pharmacy: publicPharmacyWhere,
        medication: { status: "Actif" },
      },
    }),
  ]);

  return NextResponse.json({
    medications,
    pharmacies,
    onDutyPharmacies,
    publishedInventory,
  });
}
