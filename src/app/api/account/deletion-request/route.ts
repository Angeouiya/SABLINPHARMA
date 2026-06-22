import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, commune: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  const existing = await db.securityNotification.findFirst({
    where: {
      platform: "admin",
      recipientUserId: user.id,
      type: "account_deletion_request",
      status: { in: ["non_lue", "en_cours"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyRequested: true,
      message: "Votre demande de suppression est déjà enregistrée et en cours de traitement.",
    });
  }

  const summary = {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    commune: user.commune,
  };

  await db.$transaction([
    db.securityNotification.create({
      data: {
        platform: "admin",
        recipientUserId: user.id,
        type: "account_deletion_request",
        title: "Demande de suppression de compte utilisateur",
        message: `${user.name} demande la suppression de son compte. Vérifier les transactions, crédits, pass et demandes avant traitement.`,
      },
    }),
    db.notification.create({
      data: {
        userId: user.id,
        type: "warning",
        title: "Demande de suppression reçue",
        message:
          "Votre demande est enregistrée. L’équipe SABLIN PHARMA vérifiera les éléments liés à vos crédits, transactions et demandes avant suppression.",
        icon: "ShieldCheck",
        link: "settings",
      },
    }),
    db.auditLog.create({
      data: {
        platform: "user",
        action: "account-deletion-requested",
        entityType: "user",
        entityId: user.id,
        actorName: user.name,
        actorRole: "Utilisateur simple",
        result: "en_cours",
        newValue: JSON.stringify(summary),
        comment: "Demande de suppression initiée depuis les paramètres utilisateur.",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "Demande de suppression enregistrée. L’équipe SABLIN PHARMA vous notifiera après vérification.",
  });
}
