import {
  isOfficialAdminRole,
  isOfficialPharmacyRole,
  normalizeRole,
  permissionsForRole,
  type ProfessionalRole,
} from "@/lib/access-control";
import { decodeSignedSession, encodeSignedSession } from "@/lib/security/session-signing";

export type ProfessionalSessionKind = "pharmacy" | "admin";

export type ProfessionalSession = {
  kind: ProfessionalSessionKind;
  accountId?: string;
  sessionId?: string;
  role: ProfessionalRole;
  name: string;
  pharmacySlug?: string;
  activePharmacySlug?: string;
  allowedPharmacySlugs?: string[];
  permissions?: string[];
  accountStatus?: "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED" | "ARCHIVED" | "DELETED";
  pharmacyStatus?: "Brouillon" | "Incomplète" | "En attente de validation" | "Validée" | "Refusée" | "Suspendue" | "Archivée";
  sessionVersion?: number;
  expiresAt?: number;
  createdAt: number;
};

export const USER_SESSION_COOKIE = "sablin_user_session";
export const PHARMACY_SESSION_COOKIE = "sablin_pharmacy_session";
export const ADMIN_SESSION_COOKIE = "sablin_admin_session";
export const PROFESSIONAL_SESSION_HOURS = Number(process.env.SABLIN_PRO_SESSION_HOURS ?? 12);

export function professionalCookieOptions(maxAgeSeconds = PROFESSIONAL_SESSION_HOURS * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function encodeProfessionalSession(session: ProfessionalSession) {
  const normalizedRole = normalizeRole(session.role) ?? session.role;
  const expiresAt = session.expiresAt ?? Date.now() + PROFESSIONAL_SESSION_HOURS * 60 * 60 * 1000;
  return encodeSignedSession({
    ...session,
    role: normalizedRole,
    activePharmacySlug: session.activePharmacySlug ?? session.pharmacySlug,
    allowedPharmacySlugs: session.allowedPharmacySlugs ?? (session.pharmacySlug ? [session.pharmacySlug] : []),
    permissions: session.permissions ?? permissionsForRole(normalizedRole),
    accountStatus: session.accountStatus ?? "ACTIVE",
    sessionVersion: session.sessionVersion ?? 1,
    expiresAt,
  });
}

export function decodeProfessionalSession(value?: string | null): ProfessionalSession | null {
  if (!value) return null;
  try {
    const parsed = decodeSignedSession<ProfessionalSession>(value);
    if (!parsed?.kind || !parsed?.role) return null;
    if (parsed.expiresAt && Number(parsed.expiresAt) < Date.now()) return null;
    const normalizedRole = normalizeRole(parsed.role);
    if (!normalizedRole) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPharmacyRole(role?: string | null) {
  return isOfficialPharmacyRole(role);
}

export function isAdminRole(role?: string | null) {
  return isOfficialAdminRole(role);
}
