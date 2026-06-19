import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAdvancedFeature, lockedFeaturePayload, unlockAdvancedFeature, type AdvancedFeatureKey } from "@/lib/credit-gates";
import { RestrictionError } from "@/lib/restrictions-server";

const ALLOWED_FEATURES: AdvancedFeatureKey[] = [
  "seeMedicationPharmacies",
  "seeDetailedPrices",
  "addMedicationToPrescription",
  "comparePharmacies",
  "comparePharmacyPrices",
  "seePharmacyInventory",
  "seePharmacyContact",
  "callPharmacy",
  "whatsappPharmacy",
  "advicePharmacy",
  "confirmAvailability",
  "confirmPrice",
  "confirmFull",
  "alertAvailability",
];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  const body = await req.json().catch(() => ({}));
  const featureKey = String(body.featureKey ?? "") as AdvancedFeatureKey;
  const entityType = String(body.entityType ?? "").trim();
  const entityId = String(body.entityId ?? "").trim();

  if (!ALLOWED_FEATURES.includes(featureKey) || !entityType || !entityId) {
    return NextResponse.json({ error: "Demande de déblocage invalide." }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json(
      lockedFeaturePayload({ featureKey, isAuthenticated: false }),
      { status: 401 }
    );
  }

  try {
    const result = await unlockAdvancedFeature({
      userId: user.id,
      featureKey,
      entityType,
      entityId,
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : req.headers.get("idempotency-key"),
    });
    const feature = getAdvancedFeature(featureKey);
    return NextResponse.json({
      success: true,
      access: {
        featureKey,
        entityType,
        entityId,
        expiresAt: result.access.expiresAt,
        status: result.access.status,
      },
      balance: result.balance,
      transaction: result.transaction,
      reused: result.reused,
      message: `${feature.name} débloqué avec succès.`,
    });
  } catch (error) {
    if (error instanceof RestrictionError) {
      return NextResponse.json(
        {
          ...lockedFeaturePayload({
            featureKey,
            isAuthenticated: true,
            balance: typeof error.details?.balance === "number" ? error.details.balance : 0,
          }),
          error: error.message,
          ...error.details,
        },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Déblocage impossible." }, { status: 500 });
  }
}

