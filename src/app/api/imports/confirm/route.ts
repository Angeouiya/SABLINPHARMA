import { NextRequest, NextResponse } from "next/server";
import { confirmImportFromRequest } from "@/lib/marketplace-api";

export async function POST(req: NextRequest) {
  try {
    const { result, response } = await confirmImportFromRequest(req);
    if (response) return response;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Confirmation import impossible." },
      { status: 400 }
    );
  }
}
