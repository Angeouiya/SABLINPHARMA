import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseScheduleText(value?: string | null) {
  const text = value || "Fermé";
  if (text === "Fermé") return { enabled: false, status: "Fermé", open: "08:00", close: "18:00", breakStart: "13:00", breakEnd: "14:00" };
  if (text.includes("Ouvert 24h/24")) return { enabled: true, status: "Ouvert 24h/24", open: "00:00", close: "23:59", breakStart: "", breakEnd: "" };
  const status = text.split("·")[0]?.trim() || "Ouvert";
  const hoursMatch = text.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  const pauseMatch = text.match(/pause\s+(\d{2}:\d{2})-(\d{2}:\d{2})/);
  return {
    enabled: status !== "Fermé",
    status,
    open: hoursMatch?.[1] ?? "08:00",
    close: hoursMatch?.[2] ?? "22:00",
    breakStart: pauseMatch?.[1] ?? "13:00",
    breakEnd: pauseMatch?.[2] ?? "14:00",
  };
}

function formatScheduleDay(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback;
  const enabled = value.enabled !== false;
  const status = typeof value.status === "string" ? value.status.trim() : enabled ? "Ouvert" : "Fermé";
  if (!enabled || status === "Fermé") return "Fermé";
  if (status === "Ouvert 24h/24") return "Ouvert 24h/24";
  if (status === "Horaires à confirmer") return "Horaires à confirmer";
  if (status === "Fermeture exceptionnelle") return "Fermeture exceptionnelle";

  const open = typeof value.open === "string" && value.open.trim() ? value.open.trim() : "08:00";
  const close = typeof value.close === "string" && value.close.trim() ? value.close.trim() : "22:00";
  const breakStart = typeof value.breakStart === "string" ? value.breakStart.trim() : "";
  const breakEnd = typeof value.breakEnd === "string" ? value.breakEnd.trim() : "";
  const pause = breakStart && breakEnd ? ` · pause ${breakStart}-${breakEnd}` : "";
  return `${status || "Ouvert"} · ${open}-${close}${pause}`;
}

function parseDateInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function resolvePharmacy(req: NextRequest, permission: "pharmacy.schedule.read" | "pharmacy.schedule.update") {
  const { searchParams } = new URL(req.url);
  const requestedSlug = searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, permission, { pharmacySlug: requestedSlug });
  if (access.response) return { access, pharmacy: null };

  const pharmacySlug = requestedSlug || access.session?.pharmacySlug;
  const pharmacy = pharmacySlug ? await db.pharmacy.findUnique({ where: { slug: pharmacySlug } }) : null;
  if (!pharmacy) return { access, pharmacy: null };
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return { access, pharmacy: null };
  }
  return { access, pharmacy };
}

