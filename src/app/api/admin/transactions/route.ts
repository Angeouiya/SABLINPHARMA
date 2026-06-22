import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

function startOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    INITIATED: "Paiement initié",
    PENDING: "En attente",
    PROCESSING: "En cours",
    SUCCESS: "Confirmé",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
    EXPIRED: "Expiré",
    REJECTED: "Rejeté",
    SUSPICIOUS: "Suspect",
    REFUNDED: "Remboursé",
    CHARGEBACK: "Contesté",
    MANUAL_REVIEW: "Vérification manuelle",
  };
  return labels[status] ?? status;
}

function transactionAction(type: string) {
  if (type === "recharge") return "Recharge crédits";
  if (type === "pass") return "Pass Ordonnance Unique";
  if (type === "debit") return "Crédit utilisé";
  return type;
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.transactions.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim();
  const type = searchParams.get("type")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 80) || 80, 150);

  const creditWhere: Prisma.CreditTransactionWhereInput = {
    ...(status && status !== "all" ? { status } : {}),
    ...(type && type !== "all" ? { type } : {}),
  };
  const paymentWhere: Prisma.PaymentWhereInput = {
    ...(status && status !== "all" ? { status } : {}),
    ...(type === "pass" ? { productType: "pass_ordonnance" } : type === "recharge" ? { productType: "credit_pack" } : {}),
  };

  const [
    creditTransactions,
    payments,
    creditSummary,
    debitSummary,
    passCount,
    activePassCount,
    successfulPayments,
    pendingPayments,
    failedPayments,
    suspiciousPayments,
    todayTransactions,
    usersImpacted,
  ] = await Promise.all([
    db.creditTransaction.findMany({
      where: creditWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, phone: true, commune: true } } },
    }),
    db.payment.findMany({
      where: paymentWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, phone: true, commune: true } } },
    }),
    db.creditTransaction.aggregate({ where: { type: "recharge", status: "réussi" }, _sum: { amount: true, fcfaEquivalent: true } }),
    db.creditTransaction.aggregate({ where: { type: "debit", status: "réussi" }, _sum: { amount: true, fcfaEquivalent: true } }),
    db.passOrdonnance.count(),
    db.passOrdonnance.count({ where: { status: { in: ["active", "linked"] } } }),
    db.payment.count({ where: { status: "SUCCESS" } }),
    db.payment.count({ where: { status: { in: ["INITIATED", "PENDING", "PROCESSING", "MANUAL_REVIEW"] } } }),
    db.payment.count({ where: { status: { in: ["FAILED", "CANCELLED", "EXPIRED", "REJECTED"] } } }),
    db.payment.count({ where: { OR: [{ status: "SUSPICIOUS" }, { riskStatus: { in: ["Suspect", "Bloqué"] } }] } }),
    db.creditTransaction.count({ where: { createdAt: { gte: startOfDay() } } }),
    db.creditTransaction.groupBy({ by: ["userId"], where: creditWhere, _count: { userId: true } }),
  ]);

  const creditRows = creditTransactions.map((item) => ({
    id: item.id,
    source: "credit",
    action: transactionAction(item.type),
    user: item.user?.name ?? "Utilisateur supprimé",
    userId: item.userId,
    amountFcfa: item.fcfaEquivalent,
    credits: item.amount,
    balanceBefore: item.balanceBefore,
    balanceAfter: item.balanceAfter,
    status: item.status,
    reference: item.reference ?? item.id,
    provider: item.source ?? "SABLIN",
    riskStatus: item.status === "échoué" ? "À vérifier" : "Normal",
    description: item.description,
    createdAt: item.createdAt,
  }));

  const paymentRows = payments.map((item) => ({
    id: item.id,
    source: "payment",
    action: item.productType === "pass_ordonnance" ? "Paiement Pass Ordonnance Unique" : "Paiement recharge crédits",
    user: item.user?.name ?? "Utilisateur supprimé",
    userId: item.userId,
    amountFcfa: item.amount,
    credits: item.expectedCredits,
    balanceBefore: null,
    balanceAfter: null,
    status: paymentLabel(item.status),
    reference: item.reference,
    provider: item.provider,
    riskStatus: item.riskStatus,
    description: item.productType === "pass_ordonnance" ? "Achat Pass Ordonnance Unique" : "Paiement crédits SABLIN",
    createdAt: item.createdAt,
  }));

  const rows = [...creditRows, ...paymentRows]
    .filter((row) => {
      if (!q) return true;
      return [row.action, row.user, row.reference, row.provider, row.status, row.description].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json({
    rows,
    summary: {
      creditsSold: creditSummary._sum.amount ?? 0,
      creditsSoldFcfa: creditSummary._sum.fcfaEquivalent ?? 0,
      creditsDebited: Math.abs(debitSummary._sum.amount ?? 0),
      creditsDebitedFcfa: Math.abs(debitSummary._sum.fcfaEquivalent ?? 0),
      netCredits: (creditSummary._sum.amount ?? 0) + (debitSummary._sum.amount ?? 0),
      passCount,
      activePassCount,
      successfulPayments,
      pendingPayments,
      failedPayments,
      suspiciousPayments,
      todayTransactions,
      usersImpacted: usersImpacted.length,
      totalMovements: rows.length,
      visibleRows: rows.length,
    },
  });
}
