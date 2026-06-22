import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { DEFAULT_FRESHNESS_CONFIG } from "@/lib/pharmacy-platform";

const SETTING_KEYS = {
  warningDays: "dataFreshness.warningDays",
  staleDays: "dataFreshness.staleDays",
  veryStaleDays: "dataFreshness.veryStaleDays",
} as const;

const DEFAULT_PHARMACY_WORKSPACE_SETTINGS = {
  autoPublishSafeInventory: true,
  requireManagerReviewForImages: true,
  dailyOperationsDigest: true,
  allowAdminAssistance: true,
  publicProfileChecklist: true,
  reminderFrequency: "daily",
  preferredSupportChannel: "email",
  supportPriority: "normal",
  supportTopic: "Synchronisation des données",
  supportMessage: "",
};

function requestedKind(req: NextRequest) {
  const kind = req.headers.get("x-sablin-session-kind");
  return kind === "pharmacy" || kind === "admin" ? kind : undefined;
}

function parseSettings(value?: string | null) {
  if (!value) return DEFAULT_PHARMACY_WORKSPACE_SETTINGS;
  try {
    const parsed = JSON.parse(value);
    return {
      ...DEFAULT_PHARMACY_WORKSPACE_SETTINGS,
      ...(parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}),
    };
  } catch {
    return DEFAULT_PHARMACY_WORKSPACE_SETTINGS;
  }
}

function cleanBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanOption(value: unknown, allowed: string[], fallback: string) {
  const text = String(value ?? "").trim();
  return allowed.includes(text) ? text : fallback;
}

async function resolveOwnPharmacy(req: NextRequest, permission: "pharmacy.profile.read" | "pharmacy.settings.update") {
  const { searchParams } = new URL(req.url);
  const requestedSlug = searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, permission, { pharmacySlug: requestedSlug });
  if (access.response) return { access, pharmacy: null };
  const pharmacySlug = requestedSlug || access.session?.pharmacySlug;
  const pharmacy = pharmacySlug
    ? await db.pharmacy.findUnique({
        where: { slug: pharmacySlug },
        include: { _count: { select: { media: true, medications: true, userRequests: true, professionalMemberships: true } } },
      })
    : null;
  if (!pharmacy) return { access, pharmacy: null };
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return { access, pharmacy: null };
  }
  return { access, pharmacy };
}

async function getAdminSettings(req: NextRequest) {
  const access = requirePharmacyPermission(req, "view_all_pharmacies");
  if (access.response) return access.response;

  const settings = await db.professionalSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } },
  });
  const byKey = new Map(settings.map((item) => [item.key, item.value]));
  return NextResponse.json({
    scope: "admin",
    dataFreshness: {
      warningDays: Number(byKey.get(SETTING_KEYS.warningDays) ?? DEFAULT_FRESHNESS_CONFIG.warningDays),
      staleDays: Number(byKey.get(SETTING_KEYS.staleDays) ?? DEFAULT_FRESHNESS_CONFIG.staleDays),
      veryStaleDays: Number(byKey.get(SETTING_KEYS.veryStaleDays) ?? DEFAULT_FRESHNESS_CONFIG.veryStaleDays),
    },
  });
}

export async function GET(req: NextRequest) {
  if (requestedKind(req) !== "pharmacy") return getAdminSettings(req);

  const { access, pharmacy } = await resolveOwnPharmacy(req, "pharmacy.profile.read");
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable ou inaccessible." }, { status: 404 });

  const [workspaceSetting, notificationSetting, recentActions, activeSessions] = await Promise.all([
    db.professionalSetting.findUnique({ where: { key: `pharmacy.${pharmacy.slug}.workspace` } }),
    db.professionalSetting.findUnique({ where: { key: `pharmacy.${pharmacy.slug}.notifications` } }),
    db.professionalActionLog.findMany({
      where: { pharmacyId: pharmacy.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, label: true, action: true, status: true, createdAt: true },
    }),
    access.session?.accountId
      ? db.professionalSessionRecord.count({ where: { accountId: access.session.accountId, status: "ACTIVE", expiresAt: { gt: new Date() } } })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    scope: "pharmacy",
    pharmacy: {
      id: pharmacy.id,
      slug: pharmacy.slug,
      name: pharmacy.name,
      accountStatus: pharmacy.accountStatus,
      publicationStatus: pharmacy.publicationStatus,
      dataQuality: pharmacy.dataQuality,
      qualityScore: pharmacy.qualityScore,
      lastDataUpdate: pharmacy.lastDataUpdate,
      mediaCount: pharmacy._count.media,
      medicationCount: pharmacy._count.medications,
      requestCount: pharmacy._count.userRequests,
      teamCount: pharmacy._count.professionalMemberships,
    },
    security: {
      accountStatus: access.session?.accountStatus ?? "ACTIVE",
      role: access.role,
      permissions: access.session?.permissions ?? [],
      activeSessions,
      sessionExpiresAt: access.session?.expiresAt ?? null,
    },
    workspaceSettings: parseSettings(workspaceSetting?.value),
    notificationPreferences: parseSettings(notificationSetting?.value),
    recentActions,
  });
}

