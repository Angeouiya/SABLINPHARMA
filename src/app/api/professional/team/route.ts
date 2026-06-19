import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { permissionsForRole } from "@/lib/access-control";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { writeAudit } from "@/lib/professional-auth";
import { generateToken, hashToken } from "@/lib/security/passwords";

async function resolvePharmacy(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug");
  if (!pharmacySlug) return null;
  return db.pharmacy.findUnique({ where: { slug: pharmacySlug } });
}

export async function GET(req: NextRequest) {
  const pharmacy = await resolvePharmacy(req);
  const access = requirePharmacyPermission(req, "pharmacy.team.read", { pharmacySlug: pharmacy?.slug });
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const members = await db.professionalPharmacyMembership.findMany({
    where: { pharmacyId: pharmacy.id },
    include: { account: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  const invitations = await db.professionalInvitation.findMany({
    where: { pharmacyId: pharmacy.id, status: { in: ["En attente", "Renvoyée"] } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      name: member.account.name,
      email: member.account.email,
      phone: member.account.phone,
      role: member.role,
      permissions: JSON.parse(member.permissionsJson || "[]"),
      status: member.status,
      accountStatus: member.account.status,
      lastLoginAt: member.account.lastLoginAt,
    })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      phone: invitation.phone,
      role: invitation.role,
      permissions: JSON.parse(invitation.permissionsJson || "[]"),
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: String(body.pharmacySlug ?? "") } });
  const access = requirePharmacyPermission(req, "pharmacy.team.invite", { pharmacySlug: pharmacy?.slug });
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const role = String(body.role ?? "PHARMACY_EMPLOYEE").trim();
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
      permissionsJson: JSON.stringify(body.permissions ?? permissionsForRole(role)),
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
  const member = await db.professionalPharmacyMembership.findUnique({
    where: { id: String(body.membershipId ?? "") },
    include: { pharmacy: true, account: true },
  });
  const access = requirePharmacyPermission(req, "pharmacy.team.update", { pharmacySlug: member?.pharmacy.slug });
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

  const updated = await db.professionalPharmacyMembership.update({
    where: { id: member.id },
    data: {
      role: body.role ? String(body.role) : member.role,
      permissionsJson: body.permissions ? JSON.stringify(body.permissions) : member.permissionsJson,
      status: body.status ? String(body.status) : member.status,
      endedAt: body.status === "Révoqué" ? new Date() : member.endedAt,
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
    oldValue: { role: member.role, status: member.status },
    newValue: { role: updated.role, status: updated.status },
  });
  return NextResponse.json({ membership: updated });
}
