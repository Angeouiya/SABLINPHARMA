import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createContactUnlock, UserRequestError } from "@/lib/user-requests";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const unlockType =
    body.action === "whatsapp"
      ? "whatsapp_pharmacy"
      : body.action === "call"
        ? "call_pharmacy"
        : "see_contact";

  try {
    const result = await createContactUnlock({
      userId: user.id,
      pharmacySlug: slug,
      unlockType,
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : req.headers.get("idempotency-key"),
    });

    return NextResponse.json({
      success: true,
      phone: result.contact.phone,
      whatsapp: result.contact.whatsapp,
      expiresAt: result.contact.expiresAt,
      reused: result.reused,
      balance: result.balance,
      transaction: "transaction" in result ? result.transaction : null,
      message: "Contact débloqué avec succès",
    });
  } catch (error) {
    if (error instanceof UserRequestError) {
      return NextResponse.json(
        { error: error.message, ...error.details },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
