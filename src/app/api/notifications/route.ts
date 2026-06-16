import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

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
          type: "success",
          title: "Médicament disponible",
          message:
            "Le Paracétamol 500 mg est disponible à la Pharmacie de la Riviera (Cocody). Prix indicatif : 150 FCFA.",
          icon: "CheckCircle2",
          link: "medications",
          createdAt: hoursAgo(1),
        },
        {
          userId,
          type: "warning",
          title: "Stock faible",
          message:
            "L'Amoxicilline 500 mg est en stock faible à la Pharmacie de Marcory Zone 4. Réservez rapidement.",
          icon: "AlertTriangle",
          link: "medications",
          createdAt: hoursAgo(3),
        },
        {
          userId,
          type: "alert",
          title: "Rupture confirmée",
          message:
            "Le Coartem est actuellement en rupture à la Pharmacie d'Abobo. Disponible dans 8 autres pharmacies.",
          icon: "AlertTriangle",
          link: "medications",
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
          type: "warning",
          title: "Abonnement bientôt expiré",
          message:
            "Votre abonnement Premium expire dans 3 jours. Renouvelez dès maintenant pour 500 FCFA/mois.",
          icon: "Crown",
          link: "subscription",
          createdAt: hoursAgo(8),
        },
        {
          userId,
          type: "success",
          title: "Abonnement activé",
          message:
            "Votre abonnement Premium est actif. Profitez des estimations illimitées et des alertes en temps réel.",
          icon: "CheckCircle2",
          link: "subscription",
          createdAt: hoursAgo(24),
        },
        {
          userId,
          type: "success",
          title: "Paiement réussi",
          message:
            "Paiement de 500 FCFA confirmé via Wave. Référence : SPL-202606161435. Abonnement renouvelé pour 1 mois.",
          icon: "CheckCircle2",
          link: "profile",
          createdAt: hoursAgo(26),
        },
        {
          userId,
          type: "alert",
          title: "Paiement échoué",
          message:
            "Le paiement de 500 FCFA via MTN Money a échoué. Vérifiez votre solde et réessayez.",
          icon: "AlertTriangle",
          link: "subscription",
          createdAt: hoursAgo(30),
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
