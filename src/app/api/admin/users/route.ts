import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

type AdminUserPayload = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        creditTransactions: true;
        payments: true;
        pharmacyRequests: true;
        contactUnlocks: true;
        featureAccesses: true;
        favorites: true;
        history: true;
        notifications: true;
        passOrdonnances: true;
      };
    };
    creditTransactions: true;
    pharmacyRequests: true;
    payments: true;
    passOrdonnances: true;
    contactUnlocks: true;
    favorites: true;
    history: true;
  };
}>;

function startOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function publicStatus(input: { credits: number; lastActivity?: Date | null; createdAt: Date }) {
  if (input.credits <= 0) return "Solde insuffisant";
  if (input.lastActivity && input.lastActivity >= since(30)) return "Actif";
  if (input.createdAt >= since(7)) return "Nouveau";
  return "À surveiller";
}

function latestDate(values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  if (dates.length === 0) return null;
  return dates.reduce((latest, value) => (value > latest ? value : latest), dates[0]);
}

function serializeUser(user: AdminUserPayload) {
  const lastTransaction = user.creditTransactions[0]?.createdAt ?? null;
  const lastHistory = user.history[0]?.createdAt ?? null;
  const lastRequest = user.pharmacyRequests[0]?.createdAt ?? null;
  const lastPayment = user.payments[0]?.createdAt ?? null;
  const lastActivity = latestDate([user.updatedAt, lastTransaction, lastHistory, lastRequest, lastPayment]);
  const passActive = user.passOrdonnances.some((pass) => ["active", "linked", "Actif", "Lié à une ordonnance"].includes(pass.status));
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    commune: user.commune,
    credits: user.credits,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastActivity,
    status: publicStatus({ credits: user.credits, lastActivity, createdAt: user.createdAt }),
    passStatus: passActive ? "Pass actif" : user.passOrdonnances.length > 0 ? "Pass utilisé ou expiré" : "Aucun pass",
    counts: {
      transactions: user._count.creditTransactions,
      payments: user._count.payments,
      requests: user._count.pharmacyRequests,
      contacts: user._count.contactUnlocks,
      featureAccesses: user._count.featureAccesses,
      favorites: user._count.favorites,
      history: user._count.history,
      notifications: user._count.notifications,
      passOrdonnances: user._count.passOrdonnances,
    },
    recent: {
      transactions: user.creditTransactions.map((item) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        fcfaEquivalent: item.fcfaEquivalent,
        balanceBefore: item.balanceBefore,
        balanceAfter: item.balanceAfter,
        status: item.status,
        reference: item.reference,
        description: item.description,
        createdAt: item.createdAt,
      })),
      requests: user.pharmacyRequests.map((item) => ({
        id: item.id,
        reference: item.reference,
        requestType: item.requestType,
        serviceName: item.serviceName,
        status: item.status,
        priority: item.priority,
        creditCost: item.creditCost,
        createdAt: item.createdAt,
      })),
      payments: user.payments.map((item) => ({
        id: item.id,
        reference: item.reference,
        amount: item.amount,
        provider: item.provider,
        productType: item.productType,
        status: item.status,
        riskStatus: item.riskStatus,
        createdAt: item.createdAt,
      })),
      passOrdonnances: user.passOrdonnances.map((item) => ({
        id: item.id,
        status: item.status,
        price: item.price,
        ordonnanceId: item.ordonnanceId,
        paymentReference: item.paymentReference,
        createdAt: item.createdAt,
        usedAt: item.usedAt,
      })),
      contacts: user.contactUnlocks.map((item) => ({
        id: item.id,
        unlockType: item.unlockType,
        creditCost: item.creditCost,
        status: item.status,
        unlockedAt: item.unlockedAt,
        expiresAt: item.expiresAt,
      })),
      favorites: user.favorites.map((item) => ({
        id: item.id,
        kind: item.kind,
        slug: item.slug,
        label: item.label,
        createdAt: item.createdAt,
      })),
      history: user.history.map((item) => ({
        id: item.id,
        kind: item.kind,
        label: item.label,
        query: item.query,
        slug: item.slug,
        createdAt: item.createdAt,
      })),
    },
  };
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.users.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const commune = searchParams.get("commune")?.trim();
  const userId = searchParams.get("userId")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 100);

  const where: Prisma.UserWhereInput = {
    ...(userId ? { id: userId } : {}),
    ...(commune && commune !== "all" ? { commune } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { commune: { contains: query } },
          ],
        }
      : {}),
  };

  const [users, totalUsers, usersWithCredits, zeroCreditUsers, activeUsers, transactionsToday, pendingRequests] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        _count: {
          select: {
            creditTransactions: true,
            payments: true,
            pharmacyRequests: true,
            contactUnlocks: true,
            featureAccesses: true,
            favorites: true,
            history: true,
            notifications: true,
            passOrdonnances: true,
          },
        },
        creditTransactions: { orderBy: { createdAt: "desc" }, take: userId ? 12 : 3 },
        pharmacyRequests: { orderBy: { createdAt: "desc" }, take: userId ? 12 : 3 },
        payments: { orderBy: { createdAt: "desc" }, take: userId ? 12 : 3 },
        passOrdonnances: { orderBy: { createdAt: "desc" }, take: userId ? 8 : 2 },
        contactUnlocks: { orderBy: { unlockedAt: "desc" }, take: userId ? 8 : 2 },
        favorites: { orderBy: { createdAt: "desc" }, take: userId ? 8 : 2 },
        history: { orderBy: { createdAt: "desc" }, take: userId ? 8 : 2 },
      },
    }),
    db.user.count({ where }),
    db.user.count({ where: { credits: { gt: 0 } } }),
    db.user.count({ where: { credits: { lte: 0 } } }),
    db.user.count({
      where: {
        OR: [
          { history: { some: { createdAt: { gte: since(30) } } } },
          { creditTransactions: { some: { createdAt: { gte: since(30) } } } },
          { pharmacyRequests: { some: { createdAt: { gte: since(30) } } } },
        ],
      },
    }),
    db.creditTransaction.count({ where: { createdAt: { gte: startOfDay() } } }),
    db.pharmacyRequest.count({ where: { status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
  ]);

  const serialized = users.map(serializeUser);
  return NextResponse.json({
    users: serialized,
    user: userId ? serialized[0] ?? null : undefined,
    summary: {
      totalUsers,
      usersWithCredits,
      zeroCreditUsers,
      activeUsers,
      transactionsToday,
      pendingRequests,
      listedUsers: serialized.length,
      totalCreditsVisible: serialized.reduce((sum, user) => sum + user.credits, 0),
      totalTransactionsVisible: serialized.reduce((sum, user) => sum + user.counts.transactions, 0),
      totalPassVisible: serialized.reduce((sum, user) => sum + user.counts.passOrdonnances, 0),
    },
  });
}
