import { NextResponse } from "next/server";
import { CONTACT_UNLOCK_DURATION_HOURS, USER_SERVICES } from "@/config/user-services";

export async function GET() {
  return NextResponse.json({
    creditRule: "1 crédit = 100 FCFA",
    contactUnlockDurationHours: CONTACT_UNLOCK_DURATION_HOURS,
    services: USER_SERVICES,
  });
}
