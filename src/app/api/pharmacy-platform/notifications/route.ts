import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

async function resolvePharmacy(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, "view_own_dashboard", { pharmacySlug: slug });
  if (access.response) return { access, pharmacy: null };
  const pharmacySlug = slug || access.session?.pharmacySlug;
  const pharmacy = pharmacySlug ? await db.pharmacy.findUnique({ where: { slug: pharmacySlug } }) : null;
  return { access, pharmacy };
}

export async function GET(req: NextRequest) {
  const { access, pharmacy } = await resolvePharmacy(req);
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return NextResponse.json({ error: "Une pharmacie ne peut consulter que ses notifications." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  const where: Prisma.SecurityNotificationWhereInput = {
    platform: "pharmacy",
    pharmacyId: pharmacy.id,
  };
  if (status !== "all") where.status = status;
  if (type !== "all") where.type = type;

  const [notifications, preferences, unread, critical] = await Promise.all([
    db.securityNotification.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    db.professionalSetting.findUnique({ where: { key: `pharmacy.${pharmacy.slug}.notifications` } }),
    db.securityNotification.count({ where: { platform: "pharmacy", pharmacyId: pharmacy.id, status: "non_lue" } }),
    db.securityNotification.count({ where: { platform: "pharmacy", pharmacyId: pharmacy.id, type: { in: ["security", "critical", "alert"] }, status: { not: "archivée" } } }),
  ]);

  return NextResponse.json({
    notifications,
    stats: {
      total: notifications.length,
      unread,
      critical,
      archived: notifications.filter((item) => item.status === "archivée").length,
    },
    preferences: preferences?.value ? JSON.parse(preferences.value) : { platformEnabled: true, emailEnabled: true, criticalOnly: false },
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const notificationId = String(body.notificationId ?? "");
  if (!notificationId) return NextResponse.json({ error: "Notification obligatoire." }, { status: 400 });

  const notification = await db.securityNotification.findUnique({ where: { id: notificationId } });
  const access = requirePharmacyPermission(req, "view_own_dashboard");
  if (access.response) return access.response;
  if (!notification?.pharmacyId) return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });

  const pharmacy = await db.pharmacy.findUnique({ where: { id: notification.pharmacyId } });
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return NextResponse.json({ error: "Une pharmacie ne peut modifier que ses notifications." }, { status: 403 });
  }

  const action = String(body.action ?? "read");
  const status = action === "archive" ? "archivée" : action === "unread" ? "non_lue" : "lue";
  const updated = await db.securityNotification.update({ where: { id: notification.id }, data: { status } });
  await db.professionalActionLog.create({
    data: {
      scope: "pharmacy",
      action: "notification-status-update",
      label: action === "archive" ? "Notification archivée" : "Notification lue",
      entityType: "security-notification",
      entityId: notification.id,
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      actorRole: access.role,
      status: "réussi",
      message: updated.title,
      newValue: JSON.stringify({ status }),
    },
  });

  return NextResponse.json({ notification: updated });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const access = requirePharmacyPermission(req, "pharmacy.settings.update");
  if (access.response) return access.response;
  const pharmacySlug = String(body.pharmacySlug ?? access.session?.pharmacySlug ?? "");
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: pharmacySlug } });
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return NextResponse.json({ error: "Une pharmacie ne peut configurer que ses notifications." }, { status: 403 });
  }

  const value = JSON.stringify({
    platformEnabled: Boolean(body.platformEnabled),
    emailEnabled: Boolean(body.emailEnabled),
    criticalOnly: Boolean(body.criticalOnly),
  });
  const setting = await db.professionalSetting.upsert({
    where: { key: `pharmacy.${pharmacy.slug}.notifications` },
    update: { value, updatedBy: access.session?.name ?? access.role ?? null },
    create: {
      key: `pharmacy.${pharmacy.slug}.notifications`,
      value,
      description: `Préférences notifications pharmacie ${pharmacy.name}`,
      updatedBy: access.session?.name ?? access.role ?? null,
    },
  });
  await db.professionalActionLog.create({
    data: {
      scope: "pharmacy",
      action: "notification-preferences-update",
      label: "Préférences notifications",
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      actorRole: access.role,
      status: "réussi",
      newValue: value,
      message: "Préférences notifications enregistrées.",
    },
  });

  return NextResponse.json({ setting, preferences: JSON.parse(setting.value) });
}
