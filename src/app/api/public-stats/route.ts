import { NextResponse } from "next/server";
import { getPublicPlatformStats } from "@/lib/public-platform-stats";

export async function GET() {
  return NextResponse.json(await getPublicPlatformStats());
}
