import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createContactUnlock, UserRequestError } from "@/lib/user-requests";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    const result = await createContactUnlock({
      userId: user.id,
      pharmacySlug: String(body.pharmacySlug ?? ""),
      unlockType: body.unlockType === "call_pharmacy" || body.unlockType === "whatsapp_pharmacy" ? body.unlockType : "see_contact",
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : req.headers.get("idempotency-key"),
    });
    return NextResponse.json({
      success: true,
      reused: result.reused,
      balance: result.balance,
      unlock: result.unlock,
      contact: result.contact,
      message: "Contact débloqué avec succès",
    });
  } catch (error) {
    if (error instanceof UserRequestError) {
      return NextResponse.json({ error: error.message, ...error.details }, { status: error.status });
    }
    return NextResponse.json({ error: "Erreur lors du déblocage du contact." }, { status: 500 });
  }
}
