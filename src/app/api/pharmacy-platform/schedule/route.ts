import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedSlug = searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, "pharmacy.schedule.read", { pharmacySlug: requestedSlug });
  if (access.response) return access.response;

  const pharmacySlug = requestedSlug || access.session?.pharmacySlug;
  const pharmacy = pharmacySlug ? await db.pharmacy.findUnique({ where: { slug: pharmacySlug } }) : null;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return NextResponse.json({ error: "Une pharmacie ne peut consulter que ses horaires." }, { status: 403 });
  }

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
  });
}
