import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import {
  addProhibitedMedicationTerm,
  disableProhibitedMedicationTerm,
} from "@/lib/prohibited-medications";

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const terms = await db.prohibitedMedicationTerm.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ terms });
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  try {
    const term = await addProhibitedMedicationTerm({
      name: String(body.name ?? ""),
      reason: body.reason ? String(body.reason) : null,
      createdBy: access.session?.name ?? access.role ?? "Administration SABLIN",
    });

    await db.professionalActionLog.create({
      data: {
        scope: "admin",
        action: "prohibited-medication-added",
        label: "Médicament interdit ajouté",
        entityType: "prohibited-medication",
        entityId: term.id,
        actorRole: access.role ?? "admin",
        status: "réussi",
        message: `${term.name} est maintenant retiré automatiquement des publications pharmacie.`,
        source: "Administration SABLIN",
        details: JSON.stringify({ name: term.name, reason: term.reason }),
      },
    }).catch(() => null);

    return NextResponse.json({ term }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ajout impossible." },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Identifiant obligatoire." }, { status: 400 });
  }

  try {
    const term = await disableProhibitedMedicationTerm({
      id,
      disabledBy: access.session?.name ?? access.role ?? "Administration SABLIN",
    });

    await db.professionalActionLog.create({
      data: {
        scope: "admin",
        action: "prohibited-medication-disabled",
        label: "Médicament interdit désactivé",
        entityType: "prohibited-medication",
        entityId: term.id,
        actorRole: access.role ?? "admin",
        status: "réussi",
        message: `${term.name} n’est plus bloqué automatiquement.`,
        source: "Administration SABLIN",
      },
    }).catch(() => null);

    return NextResponse.json({ term });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Désactivation impossible." },
      { status: 400 }
    );
  }
}
