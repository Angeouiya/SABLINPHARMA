import { NextRequest, NextResponse } from "next/server";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function line(value: string, max = 34) {
  const safe = value.trim();
  return safe.length > max ? `${safe.slice(0, max - 1)}…` : safe;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = line(searchParams.get("name") || "Médicament");
  const dci = line(searchParams.get("dci") || "DCI à confirmer");
  const dosage = line(searchParams.get("dosage") || "Dosage à confirmer", 24);
  const form = line(searchParams.get("form") || "Forme à confirmer", 24);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="Image du produit non disponible">
  <rect width="800" height="800" fill="#ffffff"/>
  <rect x="32" y="32" width="736" height="736" rx="28" fill="#f6f8f7" stroke="#d8e2dd" stroke-width="4"/>
  <circle cx="400" cy="245" r="84" fill="#e1f4ea" stroke="#0b7a53" stroke-width="6"/>
  <rect x="345" y="225" width="110" height="40" rx="20" fill="#0b7a53"/>
  <rect x="380" y="190" width="40" height="110" rx="20" fill="#0b7a53"/>
  <text x="400" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#10251d">${escapeXml(name)}</text>
  <text x="400" y="445" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" font-weight="600" fill="#31463e">${escapeXml(dci)}</text>
  <text x="400" y="495" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0b7a53">${escapeXml(dosage)} · ${escapeXml(form)}</text>
  <rect x="160" y="565" width="480" height="58" rx="12" fill="#ffffff" stroke="#d8e2dd" stroke-width="3"/>
  <text x="400" y="602" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#10251d">Image du produit non disponible</text>
  <text x="400" y="675" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="600" fill="#5c6f67">Visuel neutre SABLIN PHARMA, non contractuel</text>
</svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
