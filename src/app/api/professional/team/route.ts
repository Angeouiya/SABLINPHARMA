import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  PHARMACY_PERMISSIONS,
  PHARMACY_ROLES,
  permissionsForRole,
  safeJsonArray,
  type Permission,
} from "@/lib/access-control";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { writeAudit } from "@/lib/professional-auth";
import { generateToken, hashToken } from "@/lib/security/passwords";

async function resolvePharmacy(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug");
  if (!pharmacySlug) return null;
  return db.pharmacy.findUnique({ where: { slug: pharmacySlug } });
}

function requestedKind(req: NextRequest) {
  const header = req.headers.get("x-sablin-session-kind");
  return header === "admin" || header === "pharmacy" ? header : "pharmacy";
}

function normalizeTeamRole(role: unknown) {
  const value = String(role ?? "PHARMACY_EMPLOYEE").trim();
  return PHARMACY_ROLES.includes(value as (typeof PHARMACY_ROLES)[number]) ? value : "PHARMACY_EMPLOYEE";
}

const permissionMap: Record<string, Permission> = {
  "Modifier les médicaments": "pharmacy.inventory.update",
  "Importer l’inventaire": "pharmacy.inventory.import",
  "Modifier les horaires": "pharmacy.schedule.update",
  "Répondre aux demandes": "pharmacy.requests.respond",
  "Modifier le profil": "pharmacy.profile.update",
  "Voir l’historique": "pharmacy.history.read",
};

function normalizeTeamPermissions(value: unknown, role: string) {
  if (!Array.isArray(value)) return permissionsForRole(role);
  const allowed = new Set<string>(PHARMACY_PERMISSIONS);
  const normalized = value
    .map((item) => permissionMap[String(item)] ?? String(item))
    .filter((item) => allowed.has(item));
  return [...new Set(normalized)];
}

type TeamMemberPayload = Prisma.ProfessionalPharmacyMembershipGetPayload<{
  include: { account: true; pharmacy: true };
}>;

type TeamInvitationPayload = Prisma.ProfessionalInvitationGetPayload<{
  include: { pharmacy: true };
}>;

function serializeMember(member: TeamMemberPayload) {
  return {
    id: member.id,
    name: member.account.name,
    email: member.account.email,
    phone: member.account.phone,
    role: member.role,
    permissions: safeJsonArray(member.permissionsJson),
    status: member.status,
    accountStatus: member.account.status,
    lastLoginAt: member.account.lastLoginAt,
    pharmacy: {
      id: member.pharmacy.id,
      name: member.pharmacy.name,
      slug: member.pharmacy.slug,
      commune: member.pharmacy.commune,
      district: member.pharmacy.district,
      accountStatus: member.pharmacy.accountStatus,
    },
  };
}

