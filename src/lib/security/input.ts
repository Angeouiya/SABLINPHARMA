import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const MAX_JSON_BYTES = 128 * 1024;

export function rejectLargeBody(req: NextRequest, maxBytes = MAX_JSON_BYTES) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) {
    return NextResponse.json(
      { error: "Requête trop volumineuse." },
      { status: 413 }
    );
  }
  return null;
}

export function cleanText(value: unknown, maxLength = 160) {
  return String(value ?? "")
    .replace(/\0/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanOptionalText(value: unknown, maxLength = 160) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

export function textField(maxLength = 160) {
  return z.preprocess((value) => cleanText(value, maxLength), z.string().min(1).max(maxLength));
}

export function optionalTextField(maxLength = 160) {
  return z.preprocess((value) => cleanOptionalText(value, maxLength), z.string().max(maxLength).nullable());
}

export function validationErrorResponse() {
  return NextResponse.json(
    { error: "Données invalides. Vérifiez les champs puis réessayez." },
    { status: 400 }
  );
}
