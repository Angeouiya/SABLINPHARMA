export const ACCOUNT_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "BLOCKED",
  "ARCHIVED",
  "DELETED",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const USER_ROLES = ["USER"] as const;

export const PHARMACY_ROLES = [
  "PHARMACY_OWNER",
  "PHARMACIST_MANAGER",
  "PHARMACY_EMPLOYEE",
  "PHARMACY_STOCK_MANAGER",
  "PHARMACY_SUPPORT_AGENT",
] as const;

export const ADMIN_ROLES = [
  "ADMIN",
  "DATA_ADMIN",
  "PHARMACY_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "SUPER_ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type PharmacyRole = (typeof PHARMACY_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type OfficialRole = UserRole | PharmacyRole | AdminRole;
export type LegacyProfessionalRole =
  | "Pharmacien responsable"
  | "Employé pharmacie"
  | "Administrateur SABLIN"
  | "Super administrateur";
export type ProfessionalRole = OfficialRole | LegacyProfessionalRole;

export const ROLE_LABELS: Record<OfficialRole, string> = {
  USER: "Utilisateur",
  PHARMACY_OWNER: "Propriétaire",
  PHARMACIST_MANAGER: "Responsable",
  PHARMACY_EMPLOYEE: "Employé",
  PHARMACY_STOCK_MANAGER: "Gestionnaire de stock",
  PHARMACY_SUPPORT_AGENT: "Agent support pharmacie",
  ADMIN: "Administrateur",
  DATA_ADMIN: "Administrateur données",
  PHARMACY_ADMIN: "Administrateur pharmacies",
  FINANCE_ADMIN: "Administrateur finance",
  SUPPORT_ADMIN: "Administrateur support",
  SUPER_ADMIN: "Super administrateur",
};

export const LEGACY_ROLE_MAP: Record<string, OfficialRole> = {
  "Pharmacien responsable": "PHARMACY_OWNER",
  "Employé pharmacie": "PHARMACY_EMPLOYEE",
  "Administrateur SABLIN": "ADMIN",
  "Super administrateur": "SUPER_ADMIN",
  employee: "PHARMACY_EMPLOYEE",
  employe: "PHARMACY_EMPLOYEE",
  pharmacist: "PHARMACY_OWNER",
  pharmacy: "PHARMACY_OWNER",
  responsable: "PHARMACY_OWNER",
  admin: "ADMIN",
  sablin_admin: "ADMIN",
  super_admin: "SUPER_ADMIN",
  superadmin: "SUPER_ADMIN",
};

export const PHARMACY_PERMISSIONS = [
  "pharmacy.profile.read",
  "pharmacy.profile.update",
  "pharmacy.images.read",
  "pharmacy.images.create",
  "pharmacy.images.update",
  "pharmacy.images.delete",
  "pharmacy.schedule.read",
  "pharmacy.schedule.update",
  "pharmacy.inventory.read",
  "pharmacy.inventory.create",
  "pharmacy.inventory.update",
  "pharmacy.inventory.delete",
  "pharmacy.inventory.import",
  "pharmacy.requests.read",
  "pharmacy.requests.assign",
  "pharmacy.requests.respond",
  "pharmacy.confirmations.read",
  "pharmacy.confirmations.respond",
  "pharmacy.advice.respond",
  "pharmacy.team.read",
  "pharmacy.team.invite",
  "pharmacy.team.update",
  "pharmacy.team.remove",
  "pharmacy.history.read",
  "pharmacy.settings.update",
] as const;

export const ADMIN_PERMISSIONS = [
  "admin.dashboard.read",
  "admin.pharmacies.read",
  "admin.pharmacies.create",
  "admin.pharmacies.update",
  "admin.pharmacies.validate",
  "admin.pharmacies.suspend",
  "admin.pharmacies.archive",
  "admin.pharmacies.manage_context",
  "admin.users.read",
  "admin.users.update",
  "admin.users.suspend",
  "admin.medications.read",
  "admin.medications.create",
  "admin.medications.update",
  "admin.medications.disable",
  "admin.imports.read",
  "admin.imports.manage",
  "admin.data_quality.read",
  "admin.data_quality.update",
  "admin.transactions.read",
  "admin.transactions.adjust",
  "admin.transactions.refund",
  "admin.audit.read",
  "admin.admins.manage",
  "admin.settings.manage",
] as const;

export type Permission =
  | (typeof PHARMACY_PERMISSIONS)[number]
  | (typeof ADMIN_PERMISSIONS)[number];

const OWNER_PERMISSIONS: Permission[] = [...PHARMACY_PERMISSIONS];
const MANAGER_PERMISSIONS: Permission[] = [
  "pharmacy.profile.read",
  "pharmacy.profile.update",
  "pharmacy.images.read",
  "pharmacy.images.create",
  "pharmacy.images.update",
  "pharmacy.schedule.read",
  "pharmacy.schedule.update",
  "pharmacy.inventory.read",
  "pharmacy.inventory.create",
  "pharmacy.inventory.update",
  "pharmacy.inventory.import",
  "pharmacy.requests.read",
  "pharmacy.requests.assign",
  "pharmacy.requests.respond",
  "pharmacy.confirmations.read",
  "pharmacy.confirmations.respond",
  "pharmacy.advice.respond",
  "pharmacy.history.read",
];
const EMPLOYEE_PERMISSIONS: Permission[] = [
  "pharmacy.profile.read",
  "pharmacy.schedule.read",
  "pharmacy.inventory.read",
  "pharmacy.inventory.update",
  "pharmacy.requests.read",
  "pharmacy.confirmations.read",
  "pharmacy.history.read",
];
const STOCK_PERMISSIONS: Permission[] = [
  "pharmacy.inventory.read",
  "pharmacy.inventory.create",
  "pharmacy.inventory.update",
  "pharmacy.inventory.import",
  "pharmacy.history.read",
];
const SUPPORT_PERMISSIONS: Permission[] = [
  "pharmacy.requests.read",
  "pharmacy.requests.respond",
  "pharmacy.confirmations.read",
  "pharmacy.confirmations.respond",
  "pharmacy.advice.respond",
  "pharmacy.history.read",
];

export const ROLE_PERMISSIONS: Record<OfficialRole, Permission[]> = {
  USER: [],
  PHARMACY_OWNER: OWNER_PERMISSIONS,
  PHARMACIST_MANAGER: MANAGER_PERMISSIONS,
  PHARMACY_EMPLOYEE: EMPLOYEE_PERMISSIONS,
  PHARMACY_STOCK_MANAGER: STOCK_PERMISSIONS,
  PHARMACY_SUPPORT_AGENT: SUPPORT_PERMISSIONS,
  ADMIN: [
    "admin.dashboard.read",
    "admin.pharmacies.read",
    "admin.users.read",
    "admin.imports.read",
    "admin.data_quality.read",
    "admin.audit.read",
  ],
  DATA_ADMIN: [
    "admin.dashboard.read",
    "admin.medications.read",
    "admin.medications.create",
    "admin.medications.update",
    "admin.medications.disable",
    "admin.imports.read",
    "admin.imports.manage",
    "admin.data_quality.read",
    "admin.data_quality.update",
    "admin.audit.read",
  ],
  PHARMACY_ADMIN: [
    "admin.dashboard.read",
    "admin.pharmacies.read",
    "admin.pharmacies.create",
    "admin.pharmacies.update",
    "admin.pharmacies.validate",
    "admin.pharmacies.suspend",
    "admin.pharmacies.archive",
    "admin.pharmacies.manage_context",
    "admin.imports.read",
    "admin.imports.manage",
    "admin.audit.read",
  ],
  FINANCE_ADMIN: [
    "admin.dashboard.read",
    "admin.transactions.read",
    "admin.transactions.adjust",
    "admin.transactions.refund",
    "admin.audit.read",
  ],
  SUPPORT_ADMIN: [
    "admin.dashboard.read",
    "admin.users.read",
    "admin.users.update",
    "admin.pharmacies.read",
    "admin.audit.read",
  ],
  SUPER_ADMIN: [...ADMIN_PERMISSIONS, ...PHARMACY_PERMISSIONS],
};

export const LEGACY_PERMISSION_MAP: Record<string, Permission> = {
  view_own_dashboard: "pharmacy.profile.read",
  update_inventory: "pharmacy.inventory.update",
  import_inventory: "pharmacy.inventory.import",
  handle_requests: "pharmacy.requests.respond",
  manage_schedule: "pharmacy.schedule.update",
  manage_own_profile: "pharmacy.profile.update",
  view_all_pharmacies: "admin.pharmacies.read",
  create_pharmacy: "admin.pharmacies.create",
  validate_pharmacy: "admin.pharmacies.validate",
  suspend_pharmacy: "admin.pharmacies.suspend",
  manage_any_inventory: "admin.pharmacies.manage_context",
};

export type AccessSubject = {
  id?: string | null;
  kind?: "user" | "pharmacy" | "admin" | null;
  role?: string | null;
  permissions?: string[] | null;
  accountStatus?: string | null;
  pharmacyStatus?: string | null;
  activePharmacySlug?: string | null;
  allowedPharmacySlugs?: string[] | null;
};

export type AccessContext = {
  pharmacySlug?: string | null;
  allowAdminContext?: boolean;
};

export function normalizeRole(role?: string | null): OfficialRole | null {
  if (!role) return null;
  if ([...USER_ROLES, ...PHARMACY_ROLES, ...ADMIN_ROLES].includes(role as OfficialRole)) {
    return role as OfficialRole;
  }
  return LEGACY_ROLE_MAP[role] ?? LEGACY_ROLE_MAP[role.toLowerCase()] ?? null;
}

export function isOfficialPharmacyRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return Boolean(normalized && PHARMACY_ROLES.includes(normalized as PharmacyRole));
}

export function isOfficialAdminRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return Boolean(normalized && ADMIN_ROLES.includes(normalized as AdminRole));
}

