import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  normalizeRole,
  permissionsForRole,
  safeJsonArray,
  uniquePermissions,
  type AdminRole,
  type PharmacyRole,
} from "@/lib/access-control";
import {
  encodeProfessionalSession,
  type ProfessionalSession,
  type ProfessionalSessionKind,
} from "@/lib/professional-sessions";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";

export const DEMO_ADMIN_EMAIL = "admin@sablinpharma.ci";
export const DEMO_ADMIN_PASSWORD = "Admin@12345";
export const DEMO_PHARMACY_EMAIL = "pharmacie@sablinpharma.ci";
export const DEMO_PHARMACY_PASSWORD = "Pharma@12345";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
}

function json(value: unknown) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return null;
  }
}

export async function writeAudit(input: {
  req?: NextRequest;
  platform: string;
  action: string;
  entityType?: string;
  entityId?: string;
  pharmacyId?: string;
  actorAccountId?: string;
  actorName?: string;
  actorRole?: string;
  result?: string;
  oldValue?: unknown;
  newValue?: unknown;
  sessionId?: string;
  comment?: string;
}) {
  await db.auditLog.create({
    data: {
      platform: input.platform,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      pharmacyId: input.pharmacyId ?? null,
      actorAccountId: input.actorAccountId ?? null,
      actorName: input.actorName ?? null,
      actorRole: input.actorRole ?? null,
      result: input.result ?? "réussi",
      oldValue: input.oldValue ? json(input.oldValue) : null,
      newValue: input.newValue ? json(input.newValue) : null,
      ipAddress: input.req ? getIp(input.req) : null,
      userAgent: input.req?.headers.get("user-agent") ?? null,
      sessionId: input.sessionId ?? null,
      comment: input.comment ?? null,
    },
  });
}

export async function notifySecurity(input: {
  platform: string;
  recipientAccountId?: string;
  pharmacyId?: string;
  type: string;
  title: string;
  message: string;
}) {
  await db.securityNotification.create({
    data: {
      platform: input.platform,
      recipientAccountId: input.recipientAccountId ?? null,
      pharmacyId: input.pharmacyId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
    },
  });
}

async function ensureDemoPharmacy() {
  const existing = await db.pharmacy.findFirst({ where: { slug: "pharmacie-sainte-marie-cocody" } });
  if (existing) return existing;
  return db.pharmacy.create({
    data: {
      name: "Pharmacie Sainte Marie Cocody",
      slug: "pharmacie-sainte-marie-cocody",
      address: "Riviera 2, près de la station Total",
      commune: "Cocody",
      district: "Riviera 2",
      phone: "+225 07 00 00 00 02",
      whatsapp: "+225 07 00 00 00 02",
      professionalEmail: DEMO_PHARMACY_EMAIL,
      managerName: "Dr Awa N’Guessan",
      managerRole: "Pharmacien responsable",
      creationSource: "Création administrateur",
      accountStatus: "Validée",
      publicationStatus: "Publiée",
      hoursWeekday: "08:00 - 22:00",
      hoursSaturday: "08:00 - 20:00",
      hoursSunday: "09:00 - 13:00",
      latitude: 5.364,
      longitude: -3.982,
      lastDataUpdate: new Date(),
    },
  });
}

export async function ensureDefaultProfessionalAccounts() {
  const pharmacy = await ensureDemoPharmacy();
  const admin = await db.professionalAccount.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: {},
    create: {
      kind: "admin",
      name: "Équipe SABLIN PHARMA",
      email: DEMO_ADMIN_EMAIL,
      phone: "+225 07 00 00 00 00",
      role: "SUPER_ADMIN" satisfies AdminRole,
      permissionsJson: JSON.stringify(permissionsForRole("SUPER_ADMIN")),
      status: "ACTIVE",
      passwordHash: hashPassword(DEMO_ADMIN_PASSWORD),
      twoFactorRecommended: true,
      createdBy: "system",
    },
  });
  const pharmacyAccount = await db.professionalAccount.upsert({
    where: { email: DEMO_PHARMACY_EMAIL },
    update: {},
    create: {
      kind: "pharmacy",
      name: "Pharmacie Sainte Marie Cocody",
      email: DEMO_PHARMACY_EMAIL,
      phone: "+225 07 00 00 00 02",
      role: "PHARMACY_OWNER" satisfies PharmacyRole,
      permissionsJson: JSON.stringify(permissionsForRole("PHARMACY_OWNER")),
      status: "ACTIVE",
      passwordHash: hashPassword(DEMO_PHARMACY_PASSWORD),
      twoFactorRecommended: true,
      createdBy: admin.id,
    },
  });
  await db.professionalPharmacyMembership.upsert({
    where: { accountId_pharmacyId: { accountId: pharmacyAccount.id, pharmacyId: pharmacy.id } },
    update: { status: "Actif" },
    create: {
      accountId: pharmacyAccount.id,
      pharmacyId: pharmacy.id,
      role: "PHARMACY_OWNER",
      permissionsJson: JSON.stringify(permissionsForRole("PHARMACY_OWNER")),
      status: "Actif",
      attachedBy: admin.id,
    },
  });
}

