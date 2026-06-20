import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

function sanitizeUserNotification<T extends { title: string; message: string; icon: string; link: string | null }>(notification: T): T {
  const sensitivePattern = /disponible|stock faible|rupture|en stock|prix indicatif|pharmacies disponibles/i;
  if (!sensitivePattern.test(`${notification.title} ${notification.message}`)) {
    return notification;
  }
  return {
    ...notification,
    title: "Information avancée verrouillée",
    message:
      "Les disponibilités, prix détaillés et pharmacies associées nécessitent des crédits SABLIN avant affichage.",
    icon: "Lock",
    link: notification.link ?? "wallet",
  };
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }
  // Seed demo notifications on first access so the page isn't empty
  const count = await db.notification.count({ where: { userId } });
  if (count === 0) {
    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
    await db.notification.createMany({
      data: [
        {
          userId,
          type: "info",
          title: "Disponibilité verrouillée",
          message:
            "Connectez-vous à une fiche médicament et utilisez 1 crédit pour voir les pharmacies qui possèdent réellement le produit.",
          icon: "Lock",
          link: "medications",
          createdAt: hoursAgo(1),
        },
        {
          userId,
          type: "warning",
          title: "Service verrouillé",
          message:
            "Les prix détaillés, contacts pharmacies et confirmations nécessitent des crédits SABLIN.",
          icon: "Lock",
          link: "medications",
          createdAt: hoursAgo(3),
        },
        {
          userId,
          type: "info",
          title: "Coût affiché avant validation",
          message:
            "Aucun crédit n’est débité sans confirmation claire avant une action avancée.",
          icon: "Coins",
          link: "wallet",
          createdAt: hoursAgo(5),
        },
        {
          userId,
          type: "warning",
          title: "Pharmacie de garde proche",
          message:
            "La Pharmacie de Yopougon assure la garde ce soir. Ouverte jusqu'à 20h00, à 8 km de votre position.",
          icon: "Timer",
          link: "pharmacies",
          createdAt: hoursAgo(2),
        },
        {
          userId,
          type: "success",
          title: "Recharge réussie",
          message:
            "Paiement de 500 FCFA confirmé via PayDunya. 6 crédits ajoutés à votre solde.",
          icon: "CheckCircle2",
          link: "wallet",
          createdAt: hoursAgo(8),
        },
        {
          userId,
          type: "info",
          title: "Crédits utilisés",
          message:
            "2 crédits utilisés pour l'estimation de votre ordonnance. Solde restant : 4 crédits.",
          icon: "Coins",
          link: "wallet",
          createdAt: hoursAgo(10),
        },
        {
          userId,
          type: "warning",
          title: "Solde faible",
          message:
            "Votre solde de crédits est faible (1 crédit). Rechargez pour continuer à utiliser les services avancés.",
          icon: "AlertTriangle",
          link: "wallet",
          createdAt: hoursAgo(14),
        },
        {
          userId,
          type: "success",
          title: "Pass Ordonnance Unique activé",
          message:
            "Votre Pass Ordonnance Unique est actif. Vous pouvez estimer une ordonnance complète.",
          icon: "Receipt",
          link: "wallet",
          createdAt: hoursAgo(24),
        },
        {
          userId,
          type: "success",
          title: "Contact pharmacie débloqué",
          message:
            "1 crédit utilisé pour débloquer le contact de la Pharmacie de la Rivière.",
          icon: "CheckCircle2",
          link: "pharmacies",
          createdAt: hoursAgo(26),
        },
        {
          userId,
          type: "success",
          title: "Estimation ordonnance débloquée",
          message:
            "2 crédits utilisés. Votre estimation d'ordonnance est prête.",
          icon: "CheckCircle2",
          link: "prescription",
          createdAt: hoursAgo(28),
        },
        {
          userId,
          type: "success",
          title: "Ordonnance estimée",
          message:
            "Votre ordonnance de 3 médicaments a été estimée avec succès. Coût total : 2 150 — 3 200 FCFA.",
          icon: "CheckCircle2",
          link: "prescription",
          createdAt: hoursAgo(6),
        },
        {
          userId,
          type: "info",
          title: "Ordonnance enregistrée",
          message:
            "Votre ordonnance « Traitement paludisme » a été enregistrée dans votre profil. Retrouvez-la dans l'historique.",
          icon: "Info",
          link: "prescription",
          createdAt: hoursAgo(48),
        },
        {
          userId,
          type: "info",
          title: "Pharmacie favorite mise à jour",
          message:
            "La Pharmacie de la Riviera (Cocody) a mis à jour ses horaires. Ouvert désormais de 07h30 à 20h30.",
          icon: "Heart",
          link: "favorites",
          createdAt: hoursAgo(12),
        },
        {
          userId,
          type: "info",
          title: "Message du support",
          message:
            "Notre équipe support a répondu à votre question. Consultez la conversation dans votre profil.",
          icon: "Bell",
          link: "profile",
          createdAt: hoursAgo(72),
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
  return NextResponse.json({
    notifications: notifications.map(sanitizeUserNotification),
    unread,
  });
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
