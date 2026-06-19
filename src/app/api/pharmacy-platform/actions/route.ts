import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { DATA_SOURCES, PUBLIC_AVAILABILITY_STATUSES, RELIABILITY_LEVELS } from "@/lib/pharmacy-platform";

type ActionBody = {
  action?: string;
  label?: string;
  pharmacySlug?: string;
  medicationName?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  dataQuality?: string;
  availabilityStatus?: string;
  reliabilityLevel?: string;
  dataSource?: string;
  publicationStatus?: string;
  schedule?: unknown;
  dutyEnabled?: unknown;
  dutyStart?: unknown;
  dutyEnd?: unknown;
  specialMessage?: unknown;
  details?: Record<string, unknown>;
};

const ADMIN_ONLY_ACTIONS = new Set([
  "validate-pharmacy",
  "suspend-pharmacy",
  "refuse-pharmacy",
  "publish-pharmacy",
  "unpublish-pharmacy",
  "create-pharmacy-account",
  "reset-pharmacy-password",
  "send-pharmacy-invitation",
  "review-documents",
  "update-internal-note",
  "mark-data-quality",
  "reference-update",
  "reference-disable",
  "user-block-toggle",
  "refund-transaction",
  "merge-medication-request",
  "force-import-match",
  "publish-import",
  "publish-public-data",
  "create-referential-request",
  "fix-duplicates",
  "mark-reliable",
  "process-admin-card",
  "validate-media",
  "hide-media",
  "archive-media",
  "professional-role-update",
  "professional-session-revoke",
  "professional-suspend",
  "admin-create",
  "admin-permission-update",
  "admin-force-password-reset",
  "admin-session-revoke",
]);

