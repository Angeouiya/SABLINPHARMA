import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      commune: true,
      credits: true,
      avatarColor: true,
      createdAt: true,
      updatedAt: true,
      settings: true,
      notifications: { orderBy: { createdAt: "desc" }, take: 500 },
      history: { orderBy: { createdAt: "desc" }, take: 500 },
      favorites: { orderBy: { createdAt: "desc" }, take: 500 },
      creditTransactions: { orderBy: { createdAt: "desc" }, take: 500 },
      passOrdonnances: { orderBy: { createdAt: "desc" }, take: 100 },
      contactUnlocks: { orderBy: { createdAt: "desc" }, take: 200 },
      featureAccesses: { orderBy: { createdAt: "desc" }, take: 200 },
      pharmacyRatings: { orderBy: { createdAt: "desc" }, take: 200 },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          reference: true,
          providerReference: true,
          amount: true,
          currency: true,
          provider: true,
          productType: true,
          expectedCredits: true,
          passOrdonnance: true,
          status: true,
          riskStatus: true,
          createdAt: true,
          processedAt: true,
          verifiedAt: true,
          refundedAt: true,
        },
      },
      pharmacyRequests: {
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          reference: true,
          requestType: true,
          serviceName: true,
          status: true,
          priority: true,
          medicationId: true,
          prescriptionId: true,
          creditCost: true,
          fcfaEquivalent: true,
          createdAt: true,
          updatedAt: true,
          respondedAt: true,
          closedAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  const payload = {
    platform: "SABLIN PHARMA Utilisateur",
    generatedAt: new Date().toISOString(),
    notice:
      "Export personnel. Les mots de passe, secrets serveur, clés API et données internes pharmacie/admin ne sont jamais inclus.",
    user,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sablin-pharma-export-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
