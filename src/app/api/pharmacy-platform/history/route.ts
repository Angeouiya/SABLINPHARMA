import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

function parseJson(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "pharmacy.history.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug") || access.session?.pharmacySlug;
  const status = searchParams.get("status") || "all";
  const source = searchParams.get("source") || "all";
  const query = (searchParams.get("q") || "").trim();
  const canManageAny = hasPharmacyPermission(access.role, "view_all_pharmacies");

  if (!canManageAny && access.session?.kind === "pharmacy" && pharmacySlug !== access.session.pharmacySlug) {
    return NextResponse.json({ error: "Une pharmacie ne peut consulter que son historique." }, { status: 403 });
  }

  const pharmacy = pharmacySlug ? await db.pharmacy.findUnique({ where: { slug: pharmacySlug } }) : null;
  if (pharmacySlug && !pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const actionWhere: Prisma.ProfessionalActionLogWhereInput = pharmacy ? { pharmacyId: pharmacy.id } : {};
  if (status !== "all") actionWhere.status = status;
  if (source !== "all") actionWhere.source = source;
  if (query) {
    actionWhere.OR = [
      { action: { contains: query } },
      { label: { contains: query } },
      { message: { contains: query } },
      { actorRole: { contains: query } },
    ];
  }

  const auditWhere: Prisma.AuditLogWhereInput = pharmacy ? { pharmacyId: pharmacy.id } : {};
  if (query) {
    auditWhere.OR = [
      { action: { contains: query } },
      { actorName: { contains: query } },
      { actorRole: { contains: query } },
      { comment: { contains: query } },
    ];
  }

  const [actions, audits] = await Promise.all([
    db.professionalActionLog.findMany({
      where: actionWhere,
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    db.auditLog.findMany({
      where: auditWhere,
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const rows = [
    ...actions.map((item) => ({
      id: item.id,
      date: item.createdAt,
      action: item.label || item.action,
      technicalAction: item.action,
      author: item.actorRole || "Espace professionnel",
      source: item.source || item.scope,
      oldValue: parseJson(item.oldValue),
      newValue: parseJson(item.newValue),
      status: item.status,
      message: item.message,
      entityType: item.entityType,
      entityId: item.entityId,
      kind: "Action professionnelle",
    })),
    ...audits.map((item) => ({
      id: item.id,
      date: item.createdAt,
      action: item.action,
      technicalAction: item.action,
      author: item.actorName || item.actorRole || "Système",
      source: item.platform,
      oldValue: parseJson(item.oldValue),
      newValue: parseJson(item.newValue),
      status: item.result,
      message: item.comment,
      entityType: item.entityType,
      entityId: item.entityId,
      kind: "Audit",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const stats = {
    total: rows.length,
    success: rows.filter((item) => String(item.status).toLowerCase().includes("réussi")).length,
    review: rows.filter((item) => String(item.status).toLowerCase().includes("vérifier")).length,
    imports: rows.filter((item) => String(item.action).toLowerCase().includes("import")).length,
  };

  return NextResponse.json({ rows, stats, pharmacy: pharmacy ? { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug } : null });
}
