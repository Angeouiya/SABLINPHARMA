import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const descriptionId = String(body.descriptionId ?? "").trim();
  if (!descriptionId) return NextResponse.json({ error: "Description obligatoire." }, { status: 400 });
  const description = await db.medicationDescription.update({
    where: { id: descriptionId },
    data: {
      validationStatus: "Validée",
      validatedBy: access.session?.name ?? access.role ?? null,
      validatedAt: new Date(),
    },
  });
  return NextResponse.json({ description, message: "Description validée. Publication séparée obligatoire." });
}
