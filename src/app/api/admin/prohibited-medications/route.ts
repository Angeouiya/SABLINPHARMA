import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import {
  addProhibitedMedicationTerm,
  disableProhibitedMedicationTerm,
  enableProhibitedMedicationTerm,
} from "@/lib/prohibited-medications";

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") || "all";
  const where: Prisma.ProhibitedMedicationTermWhereInput = {
    ...(includeInactive || status !== "active" ? {} : { active: true }),
    ...(status === "active" ? { active: true } : status === "inactive" ? { active: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { normalizedName: { contains: q.toLowerCase() } },
            { reason: { contains: q } },
          ],
        }
      : {}),
  };

  const [terms, total, active, inactive, blockedImportRows, recentActions] = await Promise.all([
    db.prohibitedMedicationTerm.findMany({
      where,
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
      take: 150,
    }),
    db.prohibitedMedicationTerm.count(),
    db.prohibitedMedicationTerm.count({ where: { active: true } }),
    db.prohibitedMedicationTerm.count({ where: { active: false } }),
    db.inventoryImportRow.count({ where: { errorsJson: { contains: "Médicament interdit" } } }),
    db.professionalActionLog.findMany({
      where: { scope: "admin", entityType: "prohibited-medication" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, label: true, action: true, status: true, actorRole: true, message: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    terms,
    summary: { total, active, inactive, blockedImportRows, visible: terms.length },
    recentActions,
    filters: { includeInactive, q, status },
  });
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
    const action = String(body.action ?? "disable");
    const actor = access.session?.name ?? access.role ?? "Administration SABLIN";
    const term =
      action === "enable"
        ? await enableProhibitedMedicationTerm({ id, enabledBy: actor })
        : await disableProhibitedMedicationTerm({
            id,
            disabledBy: actor,
          });

    await db.professionalActionLog.create({
      data: {
        scope: "admin",
        action: action === "enable" ? "prohibited-medication-enabled" : "prohibited-medication-disabled",
        label: action === "enable" ? "Médicament interdit réactivé" : "Médicament interdit désactivé",
        entityType: "prohibited-medication",
        entityId: term.id,
        actorRole: access.role ?? "admin",
        status: "réussi",
        message:
          action === "enable"
            ? `${term.name} bloque à nouveau automatiquement les publications pharmacie.`
            : `${term.name} n’est plus bloqué automatiquement.`,
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
