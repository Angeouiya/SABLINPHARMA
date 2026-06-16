import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }
  // Seed a few demo notifications on first access so the page isn't empty
  const count = await db.notification.count({ where: { userId } });
  if (count === 0) {
    await db.notification.createMany({
      data: [
        {
          userId,
          type: "success",
          title: "Bienvenue sur SABLIN PHARMA !",
          message:
            "Votre compte est créé. Recherchez vos médicaments et trouvez les pharmacies de garde à Abidjan en un clic.",
          icon: "CheckCircle2",
          link: "home",
        },
        {
          userId,
          type: "warning",
          title: "Pharmacie de garde ce soir",
          message:
            "La Pharmacie des Deux Plateaux (Cocody) assure la garde jusqu'à demain matin. Elle est ouverte 24/7.",
          icon: "Timer",
          link: "pharmacies",
        },
        {
          userId,
          type: "promotion",
          title: "Passez Premium — 500 FCFA/mois",
          message:
            "Estimations illimitées, alertes de garde en temps réel et assistance prioritaire. Découvrez l'abonnement Premium.",
          icon: "Crown",
          link: "subscription",
        },
        {
          userId,
          type: "info",
          title: "Nouveau médicament référencé",
          message:
            "Coartem (Artéméther / Luméfantrine) est désormais disponible dans 12 pharmacies partenaires.",
          icon: "Pill",
          link: "medications",
        },
      ],
    });
  }
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const notif = await db.notification.create({
      data: {
        userId,
        type: body.type ?? "info",
        title: body.title,
        message: body.message,
        icon: body.icon ?? "Bell",
        link: body.link ?? null,
      },
    });
    return NextResponse.json({ notification: notif });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification." },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function PATCH() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 }
    );
  }
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
