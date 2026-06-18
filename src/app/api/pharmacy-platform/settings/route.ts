import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { DEFAULT_FRESHNESS_CONFIG } from "@/lib/pharmacy-platform";

const SETTING_KEYS = {
  warningDays: "dataFreshness.warningDays",
  staleDays: "dataFreshness.staleDays",
  veryStaleDays: "dataFreshness.veryStaleDays",
} as const;

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "view_all_pharmacies");
  if (access.response) return access.response;

  const settings = await db.professionalSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  const byKey = new Map(settings.map((item) => [item.key, item.value]));
  return NextResponse.json({
    dataFreshness: {
      warningDays: Number(byKey.get(SETTING_KEYS.warningDays) ?? DEFAULT_FRESHNESS_CONFIG.warningDays),
      staleDays: Number(byKey.get(SETTING_KEYS.staleDays) ?? DEFAULT_FRESHNESS_CONFIG.staleDays),
      veryStaleDays: Number(byKey.get(SETTING_KEYS.veryStaleDays) ?? DEFAULT_FRESHNESS_CONFIG.veryStaleDays),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "validate_pharmacy");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const updates = [
    [SETTING_KEYS.warningDays, body.warningDays, "Nombre de jours avant avertissement interne"],
    [SETTING_KEYS.staleDays, body.staleDays, "Nombre de jours avant affichage public À confirmer"],
    [SETTING_KEYS.veryStaleDays, body.veryStaleDays, "Nombre de jours avant donnée très ancienne"],
  ] as const;

  const saved: Awaited<ReturnType<typeof db.professionalSetting.upsert>>[] = [];
  for (const [key, value, description] of updates) {
    if (value === undefined || value === null || value === "") continue;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 365) {
      return NextResponse.json({ error: "Les délais doivent être compris entre 1 et 365 jours." }, { status: 400 });
    }
    saved.push(
      await db.professionalSetting.upsert({
        where: { key },
        update: { value: String(numeric), updatedBy: access.session?.name ?? access.role ?? null },
        create: { key, value: String(numeric), description, updatedBy: access.session?.name ?? access.role ?? null },
      })
    );
  }

  return NextResponse.json({ settings: saved });
}