function serializeInvitation(invitation: TeamInvitationPayload) {
  return {
    id: invitation.id,
    name: invitation.name,
    email: invitation.email,
    phone: invitation.phone,
    role: invitation.role,
    permissions: safeJsonArray(invitation.permissionsJson),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    pharmacy: invitation.pharmacy
      ? {
          id: invitation.pharmacy.id,
          name: invitation.pharmacy.name,
          slug: invitation.pharmacy.slug,
          commune: invitation.pharmacy.commune,
          district: invitation.pharmacy.district,
          accountStatus: invitation.pharmacy.accountStatus,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  if (scope === "all" || (!searchParams.get("pharmacySlug") && requestedKind(req) === "admin")) {
    const access = requirePharmacyPermission(req, "admin.pharmacies.read");
    if (access.response) return access.response;

    const [members, invitations] = await Promise.all([
      db.professionalPharmacyMembership.findMany({
        include: { account: true, pharmacy: true },
        orderBy: [{ pharmacy: { name: "asc" } }, { status: "asc" }, { createdAt: "desc" }],
      }),
      db.professionalInvitation.findMany({
        include: { pharmacy: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      scope: "all",
      members: members.map(serializeMember),
      invitations: invitations.map(serializeInvitation),
      summary: {
        totalMembers: members.length,
        activeMembers: members.filter((member) => member.status === "Actif").length,
        pendingInvitations: invitations.filter((invitation) => ["En attente", "Renvoyée"].includes(invitation.status)).length,
        suspendedMembers: members.filter((member) => member.status === "Suspendu").length,
        revokedMembers: members.filter((member) => member.status === "Révoqué").length,
      },
    });
  }

  const pharmacy = await resolvePharmacy(req);
  const access = requirePharmacyPermission(req, "pharmacy.team.read", { pharmacySlug: pharmacy?.slug });
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const members = await db.professionalPharmacyMembership.findMany({
    where: { pharmacyId: pharmacy.id },
    include: { account: true, pharmacy: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  const invitations = await db.professionalInvitation.findMany({
    where: { pharmacyId: pharmacy.id, status: { in: ["En attente", "Renvoyée"] } },
    include: { pharmacy: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({
    members: members.map(serializeMember),
    invitations: invitations.map(serializeInvitation),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: String(body.pharmacySlug ?? "") } });
  const kind = requestedKind(req);
  const access = requirePharmacyPermission(
    req,
    kind === "admin" ? "admin.pharmacies.update" : "pharmacy.team.invite",
    { pharmacySlug: pharmacy?.slug }
  );
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const role = normalizeTeamRole(body.role);
  const permissions = normalizeTeamPermissions(body.permissions, role);
  if (!name || (!email && !phone)) {
    return NextResponse.json({ error: "Nom et email ou téléphone sont obligatoires." }, { status: 400 });
  }

  const token = generateToken();
  const invitation = await db.professionalInvitation.create({
    data: {
      pharmacyId: pharmacy.id,
      name,
      email: email || null,
      phone: phone || null,
      role,
      permissionsJson: JSON.stringify(permissions),
      tokenHash: hashToken(token),
      status: "En attente",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByAccountId: access.session?.accountId ?? null,
      createdByRole: access.role ?? null,
    },
  });
  await writeAudit({
    req,
    platform: access.session?.kind ?? "pharmacy",
    action: "team-invitation-created",
    entityType: "professional-invitation",
    entityId: invitation.id,
    pharmacyId: pharmacy.id,
    actorAccountId: access.session?.accountId,
    actorName: access.session?.name,
    actorRole: access.role ?? undefined,
    newValue: { name, email, phone, role },
  });
  return NextResponse.json({
    invitation: { id: invitation.id, status: invitation.status, expiresAt: invitation.expiresAt },
    activationTokenPreview: token,
  }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kind = requestedKind(req);

  if (body.invitationId) {
    const invitation = await db.professionalInvitation.findUnique({
      where: { id: String(body.invitationId) },
      include: { pharmacy: true },
    });
    const access = requirePharmacyPermission(
      req,
      kind === "admin" ? "admin.pharmacies.update" : "pharmacy.team.update",
      { pharmacySlug: invitation?.pharmacy?.slug }
    );
    if (access.response) return access.response;
    if (!invitation) return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });

    const nextStatus = String(body.status ?? invitation.status);
    const data =
      nextStatus === "Renvoyée"
        ? {
            status: "Renvoyée",
            tokenHash: hashToken(generateToken()),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }
        : { status: nextStatus };
    const updated = await db.professionalInvitation.update({
      where: { id: invitation.id },
      data,
    });
    await writeAudit({
      req,
      platform: access.session?.kind ?? "pharmacy",
      action: "team-invitation-updated",
      entityType: "professional-invitation",
      entityId: invitation.id,
      pharmacyId: invitation.pharmacyId ?? undefined,
      actorAccountId: access.session?.accountId,
      actorName: access.session?.name,
      actorRole: access.role ?? undefined,
      oldValue: { status: invitation.status },
      newValue: { status: updated.status },
    });
    return NextResponse.json({ invitation: updated });
  }

  const member = await db.professionalPharmacyMembership.findUnique({
    where: { id: String(body.membershipId ?? "") },
    include: { pharmacy: true, account: true },
  });
  const access = requirePharmacyPermission(
    req,
    kind === "admin" ? "admin.pharmacies.update" : "pharmacy.team.update",
    { pharmacySlug: member?.pharmacy.slug }
  );
  if (access.response) return access.response;
  if (!member) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });

  const activeOwners = await db.professionalPharmacyMembership.count({
    where: { pharmacyId: member.pharmacyId, role: "PHARMACY_OWNER", status: "Actif" },
  });
  if (body.status === "Révoqué" && member.role === "PHARMACY_OWNER" && activeOwners <= 1) {
    return NextResponse.json(
      { error: "Impossible de supprimer le dernier propriétaire actif d’une pharmacie." },
      { status: 409 }
    );
  }

  const nextRole = body.role ? normalizeTeamRole(body.role) : member.role;
  const nextStatus = body.status ? String(body.status) : member.status;
  const nextPermissions = body.permissions ? normalizeTeamPermissions(body.permissions, nextRole) : safeJsonArray(member.permissionsJson);

  const updated = await db.professionalPharmacyMembership.update({
    where: { id: member.id },
    data: {
      role: nextRole,
      permissionsJson: JSON.stringify(nextPermissions),
      status: nextStatus,
      endedAt: nextStatus === "Révoqué" ? new Date() : nextStatus === "Actif" ? null : member.endedAt,
    },
  });
  await writeAudit({
    req,
    platform: access.session?.kind ?? "pharmacy",
    action: "team-membership-updated",
    entityType: "professional-membership",
    entityId: member.id,
    pharmacyId: member.pharmacyId,
    actorAccountId: access.session?.accountId,
    actorName: access.session?.name,
    actorRole: access.role ?? undefined,
    oldValue: { role: member.role, status: member.status, permissions: safeJsonArray(member.permissionsJson) },
    newValue: { role: updated.role, status: updated.status, permissions: nextPermissions },
  });
  return NextResponse.json({ membership: updated });
}
