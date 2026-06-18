import { NextRequest, NextResponse } from "next/server";
import {
  LEGACY_PERMISSION_MAP,
  hasPermission,
  isOfficialAdminRole,
  isOfficialPharmacyRole,
  normalizeRole,
  type Permission,
  type ProfessionalRole,
} from "@/lib/access-control";
import {
  ADMIN_SESSION_COOKIE,
  PHARMACY_SESSION_COOKIE,
  type ProfessionalSession,
  decodeProfessionalSession,
} from "@/lib/professional-sessions";

export type PharmacyRole = ProfessionalRole;

export type PharmacyPermission =
  | "view_own_dashboard"
  | "update_inventory"
  | "import_inventory"
  | "handle_requests"
  | "manage_schedule"
  | "manage_own_profile"
  | "view_all_pharmacies"
  | "create_pharmacy"
  | "validate_pharmacy"
  | "suspend_pharmacy"
  | "manage_any_inventory"
  | Permission;

function sessionForRequest(req: NextRequest, kind?: "admin" | "pharmacy") {
  const adminSession = decodeProfessionalSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const pharmacySession = decodeProfessionalSession(req.cookies.get(PHARMACY_SESSION_COOKIE)?.value);
  if (kind === "admin") return adminSession;
  if (kind === "pharmacy") return pharmacySession;
  return adminSession ?? pharmacySession;
}

function requestedKind(req: NextRequest) {
  const header = req.headers.get("x-sablin-session-kind");
  return header === "admin" || header === "pharmacy" ? header : undefined;
}

export function isPharmacyRole(value: unknown): value is PharmacyRole {
  return isOfficialPharmacyRole(String(value ?? ""));
}

export function hasPharmacyPermission(role: PharmacyRole | null | undefined, permission: PharmacyPermission) {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return hasPermission(
    {
      kind: isOfficialAdminRole(normalized) ? "admin" : "pharmacy",
      role: normalized,
      accountStatus: "ACTIVE",
      pharmacyStatus: "Validée",
      permissions: [],
    },
    LEGACY_PERMISSION_MAP[permission] ?? permission
  ).allowed;
}

export function getProfessionalSessionFromRequest(req: NextRequest, kind?: "admin" | "pharmacy") {
  return sessionForRequest(req, kind) as ProfessionalSession | null;
}

export function getRoleFromRequest(req: NextRequest) {
  const kind = requestedKind(req);
  const session = sessionForRequest(req, kind);
  if (session?.role && normalizeRole(session.role)) return normalizeRole(session.role);
  const role = req.headers.get("x-sablin-pharmacy-role");
  return normalizeRole(role);
}

export function requirePharmacyPermission(
  req: NextRequest,
  permission: PharmacyPermission,
  context: { pharmacySlug?: string | null } = {}
) {
  const kind = requestedKind(req);
  const session = sessionForRequest(req, kind);
  const role = getRoleFromRequest(req);
  if (!role || !session) {
    return {
      role: null,
      session: null,
      response: NextResponse.json(
        {
          error:
            kind === "admin"
              ? "Accès réservé à l’administration SABLIN PHARMA."
              : "Accès réservé aux pharmacies partenaires.",
        },
        { status: 401 }
      ),
    };
  }

  const required = LEGACY_PERMISSION_MAP[permission] ?? permission;
  const result = hasPermission(
    {
      id: session.accountId,
      kind: session.kind,
      role,
      permissions: session.permissions,
      accountStatus: session.accountStatus ?? "ACTIVE",
      pharmacyStatus: session.pharmacyStatus,
      activePharmacySlug: session.activePharmacySlug ?? session.pharmacySlug,
      allowedPharmacySlugs: session.allowedPharmacySlugs ?? (session.pharmacySlug ? [session.pharmacySlug] : []),
    },
    required,
    context
  );

  if (!result.allowed) {
    return {
      role,
      session,
      response: NextResponse.json({ error: result.message, reason: result.reason }, { status: 403 }),
    };
  }

  return { role, session, response: null };
}

export function canAccessPharmacyTab(role: PharmacyRole | null, tab: string) {
  if (!role) return tab === "auth";
  const map: Record<string, PharmacyPermission> = {
    dashboard: "view_own_dashboard",
    inventory: "update_inventory",
    requests: "handle_requests",
    confirmations: "handle_requests",
    advice: "handle_requests",
    history: "view_own_dashboard",
    notifications: "view_own_dashboard",
    import: "import_inventory",
    schedule: "manage_schedule",
    profile: "manage_own_profile",
    settings: "manage_own_profile",
    "admin-create": "create_pharmacy",
    admin: "view_all_pharmacies",
  };
  return hasPharmacyPermission(role, map[tab] ?? "view_own_dashboard");
}