export async function PATCH(req: NextRequest) {
  if (requestedKind(req) === "pharmacy") {
    const body = await req.json().catch(() => ({}));
    const { access, pharmacy } = await resolveOwnPharmacy(req, "pharmacy.settings.update");
    if (access.response) return access.response;
    if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable ou inaccessible." }, { status: 404 });

    const current = await db.professionalSetting.findUnique({ where: { key: `pharmacy.${pharmacy.slug}.workspace` } });
    const previous = parseSettings(current?.value);
    const next = {
      autoPublishSafeInventory: cleanBoolean(body.autoPublishSafeInventory, previous.autoPublishSafeInventory),
      requireManagerReviewForImages: cleanBoolean(body.requireManagerReviewForImages, previous.requireManagerReviewForImages),
      dailyOperationsDigest: cleanBoolean(body.dailyOperationsDigest, previous.dailyOperationsDigest),
      allowAdminAssistance: cleanBoolean(body.allowAdminAssistance, previous.allowAdminAssistance),
      publicProfileChecklist: cleanBoolean(body.publicProfileChecklist, previous.publicProfileChecklist),
      reminderFrequency: cleanOption(body.reminderFrequency, ["daily", "weekly", "critical-only"], previous.reminderFrequency),
      preferredSupportChannel: cleanOption(body.preferredSupportChannel, ["email", "phone", "whatsapp"], previous.preferredSupportChannel),
      supportPriority: cleanOption(body.supportPriority, ["normal", "urgent", "blocking"], previous.supportPriority),
      supportTopic: String(body.supportTopic ?? previous.supportTopic).trim().slice(0, 120) || previous.supportTopic,
      supportMessage: String(body.supportMessage ?? previous.supportMessage).trim().slice(0, 1000),
    };
    const value = JSON.stringify(next);
    const saved = await db.professionalSetting.upsert({
      where: { key: `pharmacy.${pharmacy.slug}.workspace` },
      update: { value, updatedBy: access.session?.name ?? access.role ?? null },
      create: {
        key: `pharmacy.${pharmacy.slug}.workspace`,
        value,
        description: `Préférences espace pharmacie ${pharmacy.name}`,
        updatedBy: access.session?.name ?? access.role ?? null,
      },
    });
    await db.professionalActionLog.create({
      data: {
        scope: "pharmacy",
        action: "pharmacy-settings-update",
        label: "Paramètres espace pharmacie",
        entityType: "professional-setting",
        entityId: saved.id,
        pharmacyId: pharmacy.id,
        pharmacySlug: pharmacy.slug,
        actorRole: access.role,
        status: "réussi",
        oldValue: JSON.stringify(previous),
        newValue: value,
        message: "Paramètres professionnels enregistrés et synchronisés avec l’espace pharmacie.",
      },
    });

    return NextResponse.json({ workspaceSettings: next, message: "Paramètres pharmacie enregistrés." });
  }

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { access, pharmacy } = await resolveOwnPharmacy(req, "pharmacy.settings.update");
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable ou inaccessible." }, { status: 404 });

  const topic = String(body.topic ?? "Support pharmacie").trim().slice(0, 120);
  const priority = cleanOption(body.priority, ["normal", "urgent", "blocking"], "normal");
  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (message.length < 12) {
    return NextResponse.json({ error: "Décrivez la demande support en quelques mots." }, { status: 400 });
  }

  const notification = await db.securityNotification.create({
    data: {
      platform: "admin",
      pharmacyId: pharmacy.id,
      type: priority === "blocking" ? "critical" : priority === "urgent" ? "alert" : "support",
      title: `Support pharmacie · ${topic}`,
      message: `${pharmacy.name} : ${message}`,
      status: "non_lue",
    },
  });
  await db.professionalActionLog.create({
    data: {
      scope: "pharmacy",
      action: "pharmacy-support-request",
      label: "Demande support pharmacie",
      entityType: "security-notification",
      entityId: notification.id,
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      actorRole: access.role,
      status: "réussi",
      source: "Paramètres pharmacie",
      newValue: JSON.stringify({ topic, priority, message }),
      message: "Demande support envoyée à l’administration SABLIN PHARMA.",
    },
  });

  return NextResponse.json({ notification, message: "Demande support envoyée à l’administration SABLIN PHARMA." });
}
