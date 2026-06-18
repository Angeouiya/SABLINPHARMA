import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { debitCredits, RestrictionError } from "@/lib/restrictions-server";

// Debit credits for a paid action
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const amount = parseInt(body.amount, 10);
    const description = body.description ?? "Action payante";

    const result = await debitCredits(user.id, description, amount);

    return NextResponse.json({
      success: true,
      balance: result.balance,
      transaction: result.transaction,
    });
  } catch (error) {
    if (error instanceof RestrictionError) {
      return NextResponse.json(
        { error: error.message, ...error.details },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