export async function GET(req: NextRequest) {
  const { access, pharmacy } = await resolvePharmacy(req, "pharmacy.schedule.read");
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  return NextResponse.json({
    pharmacy: {
      id: pharmacy.id,
      name: pharmacy.name,
      slug: pharmacy.slug,
      dataQuality: pharmacy.dataQuality,
      lastDataUpdate: pharmacy.lastDataUpdate,
    },
    schedule: {
      monday: parseScheduleText(pharmacy.hoursMonday ?? pharmacy.hoursWeekday),
      tuesday: parseScheduleText(pharmacy.hoursTuesday ?? pharmacy.hoursWeekday),
      wednesday: parseScheduleText(pharmacy.hoursWednesday ?? pharmacy.hoursWeekday),
      thursday: parseScheduleText(pharmacy.hoursThursday ?? pharmacy.hoursWeekday),
      friday: parseScheduleText(pharmacy.hoursFriday ?? pharmacy.hoursWeekday),
      saturday: parseScheduleText(pharmacy.hoursSaturdayDetailed ?? pharmacy.hoursSaturday),
      sunday: parseScheduleText(pharmacy.hoursSundayDetailed ?? pharmacy.hoursSunday),
    },
    duty: {
      enabled: pharmacy.isOnDuty,
      start: pharmacy.dutyStartAt,
      end: pharmacy.dutyEndAt,
      period: pharmacy.dutyPeriod,
      message: pharmacy.specialHoursMessage ?? "",
      open247: pharmacy.isOpen247,
    },
    exceptions: {
      closureStart: pharmacy.exceptionalClosureStart,
      closureEnd: pharmacy.exceptionalClosureEnd,
      openingMessage: pharmacy.exceptionalOpeningMessage ?? "",
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { access, pharmacy } = await resolvePharmacy(req, "pharmacy.schedule.update");
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const schedule = isRecord(body.schedule) ? body.schedule : {};
  const hoursMonday = formatScheduleDay(schedule.monday, pharmacy.hoursMonday ?? pharmacy.hoursWeekday);
  const hoursTuesday = formatScheduleDay(schedule.tuesday, pharmacy.hoursTuesday ?? pharmacy.hoursWeekday);
  const hoursWednesday = formatScheduleDay(schedule.wednesday, pharmacy.hoursWednesday ?? pharmacy.hoursWeekday);
  const hoursThursday = formatScheduleDay(schedule.thursday, pharmacy.hoursThursday ?? pharmacy.hoursWeekday);
  const hoursFriday = formatScheduleDay(schedule.friday, pharmacy.hoursFriday ?? pharmacy.hoursWeekday);
  const hoursSaturday = formatScheduleDay(schedule.saturday, pharmacy.hoursSaturdayDetailed ?? pharmacy.hoursSaturday);
  const hoursSunday = formatScheduleDay(schedule.sunday, pharmacy.hoursSundayDetailed ?? pharmacy.hoursSunday);
  const weekdayValues = [hoursMonday, hoursTuesday, hoursWednesday, hoursThursday, hoursFriday];
  const hoursWeekday = weekdayValues.every((item) => item === weekdayValues[0]) ? weekdayValues[0] : "Horaires détaillés par jour";

  const dutyEnabled = typeof body.dutyEnabled === "boolean" ? body.dutyEnabled : pharmacy.isOnDuty;
  const dutyStartAt = parseDateInput(body.dutyStart);
  const dutyEndAt = parseDateInput(body.dutyEnd);
  const exceptionalClosureStart = parseDateInput(body.exceptionalClosureStart);
  const exceptionalClosureEnd = parseDateInput(body.exceptionalClosureEnd);
  const exceptionalOpeningMessage = typeof body.exceptionalOpeningMessage === "string" ? body.exceptionalOpeningMessage.trim() : "";
  const specialHoursMessage = typeof body.specialMessage === "string" && body.specialMessage.trim()
    ? body.specialMessage.trim()
    : "Horaires vérifiés depuis l’espace professionnel.";

  const updated = await db.pharmacy.update({
    where: { id: pharmacy.id },
    data: {
      hoursMonday,
      hoursTuesday,
      hoursWednesday,
      hoursThursday,
      hoursFriday,
      hoursSaturdayDetailed: hoursSaturday,
      hoursSundayDetailed: hoursSunday,
      hoursWeekday,
      hoursSaturday,
      hoursSunday,
      specialHoursMessage,
      exceptionalClosureStart,
      exceptionalClosureEnd,
      exceptionalOpeningMessage: exceptionalOpeningMessage || null,
      isOnDuty: dutyEnabled,
      dutyStartAt,
      dutyEndAt,
      dutyPeriod: dutyEnabled ? `${body.dutyStart ?? "Début non précisé"} → ${body.dutyEnd ?? "Fin non précisée"}` : null,
      isOpen247: Object.values(schedule).some((item) => isRecord(item) && item.status === "Ouvert 24h/24"),
      lastDataUpdate: new Date(),
      dataQuality: "Données à jour",
    },
  });

  await db.professionalActionLog.create({
    data: {
      scope: "pharmacy",
      action: "schedule-save",
      label: "Horaires et garde enregistrés",
      pharmacyId: updated.id,
      pharmacySlug: updated.slug,
      actorRole: access.role,
      source: access.session?.kind === "admin" ? "Saisie administrateur" : "Saisie pharmacie",
      status: "réussi",
      newValue: JSON.stringify({
        schedule,
        dutyEnabled,
        dutyStartAt,
        dutyEndAt,
        exceptionalClosureStart,
        exceptionalClosureEnd,
        exceptionalOpeningMessage,
      }),
      message: "Horaires, garde et exceptions synchronisés côté utilisateur.",
    },
  });

  const url = new URL(req.url);
  url.searchParams.set("pharmacySlug", searchParams.get("pharmacySlug") || updated.slug);
  const response = await GET(new NextRequest(url, { headers: req.headers }));
  const data = await response.json();
  return NextResponse.json({ ...data, message: "Horaires, garde et exceptions synchronisés côté utilisateur." });
}
