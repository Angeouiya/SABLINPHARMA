import { NextRequest, NextResponse } from "next/server";
import { coverageReportFor, type PlatformScope } from "@/lib/platform-ux-sync";

export const dynamic = "force-dynamic";

function scopeFromRequest(req: NextRequest): PlatformScope | undefined {
  const value = req.nextUrl.searchParams.get("scope");
  return value === "user" || value === "pharmacy" || value === "admin" ? value : undefined;
}

export async function GET(req: NextRequest) {
  return NextResponse.json(coverageReportFor(scopeFromRequest(req)));
}
