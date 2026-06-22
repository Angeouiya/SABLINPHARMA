import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

function typeGroup(type?: string | null) {
  const value = String(type ?? "").toLowerCase();
  if (value.includes("payment") || value.includes("paiement") || value.includes("fraud")) return "Paiements";
  if (value.includes("support")) return "Support";
  if (value.includes("critical") || value.includes("security") || value.includes("alert")) return "Sécurité";
  if (value.includes("import")) return "Imports";
  if (value.includes("quality") || value.includes("qualité")) return "Qualité données";
  return "Plateforme";
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.dashboard.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  const pharmacyId = searchParams.get("pharmacyId") || "";
  const q = searchParams.get("q")?.trim() || "";

  const where: Prisma.SecurityNotificationWhereInput = {
    platform: "admin",
    ...(status !== "all" ? { status } : {}),
    ...(type !== "all" ? { type } : {}),
    ...(pharmacyId ? { pharmacyId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { message: { contains: q } },
            { type: { contains: q } },
          ],
        }
      : {}),
  };

  const [notifications, unread, critical, archived, total] = await Promise.all([
    db.securityNotification.findMany({ where, orderBy: { createdAt: "desc" }, take: 150 }),
    db.securityNotification.count({ where: { platform: "admin", status: "non_lue" } }),
    db.securityNotification.count({ where: { platform: "admin", type: { in: ["security", "critical", "alert", "payment_security"] }, status: { not: "archivée" } } }),
    db.securityNotification.count({ where: { platform: "admin", status: "archivée" } }),
    db.securityNotification.count({ where: { platform: "admin" } }),
  ]);

  const pharmacyIds = [...new Set(notifications.map((item) => item.pharmacyId).filter(Boolean) as string[])];
  const linkedPharmacies = pharmacyIds.length
    ? await db.pharmacy.findMany({
        where: { id: { in: pharmacyIds } },
        select: { id: true, name: true, slug: true, accountStatus: true, dataQuality: true },
      })
    : [];
  const pharmacyById = new Map(linkedPharmacies.map((pharmacy) => [pharmacy.id, pharmacy]));

  return NextResponse.json({
    notifications: notifications.map((item) => {
      const pharmacy = item.pharmacyId ? pharmacyById.get(item.pharmacyId) : null;
      return {
        ...item,
        group: typeGroup(item.type),
        pharmacy: pharmacy
          ? {
              id: pharmacy.id,
              name: pharmacy.name,
              slug: pharmacy.slug,
              accountStatus: pharmacy.accountStatus,
              dataQuality: pharmacy.dataQuality,
            }
          : null,
      };
    }),
    stats: {
      total,
      listed: notifications.length,
      unread,
      critical,
      archived,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.dashboard.read");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const notificationId = String(body.notificationId ?? "");
  if (!notificationId) return NextResponse.json({ error: "Notification obligatoire." }, { status: 400 });

  const notification = await db.securityNotification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.platform !== "admin") {
    return NextResponse.json({ error: "Notification admin introuvable." }, { status: 404 });
  }

  const action = String(body.action ?? "read");
  const status = action === "archive" ? "archivée" : action === "unread" ? "non_lue" : "lue";
  const updated = await db.securityNotification.update({ where: { id: notification.id }, data: { status } });
  await db.professionalActionLog.create({
    data: {
      scope: "admin",
      action: "admin-notification-status-update",
      label: action === "archive" ? "Notification admin archivée" : "Notification admin lue",
      entityType: "security-notification",
      entityId: notification.id,
      pharmacyId: notification.pharmacyId ?? null,
      actorRole: access.role,
      status: "réussi",
      oldValue: JSON.stringify({ status: notification.status }),
      newValue: JSON.stringify({ status }),
      message: updated.title,
    },
  });

  return NextResponse.json({ notification: updated });
}
