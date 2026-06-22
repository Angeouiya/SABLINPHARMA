import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ROLES,
  permissionsForRole,
  safeJsonArray,
  uniquePermissions,
  type AdminRole,
} from "@/lib/access-control";
import { db } from "@/lib/db";
import { buildResetUrl, sendPasswordResetEmail } from "@/lib/email";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { writeAudit } from "@/lib/professional-auth";
import { generateToken, hashToken } from "@/lib/security/passwords";
import { emailIsValid, normalizeEmail } from "@/lib/user-contact";

function normalizeAdminRole(value: unknown): AdminRole {
  const role = String(value ?? "ADMIN").trim();
  return ADMIN_ROLES.includes(role as AdminRole) ? (role as AdminRole) : "ADMIN";
}

function normalizeAdminPermissions(value: unknown, role: AdminRole) {
  const defaults = permissionsForRole(role);
  if (!Array.isArray(value)) return defaults;
  const allowed = new Set(permissionsForRole("SUPER_ADMIN"));
  return uniquePermissions(
    defaults,
    value.map((item) => String(item)).filter((item) => allowed.has(item as never)) as never[]
  );
}

function serializeAccount(account: Awaited<ReturnType<typeof db.professionalAccount.findMany>>[number] & {
  _count?: { sessions: number; auditLogs: number; passwordResets: number };
}) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    permissions: safeJsonArray(account.permissionsJson),
    status: account.status,
    mustResetPassword: account.mustResetPassword,
    twoFactorEnabled: account.twoFactorEnabled,
    twoFactorRecommended: account.twoFactorRecommended,
    sessionVersion: account.sessionVersion,
    lastLoginAt: account.lastLoginAt,
    lastPasswordChangeAt: account.lastPasswordChangeAt,
    suspendedReason: account.suspendedReason,
    internalNotes: account.internalNotes,
    createdBy: account.createdBy,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    counts: {
      sessions: account._count?.sessions ?? 0,
      auditLogs: account._count?.auditLogs ?? 0,
      passwordResets: account._count?.passwordResets ?? 0,
    },
  };
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.admins.manage");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "all";
  const role = searchParams.get("role")?.trim() ?? "all";

  const accounts = await db.professionalAccount.findMany({
    where: {
      kind: "admin",
      ...(status !== "all" ? { status } : {}),
      ...(role !== "all" ? { role } : {}),
    },
    orderBy: [{ status: "asc" }, { role: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { sessions: true, auditLogs: true, passwordResets: true } },
    },
  });
  const audits = await db.auditLog.findMany({
    where: {
      platform: "admin",
      OR: [{ entityType: "admin-account" }, { action: { contains: "admin" } }],
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const rows = accounts
    .map(serializeAccount)
    .filter((account) => {
      if (!q) return true;
      return [account.name, account.email, account.phone, account.role, account.status, account.internalNotes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

  return NextResponse.json({
    rows,
    roles: ADMIN_ROLES,
    statuses: ["ACTIVE", "PENDING", "SUSPENDED", "BLOCKED", "ARCHIVED"],
    summary: {
      total: accounts.length,
      active: accounts.filter((item) => item.status === "ACTIVE").length,
      pending: accounts.filter((item) => item.status === "PENDING").length,
      suspended: accounts.filter((item) => ["SUSPENDED", "BLOCKED"].includes(item.status)).length,
      superAdmins: accounts.filter((item) => item.role === "SUPER_ADMIN").length,
      mustResetPassword: accounts.filter((item) => item.mustResetPassword).length,
      twoFactorEnabled: accounts.filter((item) => item.twoFactorEnabled).length,
      visibleRows: rows.length,
    },
    audits: audits.map((item) => ({
      id: item.id,
      action: item.action,
      entityId: item.entityId,
      actorName: item.actorName,
      actorRole: item.actorRole,
      result: item.result,
      comment: item.comment,
      createdAt: item.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.admins.manage");
  if (access.response || !access.session) return access.response;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(body.email);
  const phone = String(body.phone ?? "").trim();
  const role = normalizeAdminRole(body.role);
  const permissions = normalizeAdminPermissions(body.permissions, role);
  const internalNotes = String(body.internalNotes ?? "").trim();

  if (!name || !email || !emailIsValid(email)) {
    return NextResponse.json({ error: "Nom et e-mail professionnel valide obligatoires." }, { status: 400 });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const result = await db.$transaction(async (tx) => {
    const account = await tx.professionalAccount.create({
      data: {
        kind: "admin",
        name,
        email,
        phone: phone || null,
        role,
        permissionsJson: JSON.stringify(permissions),
        status: "PENDING",
        mustResetPassword: true,
        twoFactorRecommended: true,
        internalNotes: internalNotes || null,
        createdBy: access.session?.name ?? access.role ?? "SUPER_ADMIN",
      },
    });
    await tx.passwordResetToken.create({
      data: {
        accountId: account.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });
    await tx.auditLog.create({
      data: {
        platform: "admin",
        action: "admin-account-created",
        entityType: "admin-account",
        entityId: account.id,
        actorAccountId: access.session?.accountId,
        actorName: access.session?.name,
        actorRole: access.role,
        newValue: JSON.stringify({ name, email, role, permissions }),
        comment: "Compte admin créé sans mot de passe. Définition par lien sécurisé.",
      },
    });
    return account;
  });

  const emailResult = await sendPasswordResetEmail({
    to: email,
    name,
    platform: "Admin",
    resetUrl: buildResetUrl(req.nextUrl.origin, token, "professional"),
  });

  return NextResponse.json(
    {
      success: true,
      account: { id: result.id, name: result.name, email: result.email, role: result.role, status: result.status },
      email: emailResult,
      message: emailResult.sent
        ? "Compte administrateur créé. Un lien sécurisé de définition du mot de passe a été envoyé."
        : "Compte administrateur créé. L’envoi email est désactivé : configurez RESEND_API_KEY pour envoyer le lien.",
    },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.admins.manage");
  if (access.response || !access.session) return access.response;

  const body = await req.json().catch(() => ({}));
  const accountId = String(body.accountId ?? "").trim();
  const action = String(body.action ?? "update").trim();
  const reason = String(body.reason ?? "").trim();
  if (!accountId) return NextResponse.json({ error: "Compte administrateur obligatoire." }, { status: 400 });

  const account = await db.professionalAccount.findFirst({ where: { id: accountId, kind: "admin" } });
  if (!account) return NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 });
  if (account.id === access.session.accountId && ["suspend", "block", "archive", "revoke_sessions"].includes(action)) {
    return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre accès depuis cette action." }, { status: 400 });
  }

  let data: Record<string, unknown> = {};
  if (action === "activate") data = { status: "ACTIVE", suspendedReason: null };
  if (action === "suspend") {
    if (reason.length < 8) return NextResponse.json({ error: "Motif de suspension obligatoire." }, { status: 400 });
    data = { status: "SUSPENDED", suspendedReason: reason };
  }
  if (action === "block") {
    if (reason.length < 8) return NextResponse.json({ error: "Motif de blocage obligatoire." }, { status: 400 });
    data = { status: "BLOCKED", suspendedReason: reason };
  }
  if (action === "update_role") {
    const role = normalizeAdminRole(body.role);
    data = { role, permissionsJson: JSON.stringify(normalizeAdminPermissions(body.permissions, role)) };
  }
  if (action === "revoke_sessions") {
    await db.professionalSessionRecord.updateMany({
      where: { accountId, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: new Date(), revokedBy: access.session.name ?? access.session.accountId },
    });
    data = { sessionVersion: { increment: 1 } };
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "Action administrateur inconnue." }, { status: 400 });

  const updated = await db.professionalAccount.update({
    where: { id: account.id },
    data,
  });
  await writeAudit({
    req,
    platform: "admin",
    action: `admin-account-${action}`,
    entityType: "admin-account",
    entityId: account.id,
    actorAccountId: access.session.accountId,
    actorName: access.session.name,
    actorRole: access.role ?? undefined,
    oldValue: { status: account.status, role: account.role, sessionVersion: account.sessionVersion },
    newValue: { status: updated.status, role: updated.role, sessionVersion: updated.sessionVersion, reason },
    comment: reason || undefined,
  });

  return NextResponse.json({ success: true, account: serializeAccount({ ...updated, _count: { sessions: 0, auditLogs: 0, passwordResets: 0 } }) });
}
