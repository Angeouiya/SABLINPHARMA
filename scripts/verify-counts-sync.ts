import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import {
  getPublicPlatformStats,
  publicInventoryWhere,
  publicMedicationWhere,
  publicPharmacyMediaWhere,
  publicPharmacyWhere,
} from "../src/lib/public-platform-stats";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const root = process.cwd();
  const publicStats = await getPublicPlatformStats();
  const direct = {
    medications: await db.medication.count({ where: publicMedicationWhere() }),
    pharmacies: await db.pharmacy.count({ where: publicPharmacyWhere() }),
    onDutyPharmacies: await db.pharmacy.count({ where: { ...publicPharmacyWhere(), isOnDuty: true } }),
    open247Pharmacies: await db.pharmacy.count({ where: { ...publicPharmacyWhere(), isOpen247: true } }),
    publishedInventory: await db.pharmacyMedication.count({ where: publicInventoryWhere() }),
    publicMedia: await db.pharmacyMedia.count({ where: publicPharmacyMediaWhere() }),
  };

  for (const key of Object.keys(direct) as Array<keyof typeof direct>) {
    expect(publicStats[key] === direct[key], `Public stat mismatch for ${key}: ${publicStats[key]} !== ${direct[key]}`);
  }

  const sourceChecks = [
    "src/app/api/public-stats/route.ts",
    "src/app/api/pharmacies/route.ts",
    "src/app/api/medications/route.ts",
    "src/app/api/platform-sync/overview/route.ts",
  ];
  for (const file of sourceChecks) {
    const content = fs.readFileSync(path.join(root, file), "utf8");
    expect(content.includes("public-platform-stats"), `${file} does not use the shared public-platform-stats helper.`);
  }

  console.log(
    `OK counts sync: ${publicStats.medications} medications, ${publicStats.pharmacies} pharmacies, ${publicStats.onDutyPharmacies} on-duty pharmacies.`
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
