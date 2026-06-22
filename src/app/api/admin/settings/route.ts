import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getExternalEnrichmentAdminStatus } from "@/lib/enrichment/enrichment-service";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { DEFAULT_FRESHNESS_CONFIG } from "@/lib/pharmacy-platform";
import { PROFESSIONAL_SESSION_HOURS } from "@/lib/professional-sessions";

const SETTING_KEYS = {
  warningDays: "dataFreshness.warningDays",
  staleDays: "dataFreshness.staleDays",
  veryStaleDays: "dataFreshness.veryStaleDays",
} as const;

const DATA_FRESHNESS_DESCRIPTIONS = {
  [SETTING_KEYS.warningDays]: "Nombre de jours avant avertissement interne",
  [SETTING_KEYS.staleDays]: "Nombre de jours avant affichage public À confirmer",
  [SETTING_KEYS.veryStaleDays]: "Nombre de jours avant donnée très ancienne",
} as const;

function boolStatus(value: unknown) {
  return Boolean(String(value ?? "").trim());
}

function paymentConfigured() {
  return boolStatus(process.env.PAYDUNYA_MASTER_KEY) && boolStatus(process.env.PAYDUNYA_PRIVATE_KEY) && boolStatus(process.env.PAYDUNYA_TOKEN);
}

function cleanDays(value: unknown, label: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 365) {
    throw new Error(`${label} doit être compris entre 1 et 365 jours.`);
  }
  return Math.round(numeric);
}

async function readSettings() {
  const settings = await db.professionalSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  const byKey = new Map(settings.map((item) => [item.key, item]));
  const warning = byKey.get(SETTING_KEYS.warningDays);
  const stale = byKey.get(SETTING_KEYS.staleDays);
  const veryStale = byKey.get(SETTING_KEYS.veryStaleDays);
  return {
    warningDays: Number(warning?.value ?? DEFAULT_FRESHNESS_CONFIG.warningDays),
    staleDays: Number(stale?.value ?? DEFAULT_FRESHNESS_CONFIG.staleDays),
    veryStaleDays: Number(veryStale?.value ?? DEFAULT_FRESHNESS_CONFIG.veryStaleDays),
    updatedAt: [warning?.updatedAt, stale?.updatedAt, veryStale?.updatedAt]
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a))[0]?.toISOString() ?? null,
    updatedBy: veryStale?.updatedBy ?? stale?.updatedBy ?? warning?.updatedBy ?? null,
  };
}