export function permissionsForRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_PERMISSIONS[normalized] ?? [] : [];
}

export function uniquePermissions(...groups: Array<readonly string[] | null | undefined>) {
  return [...new Set(groups.flatMap((group) => group ?? []))] as Permission[];
}

export function safeJsonArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function hasPermission(subject: AccessSubject, permission: Permission | string, context: AccessContext = {}) {
  const normalizedRole = normalizeRole(subject.role);
  if (!normalizedRole) {
    return {
      allowed: false,
      reason: "Accès non autorisé",
      message: "Vous ne disposez pas de l’autorisation nécessaire pour effectuer cette action.",
    };
  }
  if (subject.accountStatus && subject.accountStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: `Compte ${subject.accountStatus}`,
      message:
        subject.accountStatus === "SUSPENDED"
          ? "Votre espace est suspendu. Contactez le support SABLIN PHARMA."
          : "Votre compte ne permet pas cette action.",
    };
  }
  if (subject.kind === "pharmacy" && subject.pharmacyStatus && subject.pharmacyStatus !== "Validée") {
    return {
      allowed: false,
      reason: "Pharmacie non validée",
      message: "Votre pharmacie est en cours de validation par l’équipe SABLIN PHARMA.",
    };
  }

  const requested = LEGACY_PERMISSION_MAP[permission] ?? permission;
  const effectivePermissions = uniquePermissions(permissionsForRole(normalizedRole), subject.permissions);
  const allowedByPermission = effectivePermissions.includes(requested as Permission);
  if (!allowedByPermission) {
    return {
      allowed: false,
      reason: "Permission insuffisante",
      message: "Vous ne disposez pas de l’autorisation nécessaire pour effectuer cette action.",
    };
  }

  if (
    subject.kind === "pharmacy" &&
    context.pharmacySlug &&
    !subject.allowedPharmacySlugs?.includes(context.pharmacySlug)
  ) {
    return {
      allowed: false,
      reason: "Pharmacie non autorisée",
      message: "Vous n’avez pas accès aux données de cette pharmacie.",
    };
  }

  return {
    allowed: true,
    reason: "Autorisé",
    message: "Action autorisée.",
  };
}