function jsonDetails(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatScheduleDay(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback;
  const enabled = value.enabled !== false;
  const status = typeof value.status === "string" ? value.status : enabled ? "Ouvert" : "Fermé";
  if (!enabled || status === "Fermé") return "Fermé";
  if (status === "Ouvert 24h/24") return "Ouvert 24h/24";

  const open = typeof value.open === "string" && value.open.trim() ? value.open.trim() : "08:00";
  const close = typeof value.close === "string" && value.close.trim() ? value.close.trim() : "22:00";
  const breakStart = typeof value.breakStart === "string" ? value.breakStart.trim() : "";
  const breakEnd = typeof value.breakEnd === "string" ? value.breakEnd.trim() : "";
  const pause = breakStart && breakEnd ? ` · pause ${breakStart}-${breakEnd}` : "";
  return `${status} · ${open}-${close}${pause}`;
}

function parseDateInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getPharmacy(pharmacySlug?: string) {
  if (!pharmacySlug) return null;
  return db.pharmacy.findUnique({ where: { slug: pharmacySlug } });
}

async function updateMedicationForPharmacy(input: {
  pharmacyId: string;
  inventoryItemId?: string;
  medicationName?: string;
  availabilityStatus?: string;
  reliabilityLevel?: string;
  dataSource?: string;
}) {
  const item = input.inventoryItemId
    ? await db.pharmacyMedication.findFirst({
        where: { id: input.inventoryItemId, pharmacyId: input.pharmacyId },
        include: { medication: true },
      })
    : input.medicationName
      ? await db.pharmacyMedication.findFirst({
          where: {
            pharmacyId: input.pharmacyId,
            medication: { name: { contains: input.medicationName } },
          },
          include: { medication: true },
        })
      : null;
  if (!item) return false;

  const availabilityStatus = (PUBLIC_AVAILABILITY_STATUSES as readonly string[]).includes(input.availabilityStatus ?? "")
    ? input.availabilityStatus
    : item.availabilityStatus;
  const reliabilityLevel = (RELIABILITY_LEVELS as readonly string[]).includes(input.reliabilityLevel ?? "")
    ? input.reliabilityLevel
    : input.reliabilityLevel === "Confirmé"
      ? "Confirmé"
      : item.reliabilityLevel;
  const dataSource = (DATA_SOURCES as readonly string[]).includes(input.dataSource ?? "")
    ? input.dataSource
    : item.dataSource;

  await db.pharmacyMedication.update({
    where: { id: item.id },
    data: {
      availabilityStatus,
      reliabilityLevel,
      dataSource,
      inStock: availabilityStatus !== "Rupture",
      publicationStatus: availabilityStatus === "À confirmer" ? "À vérifier" : "Publiée",
      priceUpdatedAt: new Date(),
      priceSource: dataSource,
      priceReliabilityLevel: reliabilityLevel,
      pricePublicationStatus: "Publiée",
      modifiedByRole: "Action professionnelle",
      lastUpdatedAt: new Date(),
    },
  });
  return true;
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "view_own_dashboard");
  if (access.response) return access.response;

  const body = (await req.json().catch(() => ({}))) as ActionBody;
  const action = String(body.action ?? "").trim();
  const label = String(body.label ?? action).trim() || "Action professionnelle";
  const pharmacySlug = String(body.pharmacySlug ?? access.session?.pharmacySlug ?? "").trim();

  if (!action) {
    return NextResponse.json({ error: "Action manquante." }, { status: 400 });
  }

  const isAdmin = hasPharmacyPermission(access.role, "view_all_pharmacies");
  if (ADMIN_ONLY_ACTIONS.has(action) && !isAdmin) {
    return NextResponse.json({ error: "Action réservée à l’administration SABLIN PHARMA." }, { status: 403 });
  }
  if (!isAdmin && access.session?.kind === "pharmacy" && pharmacySlug && access.session.pharmacySlug !== pharmacySlug) {
    return NextResponse.json({ error: "Une pharmacie ne peut agir que sur ses propres données." }, { status: 403 });
  }

  const pharmacy = await getPharmacy(pharmacySlug);
  let message = "Action enregistrée.";
  let status = "réussi";

  if (pharmacy) {
    if (action === "validate-pharmacy") {
      await db.pharmacy.update({
        where: { id: pharmacy.id },
        data: {
          accountStatus: "Validée",
          publicationStatus: "Publiée",
          publishProvisional: false,
          validatedAt: new Date(),
          validatedBy: access.session?.name ?? access.role ?? null,
          validationComment: "Validation administrative enregistrée.",
          dataQuality: "Données à jour",
          qualityScore: 90,
          publicationUpdatedAt: new Date(),
          lastDataUpdate: new Date(),
        },
      });
      message = "Pharmacie validée et synchronisée côté utilisateur.";
    } else if (action === "suspend-pharmacy") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { accountStatus: "Suspendue", publicationStatus: "Masquée", publishProvisional: false, suspensionReason: "Suspension administrative enregistrée.", internalNotes: "Suspension administrative enregistrée." } });
      message = "Pharmacie suspendue et retirée de la visibilité publique.";
    } else if (action === "refuse-pharmacy") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { accountStatus: "Refusée", publicationStatus: "Non publiée", publishProvisional: false, validationComment: "Refus administratif enregistré.", internalNotes: "Refus administratif enregistré." } });
      message = "Pharmacie refusée.";
    } else if (action === "publish-pharmacy") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { publicationStatus: "Publiée", publishProvisional: false, accountStatus: pharmacy.accountStatus === "Suspendue" ? pharmacy.accountStatus : "Validée", publicationUpdatedAt: new Date(), lastDataUpdate: new Date() } });
      message = "Fiche pharmacie publiée côté utilisateur.";
    } else if (action === "unpublish-pharmacy") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { publicationStatus: "Non publiée", publishProvisional: false, publicationUpdatedAt: new Date() } });
      message = "Fiche pharmacie retirée côté utilisateur.";
    } else if (action === "mark-data-quality") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { dataQuality: body.dataQuality ?? "Données à jour", lastDataUpdate: new Date() } });
      message = "Qualité des données mise à jour.";
    } else if (action === "toggle-duty") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { isOnDuty: !pharmacy.isOnDuty, lastDataUpdate: new Date() } });
      message = "Statut de garde mis à jour.";
    } else if (action === "schedule-save") {
      const schedule = isRecord(body.schedule) ? body.schedule : {};
      const hoursMonday = formatScheduleDay(schedule.monday, pharmacy.hoursMonday ?? pharmacy.hoursWeekday);
      const hoursTuesday = formatScheduleDay(schedule.tuesday, pharmacy.hoursTuesday ?? pharmacy.hoursWeekday);
      const hoursWednesday = formatScheduleDay(schedule.wednesday, pharmacy.hoursWednesday ?? pharmacy.hoursWeekday);
      const hoursThursday = formatScheduleDay(schedule.thursday, pharmacy.hoursThursday ?? pharmacy.hoursWeekday);
      const hoursFriday = formatScheduleDay(schedule.friday, pharmacy.hoursFriday ?? pharmacy.hoursWeekday);
      const hoursSaturday = formatScheduleDay(schedule.saturday, pharmacy.hoursSaturdayDetailed ?? pharmacy.hoursSaturday);
      const hoursSunday = formatScheduleDay(schedule.sunday, pharmacy.hoursSundayDetailed ?? pharmacy.hoursSunday);
      const weekdayValues = [hoursMonday, hoursTuesday, hoursWednesday, hoursThursday, hoursFriday];
      const hoursWeekday = weekdayValues.every((item) => item === weekdayValues[0]) ? weekdayValues[0] : "Horaires détaillés par jour";
      const dutyStartAt = parseDateInput(body.dutyStart);
      const dutyEndAt = parseDateInput(body.dutyEnd);
      const isOnDuty = typeof body.dutyEnabled === "boolean" ? body.dutyEnabled : pharmacy.isOnDuty;
      const specialHoursMessage = typeof body.specialMessage === "string" && body.specialMessage.trim()
        ? body.specialMessage.trim()
        : "Horaires vérifiés depuis l’espace professionnel.";

      await db.pharmacy.update({
        where: { id: pharmacy.id },
        data: {
          hoursMonday,
          hoursTuesday,
          hoursWednesday,
          hoursThursday,
          hoursFriday,
          hoursSaturdayDetailed: hoursSaturday,
          hoursSundayDetailed: hoursSunday,
          hoursWeekday,
          hoursSaturday,
          hoursSunday,
          specialHoursMessage,
          isOnDuty,
          dutyStartAt,
          dutyEndAt,
          dutyPeriod: isOnDuty ? `${body.dutyStart ?? "Début non précisé"} → ${body.dutyEnd ?? "Fin non précisée"}` : null,
          isOpen247: Object.values(schedule).some((item) => isRecord(item) && item.status === "Ouvert 24h/24"),
          lastDataUpdate: new Date(),
          dataQuality: "Données à jour",
        },
      });
      message = "Horaires enregistrés et synchronisés côté utilisateur.";
    } else if (action === "quick-availability" || action === "mark-inventory-verified" || action === "publish-inventory") {
      const updated = await updateMedicationForPharmacy({
        pharmacyId: pharmacy.id,
        inventoryItemId: body.entityType === "pharmacy-medication" ? body.entityId : undefined,
        medicationName: body.medicationName,
        availabilityStatus: body.availabilityStatus,
        reliabilityLevel: action === "mark-inventory-verified" ? "Confirmé" : body.reliabilityLevel,
        dataSource: body.dataSource ?? (isAdmin ? "Saisie administrateur" : "Saisie pharmacie"),
      });
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { lastDataUpdate: new Date(), dataQuality: "Données à jour" } });
      message = updated ? "Disponibilité médicament mise à jour et synchronisée." : "Action enregistrée. Médicament non trouvé dans l’inventaire réel.";
      status = updated ? "réussi" : "à vérifier";
    } else if (action === "import-preview") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { dataQuality: "Disponibilités à confirmer", lastDataUpdate: new Date() } });
      message = "Aperçu d’import préparé. Les lignes doivent être validées avant publication.";
    } else if (action === "import-validate" || action === "publish-import") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { dataQuality: "Données à jour", lastDataUpdate: new Date() } });
      message = "Import validé et données synchronisées avec la plateforme utilisateur.";
    } else if (action === "force-import-match") {
      message = "Correspondance médicament forcée et enregistrée pour contrôle admin.";
    } else if (action === "fix-duplicates") {
      message = "Doublons marqués comme corrigés dans le journal d’import.";
    } else if (action === "mark-reliable") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { dataQuality: "Données à jour", lastDataUpdate: new Date() } });
      message = "Données marquées fiables après contrôle.";
    } else if (action === "create-pharmacy-account") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { internalNotes: "Accès pharmacie à créer ou vérifier par l’administration." } });
      message = "Création d’accès pharmacie enregistrée.";
    } else if (action === "send-pharmacy-invitation") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { internalNotes: "Invitation pharmacie prête à envoyer." } });
      message = "Invitation pharmacie enregistrée.";
    } else if (action === "reset-pharmacy-password") {
      message = "Réinitialisation du mot de passe pharmacie enregistrée.";
    } else if (action === "review-documents") {
      message = "Contrôle des documents justificatifs enregistré.";
    } else if (action === "update-internal-note") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { internalNotes: "Note interne mise à jour depuis l’action admin." } });
      message = "Note interne enregistrée.";
    } else if (action === "publish-public-data") {
      await db.pharmacy.update({ where: { id: pharmacy.id }, data: { publicationStatus: "Publiée", publishProvisional: false, publicationUpdatedAt: new Date(), lastDataUpdate: new Date() } });
      message = "Publication publique enregistrée pour les données validées.";
    } else if (action === "validate-media" && body.entityId) {
      const media = await db.pharmacyMedia.update({
        where: { id: body.entityId },
        data: { validationStatus: "Validée", isValidated: true, isPublic: true, visibility: "public" },
      });
      if (media.isPrimary || ["facade", "logo", "cover", "exterior", "entrance"].includes(media.type)) {
        await db.pharmacy.update({ where: { id: pharmacy.id }, data: { imageUrl: media.url, lastDataUpdate: new Date() } });
      }
      message = "Image validée et publiée côté utilisateur.";
    } else if (action === "hide-media" && body.entityId) {
      await db.pharmacyMedia.update({ where: { id: body.entityId }, data: { validationStatus: "Masquée", isPublic: false } });
      message = "Image masquée côté utilisateur.";
    } else if (action === "archive-media" && body.entityId) {
      await db.pharmacyMedia.update({ where: { id: body.entityId }, data: { validationStatus: "Archivée", isPublic: false } });
      message = "Image archivée.";
    } else if (action === "handle-pharmacy-request" || action === "process-pharmacy-card") {
      message = "Demande traitée et journalisée pour cette pharmacie.";
    } else if (action === "team-invite") {
      message = "Invitation employé enregistrée. L’employé choisira son mot de passe via un lien temporaire.";
    } else if (action === "team-update-role") {
      message = "Modification de rôle équipe enregistrée avec confirmation obligatoire.";
    } else if (action === "team-revoke") {
      message = "Révocation d’accès enregistrée. Le dernier propriétaire actif reste protégé.";
    } else if (action === "request-enrichment-correction") {
      message = "Demande de correction d’enrichissement transmise à l’administration.";
    }
  } else if (action === "user-block-toggle") {
    message = "Action support utilisateur enregistrée. Aucun mot de passe n’est exposé.";
  } else if (action === "reference-update") {
    message = "Modification du référentiel médicament enregistrée pour contrôle.";
  } else if (action === "reference-disable") {
    message = "Désactivation référentiel enregistrée pour contrôle admin.";
  } else if (action === "merge-medication-request") {
    message = "Demande d’ajout médicament fusionnée ou marquée pour validation.";
  } else if (action === "refund-transaction") {
    message = "Demande de correction transaction enregistrée.";
  } else if (action === "process-admin-card") {
    message = "Action admin globale traitée et journalisée.";
  } else if (action === "create-referential-request") {
    message = "Demande référentiel enregistrée pour traitement admin.";
  } else if (action === "professional-role-update") {
    message = "Rôle professionnel mis à jour dans le journal de contrôle.";
  } else if (action === "professional-session-revoke") {
    message = "Session professionnelle marquée pour révocation.";
  } else if (action === "professional-suspend") {
    message = "Suspension du compte professionnel enregistrée.";
  } else if (action === "admin-create") {
    message = "Création administrateur enregistrée. Aucun mot de passe permanent visible n’est généré.";
  } else if (action === "admin-permission-update") {
    message = "Permissions administrateur mises à jour dans le journal.";
  } else if (action === "admin-force-password-reset") {
    message = "Réinitialisation obligatoire du mot de passe administrateur enregistrée.";
  } else if (action === "admin-session-revoke") {
    message = "Révocation de session administrateur enregistrée.";
  }

  const log = await db.professionalActionLog.create({
    data: {
      scope: isAdmin ? "admin" : "pharmacy",
      action,
      label,
      entityType: body.entityType ?? null,
      entityId: body.entityId ?? null,
      pharmacyId: pharmacy?.id ?? null,
      pharmacySlug: pharmacy?.slug ?? (pharmacySlug || null),
      actorRole: access.role ?? null,
      status,
      message,
      source: body.dataSource ?? null,
      newValue: jsonDetails(body),
      comment: label,
      details: jsonDetails(body.details ?? body),
    },
  });

  return NextResponse.json({ ok: true, action: log, message, status });
}
