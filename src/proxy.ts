import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  PHARMACY_SESSION_COOKIE,
  decodeProfessionalSession,
  isAdminRole,
  isPharmacyRole,
} from "@/lib/professional-sessions";
import { rateLimit, rateLimitForPath } from "@/lib/security/rate-limit";

const publicPharmacyRoutes = [
  "/pharmacie/login",
  "/pharmacie/connexion",
  "/pharmacie/inscription",
  "/pharmacie/validation-en-attente",
  "/pharmacie/compte-suspendu",
];
const publicAdminRoutes = ["/admin/login", "/admin/connexion"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const limited = rateLimit(req, rateLimitForPath(pathname));
    if (limited) return limited;
  }

  if (pathname === "/pharmacie") {
    return NextResponse.redirect(new URL("/pharmacie/connexion", req.url));
  }

  if (pathname.startsWith("/pharmacie") && !publicPharmacyRoutes.includes(pathname)) {
    const session = decodeProfessionalSession(req.cookies.get(PHARMACY_SESSION_COOKIE)?.value);
    if (!session || session.kind !== "pharmacy" || !isPharmacyRole(session.role)) {
      return NextResponse.redirect(new URL("/pharmacie/connexion?restricted=pharmacy", req.url));
    }
    if (
      (session.accountStatus === "SUSPENDED" || session.pharmacyStatus === "Suspendue") &&
      pathname !== "/pharmacie/compte-suspendu"
    ) {
      return NextResponse.redirect(new URL("/pharmacie/compte-suspendu", req.url));
    }
    if (
      session.pharmacyStatus &&
      session.pharmacyStatus !== "Validée" &&
      pathname !== "/pharmacie/dashboard" &&
      pathname !== "/pharmacie/tableau-de-bord" &&
      pathname !== "/pharmacie/profil" &&
      pathname !== "/pharmacie/parametres" &&
      pathname !== "/pharmacie/validation-en-attente"
    ) {
      return NextResponse.redirect(new URL("/pharmacie/validation-en-attente", req.url));
    }
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/connexion", req.url));
  }

  if (pathname.startsWith("/admin") && !publicAdminRoutes.includes(pathname)) {
    const session = decodeProfessionalSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!session || session.kind !== "admin" || !isAdminRole(session.role)) {
      return NextResponse.redirect(new URL("/admin/connexion?restricted=admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/pharmacie/:path*", "/admin/:path*"],
};