async function buildSettingsPayload(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.dashboard.read");
  if (access.response) return { response: access.response };

  const canManage = hasPharmacyPermission(access.role, "admin.settings.manage");
  const [dataFreshness, enrichment, activeAdminSessions, adminAccounts, pharmacyAccounts, unreadAdminNotifications, criticalAdminNotifications, recentSensitiveActions, recentActions] =
    await Promise.all([
      readSettings(),
      getExternalEnrichmentAdminStatus(),
      db.professionalSessionRecord.count({ where: { kind: "admin", status: "ACTIVE", expiresAt: { gt: new Date() } } }),
      db.professionalAccount.count({ where: { kind: "admin", status: { not: "DELETED" } } }),
      db.professionalAccount.count({ where: { kind: "pharmacy", status: { not: "DELETED" } } }),
      db.securityNotification.count({ where: { platform: "admin", status: "non_lue" } }),
      db.securityNotification.count({
        where: { platform: "admin", type: { in: ["critical", "security", "alert", "payment_security"] }, status: { not: "archivée" } },
      }),
      db.professionalActionLog.count({ where: { scope: "admin", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      db.professionalActionLog.findMany({
        where: { scope: "admin" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, action: true, label: true, status: true, actorRole: true, createdAt: true, message: true },
      }),
    ]);

  return {
    payload: {
      canManage,
      dataFreshness,
      environment: {
        databaseConfigured: boolStatus(process.env.DATABASE_URL),
        supabaseConfigured: boolStatus(process.env.NEXT_PUBLIC_SUPABASE_URL) || boolStatus(process.env.SUPABASE_URL),
        sessionSecretConfigured: boolStatus(process.env.SABLIN_SESSION_SECRET) || boolStatus(process.env.NEXTAUTH_SECRET) || boolStatus(process.env.AUTH_SECRET),
        proSessionHours: PROFESSIONAL_SESSION_HOURS,
        paymentProviderMode: process.env.PAYDUNYA_MODE ?? process.env.PAYMENT_PROVIDER_MODE ?? "sandbox",
        paydunyaConfigured: paymentConfigured(),
        paymentWebhookConfigured: boolStatus(process.env.PAYMENT_WEBHOOK_SECRET),
        googleApiConfigured: enrichment.googleApiConfigured,
        googleSearchEngineConfigured: enrichment.googleSearchEngineConfigured,
      },
      enrichment,
      security: {
        activeAdminSessions,
        adminAccounts,
        pharmacyAccounts,
        unreadAdminNotifications,
        criticalAdminNotifications,
        recentSensitiveActions,
      },
      policies: [
        {
          title: "Stocks et prix détaillés",
          status: "Verrouillé serveur",
          detail: "Les disponibilités, prix détaillés et contacts ne sortent pas des API publiques sans droit confirmé.",
        },
        {
          title: "Paiements",
          status: "SUCCESS obligatoire",
          detail: "Aucun crédit ni Pass Ordonnance Unique n’est activé sur simple retour navigateur.",
        },
        {
          title: "Images marketplace",
          status: "Validation requise",
          detail: "Les images web restent candidates tant qu’une source/licence n’est pas validée.",
        },
        {
          title: "Séparation des espaces",
          status: "Sessions séparées",
          detail: "Utilisateur, Pharmacie et Admin utilisent des sessions et navigations distinctes.",
        },
      ],
      recentActions,
    },
  };
}

export async function GET(req: NextRequest) {
  const result = await buildSettingsPayload(req);
  if (result.response) return result.response;
  return NextResponse.json(result.payload);
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.settings.manage");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  let warningDays: number;
  let staleDays: number;
  let veryStaleDays: number;
  try {
    warningDays = cleanDays(body.warningDays, "Le délai d’avertissement");
    staleDays = cleanDays(body.staleDays, "Le délai de donnée à confirmer");
    veryStaleDays = cleanDays(body.veryStaleDays, "Le délai très ancien");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paramètres invalides." }, { status: 400 });
  }

  if (!(warningDays <= staleDays && staleDays <= veryStaleDays)) {
    return NextResponse.json({ error: "Les seuils doivent respecter : avertissement ≤ à confirmer ≤ très ancien." }, { status: 400 });
  }

  const previous = await readSettings();
  const updates = [
    [SETTING_KEYS.warningDays, warningDays],
    [SETTING_KEYS.staleDays, staleDays],
    [SETTING_KEYS.veryStaleDays, veryStaleDays],
  ] as const;

  await db.$transaction(async (tx) => {
    for (const [key, value] of updates) {
      await tx.professionalSetting.upsert({
        where: { key },
        update: { value: String(value), updatedBy: access.session?.name ?? access.role ?? null },
        create: {
          key,
          value: String(value),
          description: DATA_FRESHNESS_DESCRIPTIONS[key],
          updatedBy: access.session?.name ?? access.role ?? null,
        },
      });
    }
    await tx.professionalActionLog.create({
      data: {
        scope: "admin",
        action: "admin-settings-update",
        label: "Paramètres Admin",
        entityType: "professional-setting",
        actorRole: access.role,
        status: "réussi",
        oldValue: JSON.stringify(previous),
        newValue: JSON.stringify({ warningDays, staleDays, veryStaleDays }),
        message: "Seuils de fraîcheur globaux mis à jour depuis les paramètres Admin.",
      },
    });
  });

  const result = await buildSettingsPayload(req);
  if (result.response) return result.response;
  return NextResponse.json({ ...result.payload, message: "Paramètres Admin enregistrés et audités." });
}