export async function authenticateProfessionalAccount(input: {
  req: NextRequest;
  kind: ProfessionalSessionKind;
  identifier?: string;
  password?: string;
  demo?: boolean;
  fallbackRole?: string;
}) {
  await ensureDefaultProfessionalAccounts();
  const identifier = String(input.identifier ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const isDemoLogin = input.demo === true && !identifier;
  const fallbackEmail = input.kind === "admin" ? DEMO_ADMIN_EMAIL : DEMO_PHARMACY_EMAIL;

  if (!identifier && !isDemoLogin) {
    return { ok: false as const, status: 400, error: "Identifiant requis." };
  }

  const account = await db.professionalAccount.findFirst({
    where: {
      kind: input.kind,
      OR: identifier
        ? [{ email: identifier }, { phone: identifier }]
        : [{ email: fallbackEmail }],
    },
    include: {
      memberships: {
        where: { status: "Actif" },
        include: { pharmacy: true },
      },
    },
  });

  if (!account) {
    await writeAudit({
      req: input.req,
      platform: input.kind,
      action: "login-failed",
      actorName: identifier || "demo",
      result: "échoué",
      comment: "Compte introuvable",
    });
    return { ok: false as const, status: 401, error: "Identifiants incorrects." };
  }

  if (account.status === "BLOCKED" || account.status === "DELETED") {
    return { ok: false as const, status: 403, error: "Accès non autorisé." };
  }
  if (account.status === "SUSPENDED") {
    return { ok: false as const, status: 403, error: "Compte suspendu." };
  }
  if (account.status !== "ACTIVE" && input.kind === "admin") {
    return { ok: false as const, status: 403, error: "Compte non validé." };
  }

  const demoPassword = input.kind === "admin" ? DEMO_ADMIN_PASSWORD : DEMO_PHARMACY_PASSWORD;
  const passwordToCheck = isDemoLogin ? demoPassword : password;
  if (!verifyPassword(passwordToCheck, account.passwordHash)) {
    await writeAudit({
      req: input.req,
      platform: input.kind,
      action: "login-failed",
      actorAccountId: account.id,
      actorName: account.name,
      actorRole: account.role,
      result: "échoué",
      comment: "Mot de passe incorrect",
    });
    return { ok: false as const, status: 401, error: "Identifiants incorrects." };
  }

  const membership = account.memberships[0] ?? null;
  const membershipPermissions = account.memberships.flatMap((item) => safeJsonArray(item.permissionsJson));
  const permissions = uniquePermissions(
    permissionsForRole(account.role),
    safeJsonArray(account.permissionsJson),
    membershipPermissions
  );
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const sessionRecord = await db.professionalSessionRecord.create({
    data: {
      accountId: account.id,
      kind: input.kind,
      role: account.role,
      sessionVersion: account.sessionVersion,
      activePharmacyId: membership?.pharmacyId ?? null,
      userAgent: input.req.headers.get("user-agent") ?? null,
      ipAddress: getIp(input.req),
      expiresAt,
    },
  });
  await db.professionalAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  const session: ProfessionalSession = {
    kind: input.kind,
    accountId: account.id,
    sessionId: sessionRecord.id,
    role: normalizeRole(account.role) ?? (input.kind === "admin" ? "ADMIN" : "PHARMACY_OWNER"),
    name: account.name,
    accountStatus: account.status as ProfessionalSession["accountStatus"],
    pharmacySlug: membership?.pharmacy.slug,
    activePharmacySlug: membership?.pharmacy.slug,
    allowedPharmacySlugs: account.memberships.map((item) => item.pharmacy.slug),
    permissions,
    pharmacyStatus: membership?.pharmacy.accountStatus as ProfessionalSession["pharmacyStatus"],
    sessionVersion: account.sessionVersion,
    createdAt: Date.now(),
    expiresAt: expiresAt.getTime(),
  };

  await writeAudit({
    req: input.req,
    platform: input.kind,
    action: "login-success",
    actorAccountId: account.id,
    actorName: account.name,
    actorRole: account.role,
    pharmacyId: membership?.pharmacyId,
    sessionId: sessionRecord.id,
  });
  await notifySecurity({
    platform: input.kind,
    recipientAccountId: account.id,
    pharmacyId: membership?.pharmacyId,
    type: "new-login",
    title: "Nouvelle connexion",
    message: "Une connexion a été enregistrée sur votre espace SABLIN PHARMA.",
  });

  return {
    ok: true as const,
    account,
    session,
    sessionValue: encodeProfessionalSession(session),
  };
}

export async function revokeProfessionalSession(sessionId?: string | null, revokedBy?: string | null) {
  if (!sessionId) return;
  await db.professionalSessionRecord.updateMany({
    where: { id: sessionId, status: "ACTIVE" },
    data: { status: "REVOKED", revokedAt: new Date(), revokedBy: revokedBy ?? null },
  });
}
