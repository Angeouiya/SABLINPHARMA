export type PlatformScope = "user" | "pharmacy" | "admin";

export type UxSyncStatus =
  | "Synchronisé"
  | "Contrôle admin"
  | "Publication contrôlée"
  | "Verrouillé"
  | "À surveiller";

export type PlatformUxSection = {
  platform: PlatformScope;
  section: string;
  purpose: string;
  uiState: string;
  dataSource: string;
  syncTarget: string;
  status: UxSyncStatus;
  owner: string;
};

export type PlatformSyncFlow = {
  id: string;
  title: string;
  source: string;
  processor: string;
  target: string;
  status: UxSyncStatus;
  checks: string[];
  visibleFor: PlatformScope[];
};

export type PlatformSyncMetric = {
  label: string;
  value: string | number;
  status: UxSyncStatus | string;
  detail: string;
};

export type PlatformSyncOverview = {
  scope: PlatformScope;
  generatedAt: string;
  metrics: PlatformSyncMetric[];
  pipelineChecks: string[];
  warnings: string[];
};

export type PlatformSectionGuide = {
  scope: PlatformScope;
  pageKey: string;
  title: string;
  intent: string;
  uiFocus: string;
  primaryActions: string[];
  syncedData: string[];
  protections: string[];
  status: UxSyncStatus;
};

export type PlatformCoverageItem = PlatformSectionGuide & {
  route: string | null;
  maturityScore: number;
};

export type PlatformCoverageSummary = {
  total: number;
  synchronized: number;
  controlled: number;
  locked: number;
  watch: number;
  missingCoverage: number;
  averageMaturity: number;
};

export type PlatformCoverageReport = {
  scope: PlatformScope | "all";
  generatedAt: string;
  summary: PlatformCoverageSummary;
  sections: PlatformCoverageItem[];
  missingPageKeys: Array<{ scope: PlatformScope; pageKey: string; route: string | null }>;
};

export type PlatformSectionWorkflow = {
  scope: PlatformScope;
  pageKey: string;
  dataInputs: string[];
  serverActions: string[];
  syncOutputs: string[];
  protectionChecks: string[];
  auditSignals: string[];
  apiRoutes: string[];
};

export type PlatformSectionReadiness = {
  scope: PlatformScope;
  pageKey: string;
  priority: "Stable" | "Contrôle" | "Sécurité" | "Surveillance";
  nextAction: string;
  syncProof: string;
  completionRule: string;
  riskIfIgnored: string;
};

export const PLATFORM_LABELS: Record<PlatformScope, string> = {
  user: "SABLIN PHARMA Utilisateur",
  pharmacy: "SABLIN PHARMA Pharmacie",
  admin: "SABLIN PHARMA Admin",
};

export const PLATFORM_SECTION_ROUTES: Record<PlatformScope, Record<string, string>> = {
  user: {
    home: "/",
    medications: "/medicaments",
    "medication-detail": "/medicaments",
    pharmacies: "/pharmacies",
    "pharmacy-detail": "/pharmacies",
    prescription: "/ordonnance",
    "prescription-result": "/ordonnance",
    wallet: "/portefeuille",
    payment: "/portefeuille",
    profile: "/profil",
    notifications: "/notifications",
    requests: "/demandes",
    history: "/historique",
    favorites: "/favoris",
    settings: "/parametres",
  },
  pharmacy: {
    dashboard: "/pharmacie/dashboard",
    medicaments: "/pharmacie/medicaments",
    "medicaments-ajouter": "/pharmacie/medicaments/ajouter",
    "import-inventaire": "/pharmacie/import-inventaire",
    "enrichissement-inventaire": "/pharmacie/enrichissement-inventaire",
    "synchronisation-inventaire": "/pharmacie/synchronisation-inventaire",
    demandes: "/pharmacie/demandes",
    confirmations: "/pharmacie/confirmations",
    conseils: "/pharmacie/conseils",
    "horaires-garde": "/pharmacie/horaires-garde",
    profil: "/pharmacie/profil",
    photos: "/pharmacie/photos",
    equipe: "/pharmacie/equipe",
    historique: "/pharmacie/historique",
    notifications: "/pharmacie/notifications",
    parametres: "/pharmacie/parametres",
    "validation-en-attente": "/pharmacie/validation-en-attente",
    "compte-suspendu": "/pharmacie/compte-suspendu",
  },
  admin: {
    dashboard: "/admin/dashboard",
    pharmacies: "/admin/pharmacies",
    "pharmacies-nouveau": "/admin/pharmacies/nouveau",
    "comptes-professionnels": "/admin/comptes-professionnels",
    utilisateurs: "/admin/utilisateurs",
    "referentiel-medicaments": "/admin/referentiel-medicaments",
    "medicaments-interdits": "/admin/medicaments-interdits",
    "enrichissement-medicaments": "/admin/enrichissement-medicaments",
    "moteur-marketplace": "/admin/moteur-marketplace",
    "sources-licences-images": "/admin/sources-licences-images",
    imports: "/admin/imports",
    synchronisations: "/admin/synchronisations",
    "qualite-donnees": "/admin/qualite-donnees",
    "demandes-utilisateurs": "/admin/demandes-utilisateurs",
    "credits-transactions": "/admin/credits-transactions",
    "payments-fraud": "/admin/paiements-fraudes",
    "validations-pharmacies": "/admin/validations-pharmacies",
    "demandes-ajout-medicaments": "/admin/demandes-ajout-medicaments",
    "utilisateur-detail": "/admin/utilisateurs/:id",
    "pharmacie-detail": "/admin/pharmacies/:id",
    "pharmacy-dashboard": "/admin/pharmacies/:id/dashboard",
    "pharmacy-medicaments": "/admin/pharmacies/:id/medicaments",
    "pharmacy-import-inventaire": "/admin/pharmacies/:id/import-inventaire",
    "pharmacy-synchronisation-inventaire": "/admin/pharmacies/:id/synchronisation-inventaire",
    "pharmacy-demandes": "/admin/pharmacies/:id/demandes",
    "pharmacy-confirmations": "/admin/pharmacies/:id/confirmations",
    "pharmacy-horaires-garde": "/admin/pharmacies/:id/horaires-garde",
    "pharmacy-historique": "/admin/pharmacies/:id/historique",
    "pharmacy-profil": "/admin/pharmacies/:id/profil",
    "pharmacy-photos": "/admin/pharmacies/:id/photos",
    "pharmacy-equipe": "/admin/pharmacies/:id/equipe",
    historique: "/admin/historique",
    notifications: "/admin/notifications",
    administrateurs: "/admin/administrateurs",
    parametres: "/admin/parametres",
  },
};

export const PLATFORM_REQUIRED_PAGE_KEYS: Record<PlatformScope, string[]> = {
  user: [
    "home",
    "medications",
    "medication-detail",
    "pharmacies",
    "pharmacy-detail",
    "prescription",
    "prescription-result",
    "wallet",
    "payment",
    "profile",
    "notifications",
    "requests",
    "history",
    "favorites",
    "settings",
  ],
  pharmacy: [
    "dashboard",
    "medicaments",
    "medicaments-ajouter",
    "import-inventaire",
    "enrichissement-inventaire",
    "synchronisation-inventaire",
    "demandes",
    "confirmations",
    "conseils",
    "horaires-garde",
    "profil",
    "photos",
    "equipe",
    "historique",
    "notifications",
    "parametres",
    "validation-en-attente",
    "compte-suspendu",
  ],
  admin: [
    "dashboard",
    "pharmacies",
    "pharmacies-nouveau",
    "pharmacie-detail",
    "pharmacy-dashboard",
    "pharmacy-medicaments",
    "pharmacy-import-inventaire",
    "pharmacy-synchronisation-inventaire",
    "pharmacy-demandes",
    "pharmacy-confirmations",
    "pharmacy-horaires-garde",
    "pharmacy-profil",
    "pharmacy-photos",
    "pharmacy-equipe",
    "pharmacy-historique",
    "validations-pharmacies",
    "comptes-professionnels",
    "utilisateurs",
    "utilisateur-detail",
    "referentiel-medicaments",
    "demandes-ajout-medicaments",
    "medicaments-interdits",
    "enrichissement-medicaments",
    "moteur-marketplace",
    "sources-licences-images",
    "imports",
    "synchronisations",
    "qualite-donnees",
    "demandes-utilisateurs",
    "credits-transactions",
    "payments-fraud",
    "historique",
    "notifications",
    "administrateurs",
    "parametres",
  ],
};

const PAGE_KEY_ALIASES: Record<PlatformScope, Record<string, string>> = {
  user: {
    "prescription-result": "prescription",
    subscription: "wallet",
    requests: "notifications",
    favorites: "profile",
    history: "profile",
    settings: "profile",
  },
  pharmacy: {
    photos: "profil",
    "medicaments-ajouter": "medicaments",
    "validation-en-attente": "profil",
    "compte-suspendu": "parametres",
  },
  admin: {
    "utilisateur-detail": "utilisateurs",
  },
};

export const SECTION_API_ROUTES: Record<PlatformScope, Record<string, string[]>> = {
  user: {
    medications: ["/api/medications", "/api/medications/[slug]", "/api/credits/unlock"],
    "medication-detail": ["/api/medications/[slug]", "/api/credits/unlock"],
    pharmacies: ["/api/pharmacies", "/api/pharmacies/[slug]/ratings"],
    "pharmacy-detail": ["/api/pharmacies/[slug]", "/api/pharmacies/[slug]/contact", "/api/credits/unlock"],
    prescription: ["/api/prescription/estimate", "/api/credits/pass", "/api/credits/debit"],
    wallet: ["/api/credits", "/api/payments/create-intent", "/api/payments/status/[reference]"],
    payment: ["/api/payments/create-intent", "/api/payments/verify", "/api/payments/status/[reference]"],
    profile: ["/api/me", "/api/history", "/api/favorites", "/api/settings"],
    notifications: ["/api/notifications", "/api/user-requests"],
    settings: ["/api/settings", "/api/account/export", "/api/account/deletion-request", "/api/auth/password-reset"],
  },
  pharmacy: {
    dashboard: ["/api/pharmacy-platform/dashboard-summary", "/api/platform-sync/overview"],
    medicaments: ["/api/pharmacy-platform/inventory", "/api/pharmacy-platform/actions", "/api/pharmacy-platform/medication-requests"],
    "import-inventaire": ["/api/imports/preview", "/api/imports/confirm", "/api/pharmacy-platform/imports"],
    "enrichissement-inventaire": ["/api/medication-enrichment", "/api/medication-enrichment/photo"],
    "synchronisation-inventaire": ["/api/inventory-sync", "/api/platform-sync/coverage"],
    demandes: ["/api/pharmacy-platform/user-requests"],
    confirmations: ["/api/pharmacy-platform/user-requests", "/api/pharmacy-platform/actions"],
    conseils: ["/api/pharmacy-platform/user-requests"],
    "horaires-garde": ["/api/pharmacy-platform/schedule", "/api/pharmacy-platform/actions"],
    profil: ["/api/pharmacy-platform/profile", "/api/pharmacy-platform/media", "/api/pharmacy-platform/media/upload"],
    equipe: ["/api/professional/team"],
    historique: ["/api/pharmacy-platform/history"],
    notifications: ["/api/pharmacy-platform/notifications"],
    parametres: ["/api/professional/me", "/api/professional/password-reset", "/api/pharmacy-platform/settings"],
  },
  admin: {
    dashboard: ["/api/admin/dashboard-summary", "/api/platform-sync/overview"],
    pharmacies: ["/api/pharmacy-platform/pharmacies", "/api/pharmacy-platform/profile", "/api/pharmacy-platform/media"],
    "pharmacies-nouveau": ["/api/pharmacy-platform/pharmacies"],
    "comptes-professionnels": ["/api/professional/team", "/api/professional/me"],
    utilisateurs: ["/api/admin/users", "/api/admin/dashboard-summary", "/api/admin/user-requests"],
    "referentiel-medicaments": ["/api/medications", "/api/pharmacy-platform/medication-requests"],
    "medicaments-interdits": ["/api/admin/prohibited-medications"],
    "enrichissement-medicaments": ["/api/medication-enrichment", "/api/enrichment/start", "/api/enrichment/jobs"],
    "moteur-marketplace": ["/api/imports/preview", "/api/imports/confirm", "/api/enrichment/publish"],
    "sources-licences-images": ["/api/enrichment/validate-image", "/api/enrichment/reject-image", "/api/enrichment/publish"],
    imports: ["/api/imports/upload", "/api/imports/parse", "/api/imports/preview", "/api/imports/confirm"],
    synchronisations: ["/api/platform-sync/overview", "/api/platform-sync/coverage", "/api/inventory-sync"],
    "qualite-donnees": ["/api/admin/data-quality", "/api/platform-sync/overview", "/api/pharmacy-platform/actions", "/api/pharmacy-platform/history"],
    "demandes-utilisateurs": ["/api/admin/user-requests", "/api/pharmacy-platform/user-requests"],
    "credits-transactions": ["/api/admin/transactions", "/api/payments/reconcile", "/api/credits/debit"],
    "payments-fraud": ["/api/admin/payments-fraud", "/api/payments/reconcile", "/api/payments/manual-review", "/api/payments/refund"],
    administrateurs: ["/api/admin/administrators", "/api/professional/password-reset", "/api/admin-auth/login", "/api/admin-auth/logout"],
    "validations-pharmacies": ["/api/pharmacy-platform/pharmacies", "/api/pharmacy-platform/actions", "/api/pharmacy-platform/history"],
    "demandes-ajout-medicaments": ["/api/pharmacy-platform/medication-requests", "/api/medications", "/api/medication-enrichment"],
    "utilisateur-detail": ["/api/admin/users", "/api/payments/status/[reference]", "/api/payments/reconcile"],
    "pharmacie-detail": ["/api/pharmacy-platform/profile", "/api/pharmacy-platform/media", "/api/pharmacy-platform/history"],
    "pharmacy-dashboard": ["/api/pharmacy-platform/dashboard-summary", "/api/platform-sync/overview"],
    "pharmacy-medicaments": ["/api/pharmacy-platform/inventory", "/api/pharmacy-platform/actions"],
    "pharmacy-import-inventaire": ["/api/imports/preview", "/api/imports/confirm", "/api/pharmacy-platform/imports"],
    "pharmacy-synchronisation-inventaire": ["/api/inventory-sync", "/api/platform-sync/coverage"],
    "pharmacy-demandes": ["/api/admin/user-requests", "/api/pharmacy-platform/user-requests"],
    "pharmacy-confirmations": ["/api/pharmacy-platform/user-requests", "/api/pharmacy-platform/actions"],
    "pharmacy-horaires-garde": ["/api/pharmacy-platform/schedule", "/api/pharmacy-platform/actions"],
    "pharmacy-historique": ["/api/pharmacy-platform/history"],
    "pharmacy-profil": ["/api/pharmacy-platform/profile", "/api/pharmacy-platform/actions"],
    "pharmacy-photos": ["/api/pharmacy-platform/media", "/api/pharmacy-platform/media/upload"],
    "pharmacy-equipe": ["/api/professional/team", "/api/professional/me"],
    historique: ["/api/pharmacy-platform/history", "/api/history"],
    notifications: ["/api/admin/notifications", "/api/pharmacy-platform/notifications", "/api/notifications"],
    parametres: ["/api/admin/settings", "/api/enrichment/config"],
  },
};

const DEFAULT_SECTION_GUIDES: Record<PlatformScope, PlatformSectionGuide> = {
  user: {
    scope: "user",
    pageKey: "default",
    title: "Parcours utilisateur",
    intent: "Présenter les informations utiles sans exposer les services avancés gratuitement.",
    uiFocus: "Une lecture courte, mobile-first, avec coûts visibles avant action.",
    primaryActions: ["Rechercher", "Consulter les informations générales", "Débloquer avec crédits si nécessaire"],
    syncedData: ["Données publiques validées", "Crédits SABLIN", "Pass Ordonnance Unique"],
    protections: ["Stocks, prix détaillés et contacts verrouillés", "Aucune redirection vers Admin ou Pharmacie"],
    status: "Synchronisé",
  },
  pharmacy: {
    scope: "pharmacy",
    pageKey: "default",
    title: "Section pharmacie",
    intent: "Permettre à une pharmacie de gérer uniquement ses données et leur qualité.",
    uiFocus: "Actions claires, formulaires lisibles, états de publication et historique visible.",
    primaryActions: ["Mettre à jour", "Corriger", "Publier les données autorisées"],
    syncedData: ["Profil pharmacie", "Inventaire", "Demandes utilisateurs"],
    protections: ["Données limitées à la pharmacie connectée", "Documents internes non publics"],
    status: "Synchronisé",
  },
  admin: {
    scope: "admin",
    pageKey: "default",
    title: "Section administration",
    intent: "Contrôler la plateforme entière sans se mélanger aux sessions pharmacie ou utilisateur.",
    uiFocus: "Pilotage global, filtres, contrôles, audit et actions sensibles explicites.",
    primaryActions: ["Contrôler", "Valider", "Superviser", "Auditer"],
    syncedData: ["Base commune", "Publications", "Transactions", "Historique"],
    protections: ["Accès réservé Admin", "Aucune donnée sensible exposée publiquement"],
    status: "Synchronisé",
  },
};

export const PLATFORM_SECTION_GUIDES: PlatformSectionGuide[] = [
  {
    scope: "user",
    pageKey: "home",
    title: "Accueil utilisateur",
    intent: "Faire comprendre rapidement ce qui est gratuit, ce qui utilise les crédits et ce qui est protégé.",
    uiFocus: "Recherche, catégories, pharmacies de garde, crédits et messages rassurants.",
    primaryActions: ["Rechercher un médicament", "Voir les pharmacies de garde", "Ouvrir le portefeuille"],
    syncedData: ["Statistiques publiques", "Pharmacies validées", "Inventaires publiés"],
    protections: ["Aucun contact public gratuit", "Aucun stock réel sans crédit"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "medications",
    title: "Médicaments",
    intent: "Afficher une marketplace d'information claire, sans vente directe.",
    uiFocus: "Cartes produits, filtres, images validées ou placeholders et actions à crédits.",
    primaryActions: ["Chercher", "Filtrer", "Voir détails", "Débloquer pharmacies"],
    syncedData: ["Référentiel médicaments", "Lignes sûres importées", "Images validées"],
    protections: ["Prix détaillés verrouillés", "Disponibilité réelle verrouillée"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "medication-detail",
    title: "Détail médicament",
    intent: "Présenter les informations générales du médicament puis guider vers les services avancés.",
    uiFocus: "Description, DCI, dosage, forme, image et blocs verrouillés lisibles.",
    primaryActions: ["Lire l'information générale", "Voir pharmacies disponibles", "Ajouter ordonnance"],
    syncedData: ["Référentiel", "Images produits", "Disponibilités publiées"],
    protections: ["Pharmacies détentrices verrouillées", "Prix par pharmacie verrouillés"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "pharmacies",
    title: "Pharmacies",
    intent: "Orienter vers les pharmacies validées par commune, garde et horaires.",
    uiFocus: "Liste responsive, photos publiques, filtres et contacts verrouillés.",
    primaryActions: ["Chercher une pharmacie", "Filtrer par garde", "Voir détail"],
    syncedData: ["Profils validés", "Horaires", "Photos publiques"],
    protections: ["Téléphone, WhatsApp et appel verrouillés", "Liste médicaments verrouillée"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "pharmacy-detail",
    title: "Détail pharmacie",
    intent: "Afficher la fiche publique sans révéler les données payantes.",
    uiFocus: "Profil, horaires, garde, services généraux et blocs verrouillés.",
    primaryActions: ["Consulter la fiche", "Débloquer contact", "Débloquer liste médicaments"],
    syncedData: ["Profil pharmacie", "Photos publiques", "Demandes utilisateur"],
    protections: ["Contact réel absent du HTML avant crédit", "Stock exact jamais public"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "prescription",
    title: "Ordonnance",
    intent: "Comparer les prix des pharmacies uniquement avec crédits ou Pass Ordonnance Unique valide.",
    uiFocus: "Écran verrouillé, choix crédits/pass, coûts visibles et confirmations.",
    primaryActions: ["Utiliser mes crédits", "Acheter le Pass Ordonnance Unique", "Comparer les prix"],
    syncedData: ["Crédits", "Pass Ordonnance Unique", "Résultats d'ordonnance"],
    protections: ["Aucun résultat sans droit", "Pass lié à une seule ordonnance"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "wallet",
    title: "Portefeuille",
    intent: "Rendre le modèle crédits lisible et traçable.",
    uiFocus: "Solde, packs, Pass Ordonnance Unique, transactions et règle 1 crédit = 100 FCFA.",
    primaryActions: ["Recharger", "Acheter un pass", "Consulter l'historique"],
    syncedData: ["Paiements confirmés", "Transactions", "Pass"],
    protections: ["Aucun crédit sans SUCCESS serveur", "Solde serveur prioritaire"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "payment",
    title: "Paiement",
    intent: "Initier un paiement sans valider de faux paiement côté navigateur.",
    uiFocus: "Montant, état de vérification, PayDunya et messages simples.",
    primaryActions: ["Lancer paiement", "Suivre le statut", "Retour portefeuille"],
    syncedData: ["Intentions paiement", "Webhooks", "Notifications"],
    protections: ["Validation backend obligatoire", "Aucune capture d'écran validante"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "profile",
    title: "Profil utilisateur",
    intent: "Centraliser identité, portefeuille, pass, historique, favoris et support.",
    uiFocus: "Sections courtes, solde visible seulement connecté, actions simples.",
    primaryActions: ["Consulter mes informations", "Voir restrictions", "Gérer support"],
    syncedData: ["Compte utilisateur", "Crédits", "Historique"],
    protections: ["Données personnelles limitées à la session", "Déconnexion confirmée"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "notifications",
    title: "Notifications & demandes",
    intent: "Informer l'utilisateur sur crédits, paiements, pass, services verrouillés et demandes envoyées.",
    uiFocus: "Messages courts, statuts lisibles, actions utiles et aucune donnée pharmacie sensible gratuite.",
    primaryActions: ["Lire notification", "Suivre demande", "Retour portefeuille"],
    syncedData: ["Notifications utilisateur", "Demandes payées", "Transactions", "Pass"],
    protections: ["Aucun contact réel sans crédit", "Données personnelles limitées à la session"],
    status: "Synchronisé",
  },
  {
    scope: "user",
    pageKey: "settings",
    title: "Paramètres utilisateur",
    intent: "Permettre à l'utilisateur de gérer ses préférences, ses données et les actions sensibles de compte.",
    uiFocus: "Préférences persistées, export JSON, demande de suppression auditée et mot de passe par e-mail.",
    primaryActions: ["Mettre à jour préférences", "Télécharger mes données", "Demander suppression", "Réinitialiser mot de passe"],
    syncedData: ["Préférences utilisateur", "Notifications support", "Audit admin", "Données personnelles exportables"],
    protections: ["Aucun mot de passe exporté", "Suppression traitée après vérification transactions/crédits"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "dashboard",
    title: "Tableau de bord pharmacie",
    intent: "Donner à la pharmacie les priorités du jour et l'état de publication.",
    uiFocus: "KPIs, demandes, garde, qualité, actions rapides et état utilisateur.",
    primaryActions: ["Mettre à jour disponibilités", "Traiter confirmations", "Vérifier garde"],
    syncedData: ["Inventaire", "Demandes", "Horaires", "Qualité"],
    protections: ["Données limitées à ma pharmacie", "Stock exact interne seulement"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "medicaments",
    title: "Mes médicaments",
    intent: "Gérer les médicaments de la pharmacie avec publication contrôlée.",
    uiFocus: "Recherche, filtres, statuts rapides, prix indicatifs et fiabilité.",
    primaryActions: ["Ajouter", "Modifier", "Marquer disponible", "Mettre en rupture"],
    syncedData: ["Inventaire pharmacie", "Référentiel", "Marketplace utilisateur"],
    protections: ["Médicaments interdits retirés", "Quantité exacte non publique"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "import-inventaire",
    title: "Import inventaire",
    intent: "Transformer un fichier en lignes sûres publiables et lignes ambiguës à corriger.",
    uiFocus: "Étapes simples, aperçu, erreurs, validation groupée et retrait individuel.",
    primaryActions: ["Importer", "Prévisualiser", "Publier les lignes sûres", "Retirer une ligne"],
    syncedData: ["Fichiers inventaire", "Référentiel", "Moteur marketplace"],
    protections: ["Interdits bloqués", "Ambiguës non publiées automatiquement"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "enrichissement-inventaire",
    title: "Enrichissement inventaire",
    intent: "Compléter les médicaments avec images, descriptions et catégories validables.",
    uiFocus: "Candidats images, scores, placeholders et statut de validation.",
    primaryActions: ["Relancer recherche", "Utiliser placeholder", "Demander validation"],
    syncedData: ["Images internes", "Photos pharmacie", "Candidats serveur"],
    protections: ["Image web non publiée sans validation", "Clés API côté serveur"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "synchronisation-inventaire",
    title: "Synchronisation inventaire",
    intent: "Suivre la santé des connexions et imports qui alimentent l'utilisateur.",
    uiFocus: "Connexions, jobs, conflits, mappings et règles de publication.",
    primaryActions: ["Tester connexion", "Synchroniser", "Corriger conflits"],
    syncedData: ["Connexions inventaire", "Jobs", "Conflits"],
    protections: ["Secrets masqués", "Accès limité à ma pharmacie"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "demandes",
    title: "Demandes utilisateurs",
    intent: "Traiter les demandes payées reçues par cette pharmacie.",
    uiFocus: "File de demandes, priorités, statuts, réponses et historique.",
    primaryActions: ["Répondre", "Traiter", "Marquer terminé"],
    syncedData: ["Contacts débloqués", "Conseils", "Confirmations"],
    protections: ["Utilisateur anonymisé", "Réponse historisée"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "confirmations",
    title: "Confirmations",
    intent: "Confirmer disponibilité ou prix pour améliorer la fiabilité côté utilisateur.",
    uiFocus: "Boutons de confirmation, prix indicatif, remarques et validité.",
    primaryActions: ["Confirmer disponible", "Confirmer rupture", "Modifier prix"],
    syncedData: ["Demandes payées", "Inventaire", "Fiabilité"],
    protections: ["Données à confirmer si anciennes", "Stock exact protégé"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "conseils",
    title: "Conseils pharmacie",
    intent: "Répondre aux demandes de conseil sans remplacer une consultation médicale.",
    uiFocus: "Recherche, filtres statut/priorité, prise en charge, modèles prudents et dernière réponse.",
    primaryActions: ["Filtrer", "Marquer reçue", "Prendre en charge", "Envoyer conseil"],
    syncedData: ["Demandes conseil", "Réponses pharmacie", "Notifications utilisateur", "Historique"],
    protections: ["Pas de diagnostic", "Pas de prescription personnalisée", "Session pharmacie vérifiée"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "horaires-garde",
    title: "Horaires & garde",
    intent: "Maintenir les heures, exceptions et gardes qui alimentent l'utilisateur.",
    uiFocus: "Jours, heures, périodes de garde et messages spéciaux.",
    primaryActions: ["Modifier horaires", "Activer garde", "Ajouter fermeture exceptionnelle"],
    syncedData: ["Pharmacies ouvertes", "Pharmacies de garde", "Détail pharmacie"],
    protections: ["Publication bloquée si compte non validé", "Historique des changements"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "profil",
    title: "Profil pharmacie",
    intent: "Gérer les données publiques et internes de la pharmacie.",
    uiFocus: "Identité, localisation, photos, services, contacts et validation.",
    primaryActions: ["Mettre à jour profil", "Charger photos", "Soumettre validation"],
    syncedData: ["Fiche utilisateur", "Photos publiques", "Admin"],
    protections: ["Documents admin invisibles", "Contacts publics verrouillés par crédits"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "equipe",
    title: "Équipe",
    intent: "Gérer les accès internes de la pharmacie avec permissions claires.",
    uiFocus: "Rôles, permissions, statut actif et dernière connexion.",
    primaryActions: ["Inviter", "Modifier permissions", "Renvoyer invitation", "Désactiver accès"],
    syncedData: ["Comptes professionnels", "Audit", "Permissions"],
    protections: ["Employé limité à la pharmacie", "Aucun accès Admin"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "historique",
    title: "Historique pharmacie",
    intent: "Tracer les modifications qui impactent la qualité des données.",
    uiFocus: "Date, auteur, action, ancienne valeur, nouvelle valeur et source.",
    primaryActions: ["Filtrer", "Consulter détail", "Exporter si autorisé"],
    syncedData: ["Imports", "Profil", "Horaires", "Confirmations"],
    protections: ["Notes internes non publiques", "Audit conservé"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "notifications",
    title: "Notifications pharmacie",
    intent: "Alerter la pharmacie sur demandes, imports, données anciennes et validation.",
    uiFocus: "Notifications lisibles, filtres, statuts lus/non lus et actions utiles.",
    primaryActions: ["Lire", "Traiter", "Marquer lu"],
    syncedData: ["Demandes", "Imports", "Qualité", "Compte"],
    protections: ["Pas d'informations patient sensibles", "Traçabilité des actions"],
    status: "Synchronisé",
  },
  {
    scope: "pharmacy",
    pageKey: "parametres",
    title: "Paramètres pharmacie",
    intent: "Gérer sécurité, notifications, support et identifiants professionnels.",
    uiFocus: "Identifiants, préférences opérationnelles, support, sécurité, audit récent et reset par e-mail.",
    primaryActions: ["Modifier identifiants", "Enregistrer préférences", "Envoyer lien reset", "Contacter support"],
    syncedData: ["Compte professionnel", "ProfessionalSetting", "SecurityNotification admin", "Audit pharmacie"],
    protections: ["Mot de passe jamais visible", "Réinitialisation par email", "Support auditée"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "dashboard",
    title: "Tableau de bord Admin",
    intent: "Piloter les trois plateformes depuis une vue maître.",
    uiFocus: "KPIs, priorités, synchronisations, fraudes, qualité et actions rapides.",
    primaryActions: ["Actualiser", "Créer pharmacie", "Contrôler alertes"],
    syncedData: ["Utilisateurs", "Pharmacies", "Transactions", "Inventaires"],
    protections: ["Accès Admin obligatoire", "Aucune session pharmacie créée"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacies",
    title: "Pharmacies",
    intent: "Gérer toutes les pharmacies et leur état de publication.",
    uiFocus: "Recherche serveur, filtres commune/statut/publication, photos publiques, qualité, validation, suspension et mode gestion pharmacie.",
    primaryActions: ["Filtrer", "Créer", "Valider", "Suspendre", "Gérer comme pharmacie"],
    syncedData: ["Pharmacy", "PharmacyMedia", "InventoryItem", "ProfessionalActionLog", "Fiches utilisateur"],
    protections: ["Contacts internes réservés Admin", "Publication validée uniquement", "Pharmacie non validée non publique"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacies-nouveau",
    title: "Créer une pharmacie",
    intent: "Créer une fiche pharmacie complète ou un accès professionnel.",
    uiFocus: "Formulaire par étapes, identité, localisation, image publique initiale, horaires, garde, services, source de création et notes internes.",
    primaryActions: ["Créer fiche", "Créer accès", "Envoyer invitation", "Créer puis gérer les données"],
    syncedData: ["Pharmacy", "PharmacyMedia", "Espace Pharmacie", "Fiche utilisateur après validation", "Historique"],
    protections: ["Documents internes non publics", "Validation avant publication", "Contacts publics verrouillés côté utilisateur"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacie-detail",
    title: "Détail pharmacie Admin",
    intent: "Contrôler une pharmacie précise avant publication ou correction.",
    uiFocus: "Identité, validation, photos, qualité, notes internes et accès au mode gestion.",
    primaryActions: ["Valider", "Suspendre", "Gérer comme pharmacie", "Ajouter note"],
    syncedData: ["Profil pharmacie", "Photos publiques", "Historique", "Fiche utilisateur"],
    protections: ["Documents internes réservés Admin", "Aucune session pharmacie créée"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-dashboard",
    title: "Mode gestion : dashboard pharmacie",
    intent: "Piloter le tableau de bord d'une pharmacie sélectionnée depuis l'Admin.",
    uiFocus: "KPIs pharmacie, demandes, données anciennes, garde et qualité.",
    primaryActions: ["Auditer priorités", "Ouvrir données", "Relancer correction"],
    syncedData: ["Résumé pharmacie", "Demandes", "Inventaire", "Qualité"],
    protections: ["Admin multi-pharmacies uniquement", "Session pharmacie non créée"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-medicaments",
    title: "Mode gestion : médicaments",
    intent: "Corriger ou publier les médicaments d'une pharmacie précise.",
    uiFocus: "Statuts, prix indicatifs, fiabilité, source et actions administratives.",
    primaryActions: ["Corriger", "Marquer vérifié", "Publier ou retirer"],
    syncedData: ["Inventaire pharmacie", "Référentiel", "Marketplace utilisateur"],
    protections: ["Médicaments interdits bloqués", "Quantité exacte non publique"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-import-inventaire",
    title: "Mode gestion : import inventaire",
    intent: "Importer ou corriger un fichier pour une pharmacie sélectionnée.",
    uiFocus: "Aperçu, lignes sûres, lignes ambiguës, validation groupée et retrait individuel.",
    primaryActions: ["Importer fichier", "Publier lignes sûres", "Retirer ligne", "Corriger erreurs"],
    syncedData: ["Import Admin", "Référentiel", "Moteur marketplace"],
    protections: ["Ambiguës en validation", "Formats dangereux refusés"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-synchronisation-inventaire",
    title: "Mode gestion : synchronisation",
    intent: "Contrôler les flux d'une pharmacie sélectionnée vers l'utilisateur.",
    uiFocus: "Jobs, connexions, couverture UX, conflits et règles de publication.",
    primaryActions: ["Tester connexion", "Relancer synchronisation", "Résoudre conflit"],
    syncedData: ["Inventaire", "Photos", "Horaires", "Marketplace"],
    protections: ["Secrets masqués", "Publication selon validation"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-demandes",
    title: "Mode gestion : demandes pharmacie",
    intent: "Superviser les demandes reçues par une pharmacie précise.",
    uiFocus: "Priorité, statut, type de service, réponse et historique.",
    primaryActions: ["Superviser", "Assister", "Clôturer"],
    syncedData: ["Demandes utilisateurs", "Notifications", "Historique pharmacie"],
    protections: ["Utilisateur anonymisé", "Source obligatoire si Admin assiste"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-confirmations",
    title: "Mode gestion : confirmations",
    intent: "Superviser les confirmations de disponibilité, prix et disponibilité complète.",
    uiFocus: "Médicament, prix, statut, remarque, fiabilité et date de réponse.",
    primaryActions: ["Confirmer", "Modifier prix", "Ajouter remarque", "Marquer vérifié"],
    syncedData: ["Demandes payées", "Inventaire", "Qualité données"],
    protections: ["Stock exact protégé", "Réponse tracée"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-horaires-garde",
    title: "Mode gestion : horaires & garde",
    intent: "Corriger les horaires, exceptions et gardes d'une pharmacie.",
    uiFocus: "Jours, heures, pauses, exceptions, période de garde et publication.",
    primaryActions: ["Modifier horaire", "Activer garde", "Ajouter exception"],
    syncedData: ["Pharmacies ouvertes", "Pharmacies de garde", "Détail pharmacie"],
    protections: ["Historique des changements", "Publication liée au statut validé"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-profil",
    title: "Mode gestion : profil pharmacie",
    intent: "Modifier les données publiques et internes d'une pharmacie sélectionnée.",
    uiFocus: "Identité, localisation, services, validation, notes et contacts internes.",
    primaryActions: ["Modifier profil", "Valider publication", "Ajouter note interne"],
    syncedData: ["Fiche utilisateur", "Espace Pharmacie", "Historique"],
    protections: ["Contacts toujours verrouillés côté utilisateur", "Documents internes invisibles"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-photos",
    title: "Mode gestion : photos pharmacie",
    intent: "Charger, valider ou retirer les images publiques et documents internes d'une pharmacie.",
    uiFocus: "Logo, façade, extérieur, couverture, documents admin et statut de publication.",
    primaryActions: ["Charger image", "Publier photo", "Archiver", "Supprimer"],
    syncedData: ["Photos publiques", "Documents internes", "Fiche utilisateur"],
    protections: ["Documents d'agrément admin uniquement", "Photos sensibles non publiées"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-equipe",
    title: "Mode gestion : équipe pharmacie",
    intent: "Contrôler les accès professionnels rattachés à une pharmacie.",
    uiFocus: "Rôles, permissions, statut, dernière connexion et révocation.",
    primaryActions: ["Créer accès", "Modifier permissions", "Suspendre", "Révoquer"],
    syncedData: ["Comptes professionnels", "Équipe pharmacie", "Audit"],
    protections: ["Accès limité à la pharmacie", "Aucune visibilité Admin pour employé"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "pharmacy-historique",
    title: "Mode gestion : historique pharmacie",
    intent: "Lire les actions d'une pharmacie sélectionnée et leurs impacts.",
    uiFocus: "Date, auteur, source, ancienne valeur, nouvelle valeur et statut.",
    primaryActions: ["Filtrer", "Consulter", "Exporter si autorisé"],
    syncedData: ["Profil", "Inventaire", "Imports", "Confirmations"],
    protections: ["Aucun secret dans les logs", "Traçabilité complète"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "comptes-professionnels",
    title: "Comptes pro",
    intent: "Gérer les comptes pharmacie et leurs permissions.",
    uiFocus: "Rôles, statuts, pharmacie rattachée, invitation et révocation.",
    primaryActions: ["Filtrer", "Renvoyer invitation", "Suspendre", "Révoquer"],
    syncedData: ["Sessions pharmacie", "Équipe", "Audit"],
    protections: ["Rôles séparés", "Aucun mot de passe en clair"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "utilisateurs",
    title: "Utilisateurs",
    intent: "Consulter les comptes publics et leurs activités utiles au support.",
    uiFocus: "Recherche serveur, solde crédits, transactions, demandes, Pass et activité réelle.",
    primaryActions: ["Rechercher", "Filtrer", "Actualiser", "Voir détail"],
    syncedData: ["Comptes utilisateur", "Crédits", "Demandes", "Pass", "Contacts débloqués"],
    protections: ["Pas de mot de passe", "Actions support auditables", "Solde serveur uniquement"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "utilisateur-detail",
    title: "Détail utilisateur",
    intent: "Assister un utilisateur sans exposer ses secrets ni modifier son solde côté client.",
    uiFocus: "Identité, crédits, transactions, demandes, contacts, pass, paiements et historique.",
    primaryActions: ["Consulter", "Analyser flux", "Bloquer ou débloquer via action auditée"],
    syncedData: ["Compte utilisateur", "Portefeuille", "Transactions", "Demandes", "Paiements", "Favoris"],
    protections: ["Aucun mot de passe visible", "Corrections financières tracées", "Paiement SUCCESS obligatoire"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "referentiel-medicaments",
    title: "Référentiel médicaments",
    intent: "Maintenir la source centrale des médicaments.",
    uiFocus: "Nom, DCI, dosage, forme, statut, alias et historique.",
    primaryActions: ["Ajouter", "Modifier", "Désactiver", "Fusionner"],
    syncedData: ["Imports", "Marketplace", "Demandes ajout"],
    protections: ["Pharmacies ne modifient pas directement", "Doublons contrôlés"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "demandes-ajout-medicaments",
    title: "Demandes d'ajout médicaments",
    intent: "Valider, refuser ou fusionner les médicaments proposés par les pharmacies.",
    uiFocus: "Nom proposé, DCI, dosage, forme, pharmacie demandeuse, remarque et statut.",
    primaryActions: ["Valider", "Refuser", "Fusionner avec référentiel"],
    syncedData: ["Référentiel médicaments", "Inventaires pharmacie", "Moteur marketplace"],
    protections: ["Pas de doublon automatique", "Publication bloquée tant que non reconnu"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "medicaments-interdits",
    title: "Médicaments interdits",
    intent: "Bloquer automatiquement les médicaments non autorisés avant publication.",
    uiFocus: "Recherche, statut actif/désactivé, motifs, lignes import retirées et audit récent.",
    primaryActions: ["Filtrer", "Ajouter terme", "Désactiver", "Réactiver", "Auditer retrait"],
    syncedData: ["Imports pharmacie", "InventoryImportRow", "Moteur marketplace", "ProfessionalActionLog"],
    protections: ["Retrait automatique", "Publication bloquée", "Réactivation réservée Admin"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "enrichissement-medicaments",
    title: "Enrichissement",
    intent: "Superviser images, descriptions, catégories et sources.",
    uiFocus: "Candidats, scores, licences, validation et placeholders.",
    primaryActions: ["Valider image", "Refuser", "Relancer recherche"],
    syncedData: ["Moteur images", "Référentiel", "Marketplace"],
    protections: ["Clés serveur uniquement", "Image web validée avant publication"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "moteur-marketplace",
    title: "Moteur Marketplace",
    intent: "Publier les lignes sûres et isoler les lignes ambiguës.",
    uiFocus: "Imports récents, validation groupée, retrait individuel et publication.",
    primaryActions: ["Publier lot sûr", "Retirer ligne", "Corriger conflit"],
    syncedData: ["Imports", "Produits utilisateur", "Images"],
    protections: ["Aucun panier", "Aucune vente médicament", "Ambiguës bloquées"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "sources-licences-images",
    title: "Sources images",
    intent: "Contrôler les licences et la provenance des images.",
    uiFocus: "Source, URL, licence, attribution, validation et refus.",
    primaryActions: ["Valider licence", "Refuser image", "Utiliser placeholder"],
    syncedData: ["Images médicament", "Photos pharmacie", "Utilisateur"],
    protections: ["Licence inconnue non publiée", "Secrets non affichés"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "imports",
    title: "Imports",
    intent: "Superviser tous les fichiers importés par pharmacies ou Admin.",
    uiFocus: "Rapports, erreurs, lignes reconnues, doublons, corrections.",
    primaryActions: ["Corriger", "Valider", "Annuler", "Publier sûrs"],
    syncedData: ["Inventaires", "Référentiel", "Marketplace"],
    protections: ["Formats dangereux refusés", "Lignes ambiguës non publiées"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "synchronisations",
    title: "Synchronisations",
    intent: "Observer tous les flux entre Admin, Pharmacie et Utilisateur.",
    uiFocus: "Connexions, jobs, webhooks, conflits et état centralisé.",
    primaryActions: ["Tester", "Relancer", "Résoudre conflit"],
    syncedData: ["Inventaires", "Profils", "Paiements", "Demandes"],
    protections: ["Secrets masqués", "Rôles vérifiés côté serveur"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "qualite-donnees",
    title: "Qualité données",
    intent: "Identifier les données anciennes, incomplètes ou à vérifier.",
    uiFocus: "Filtres serveur par pharmacie, commune, statut, qualité, score calculé et actions correctives journalisées.",
    primaryActions: ["Filtrer", "Marquer vérifié", "Ouvrir dossier", "Demander correction"],
    syncedData: ["Pharmacy", "PharmacyMedication", "PharmacyMedia", "PharmacyRequest", "ProfessionalActionLog"],
    protections: ["Donnée incertaine affichée à confirmer côté utilisateur", "Actions qualité réservées Admin"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "demandes-utilisateurs",
    title: "Demandes utilisateurs",
    intent: "Superviser toutes les demandes reçues par les pharmacies.",
    uiFocus: "Type, priorité, pharmacie, statut, réponse et historique.",
    primaryActions: ["Superviser", "Assister", "Clôturer"],
    syncedData: ["Crédits", "Demandes pharmacie", "Notifications"],
    protections: ["Admin n'agit à la place qu'avec source indiquée"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "validations-pharmacies",
    title: "Validations pharmacies",
    intent: "Contrôler les inscriptions pharmacie avant toute publication publique.",
    uiFocus: "Recherche, statuts, résumé validation, photos/documents, décision et audit récent.",
    primaryActions: ["Filtrer", "Valider", "Refuser", "Demander correction", "Suspendre"],
    syncedData: ["Pharmacy", "PharmacyMedia", "ProfessionalActionLog", "Fiches publiques"],
    protections: ["Non validée non publique par défaut", "Documents justificatifs internes", "Actions réservées Admin"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "credits-transactions",
    title: "Crédits & transactions",
    intent: "Contrôler les comptes et décomptes serveur.",
    uiFocus: "Recherche, filtres, crédits vendus/utilisés, net serveur, paiements, pass actifs, solde avant/après, référence et statut.",
    primaryActions: ["Filtrer", "Actualiser", "Analyser", "Croiser avec Paiements & fraudes"],
    syncedData: ["CreditTransaction", "Payment", "PassOrdonnance", "Portefeuille", "Risque paiement"],
    protections: ["Solde jamais client", "Aucun négatif", "Idempotence", "Aucun crédit sans SUCCESS serveur"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "payments-fraud",
    title: "Paiements & fraudes",
    intent: "Bloquer les faux paiements et vérifier les statuts prestataires.",
    uiFocus: "Références, risque, statut, revue manuelle et remboursement.",
    primaryActions: ["Filtrer", "Vérifier prestataire", "Revue manuelle", "Marquer suspect", "Rembourser", "Auditer"],
    syncedData: ["Payment", "PayDunya", "Crédits", "Pass", "SecurityNotification", "AuditLog"],
    protections: ["SUCCESS serveur obligatoire", "Webhook signé", "Remboursement finance uniquement", "Aucun secret journalisé"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "historique",
    title: "Historique global",
    intent: "Tracer les actions des utilisateurs, pharmacies et admins.",
    uiFocus: "Date, auteur, rôle, entité, ancienne/nouvelle valeur et source.",
    primaryActions: ["Filtrer", "Consulter", "Exporter si autorisé"],
    syncedData: ["Audits", "Imports", "Transactions", "Validations"],
    protections: ["Aucun secret dans les logs", "Actions sensibles justifiées"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "notifications",
    title: "Notifications Admin",
    intent: "Centraliser les alertes internes sur paiements, imports, qualité et validations.",
    uiFocus: "Recherche serveur, priorité, statut, type d'alerte, pharmacie liée et résolution.",
    primaryActions: ["Rechercher", "Lire", "Archiver", "Traiter"],
    syncedData: ["Paiements", "Imports", "Demandes", "Qualité données", "Support pharmacie"],
    protections: ["Aucun secret dans notification", "Actions sensibles auditables"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "administrateurs",
    title: "Administrateurs",
    intent: "Gérer les accès internes SABLIN PHARMA.",
    uiFocus: "Filtres, rôles, statuts, création contrôlée, mot de passe par email, révocation sessions et audit.",
    primaryActions: ["Créer accès", "Suspendre", "Réactiver", "Bloquer", "Révoquer sessions"],
    syncedData: ["ProfessionalAccount", "ProfessionalSessionRecord", "PasswordResetToken", "AuditLog"],
    protections: ["Super admin pour actions sensibles", "Pas d'inscription publique", "Aucun mot de passe en clair", "Reset par email"],
    status: "Synchronisé",
  },
  {
    scope: "admin",
    pageKey: "parametres",
    title: "Paramètres Admin",
    intent: "Configurer les règles globales sans modifier les mots de passe depuis Admin.",
    uiFocus: "Seuils de fraîcheur, état serveur, enrichissement externe, sessions et audit.",
    primaryActions: ["Enregistrer seuils", "Tester enrichissement", "Auditer actions"],
    syncedData: ["ProfessionalSetting", "Enrichment config", "Sessions admin", "Notifications admin", "ActionLog"],
    protections: ["Pas de modification mot de passe Admin ici", "Secrets masqués", "PATCH réservé admin.settings.manage"],
    status: "Synchronisé",
  },
];

export const PLATFORM_UX_SECTIONS: PlatformUxSection[] = [
  {
    platform: "user",
    section: "Accueil",
    purpose: "Comprendre rapidement les médicaments, pharmacies, crédits et garanties.",
    uiState: "Recherche, catégories, pharmacies de garde et services avancés verrouillés.",
    dataSource: "Statistiques publiques, pharmacies validées, inventaires publiés.",
    syncTarget: "Affichage public sans donnée sensible gratuite.",
    status: "Synchronisé",
    owner: "Utilisateur",
  },
  {
    platform: "user",
    section: "Médicaments",
    purpose: "Afficher une marketplace claire sans vente directe de médicaments.",
    uiState: "Images validées ou placeholder, informations générales, actions à crédits.",
    dataSource: "Référentiel médicaments, lignes sûres publiées, images validées.",
    syncTarget: "Détails médicament et actions avancées après crédit.",
    status: "Publication contrôlée",
    owner: "Utilisateur",
  },
  {
    platform: "user",
    section: "Pharmacies",
    purpose: "Orienter l’utilisateur vers les pharmacies validées et lisibles.",
    uiState: "Nom, commune, quartier, horaires généraux, garde, photos publiques.",
    dataSource: "Profils pharmacie validés par Admin ou mis à jour par Pharmacie.",
    syncTarget: "Fiches publiques avec contacts et listes médicaments verrouillés.",
    status: "Synchronisé",
    owner: "Utilisateur",
  },
  {
    platform: "user",
    section: "Ordonnance, portefeuille et paiements",
    purpose: "Garder le modèle crédits et Pass Ordonnance Unique compréhensible.",
    uiState: "Coûts visibles, confirmations, paiement PayDunya vérifié côté serveur.",
    dataSource: "Transactions serveur, crédits, pass, restrictions centralisées.",
    syncTarget: "Débits, historiques, notifications et résultats verrouillés.",
    status: "Verrouillé",
    owner: "Utilisateur",
  },
  {
    platform: "pharmacy",
    section: "Tableau de bord",
    purpose: "Piloter les actions quotidiennes d’une seule pharmacie connectée.",
    uiState: "Résumé, demandes, confirmations, garde, qualité et publication.",
    dataSource: "Données de la pharmacie rattachée à la session pharmacie.",
    syncTarget: "Admin global et affichage utilisateur après contrôle.",
    status: "Synchronisé",
    owner: "Pharmacie",
  },
  {
    platform: "pharmacy",
    section: "Mes médicaments et import inventaire",
    purpose: "Saisir ou importer les produits libres publiables sans intervention admin.",
    uiState: "Aperçu, validation groupée, retrait individuel, images candidates.",
    dataSource: "Fichiers Excel, CSV, Word, PowerPoint et saisie manuelle.",
    syncTarget: "Marketplace utilisateur après filtrage des médicaments interdits.",
    status: "Publication contrôlée",
    owner: "Pharmacie",
  },
  {
    platform: "pharmacy",
    section: "Demandes, confirmations et conseils",
    purpose: "Répondre aux demandes utilisateurs sans exposer de données confidentielles.",
    uiState: "Files de traitement, statuts, réponses, sources et historique.",
    dataSource: "Demandes payées, confirmations, contacts débloqués côté utilisateur.",
    syncTarget: "Fiabilité des disponibilités et notifications utilisateur.",
    status: "Synchronisé",
    owner: "Pharmacie",
  },
  {
    platform: "pharmacy",
    section: "Horaires, garde, profil, équipe et paramètres",
    purpose: "Maintenir les informations de terrain et les permissions internes.",
    uiState: "Jours, heures, garde, photos, rôles employés, notifications, préférences, support et audit récent.",
    dataSource: "Session pharmacie, profil validé, ProfessionalSetting, ActionLog et documents internes protégés.",
    syncTarget: "Pharmacies ouvertes, de garde, fiche publique, alertes admin et permissions pharmacie.",
    status: "Synchronisé",
    owner: "Pharmacie",
  },
  {
    platform: "admin",
    section: "Tableau de bord maître",
    purpose: "Contrôler les trois plateformes depuis une vue centrale.",
    uiState: "KPIs, files prioritaires, alertes qualité, crédits et paiements.",
    dataSource: "Base commune, API admin, transactions, imports et audits.",
    syncTarget: "Utilisateur, Pharmacie et publication marketplace.",
    status: "Synchronisé",
    owner: "Admin",
  },
  {
    platform: "admin",
    section: "Pharmacies et comptes pro",
    purpose: "Créer, valider, suspendre et gérer plusieurs pharmacies.",
    uiState: "Filtres, détail, mode gestion pharmacie et notes internes.",
    dataSource: "Inscriptions pharmacie, créations admin, documents et profils.",
    syncTarget: "Espace pharmacie et fiches publiques validées.",
    status: "Contrôle admin",
    owner: "Admin",
  },
  {
    platform: "admin",
    section: "Référentiel, interdits, imports et enrichissement",
    purpose: "Empêcher les doublons, retirer les interdits et valider les images.",
    uiState: "Validation groupée, retrait individuel, sources, licences, fallback.",
    dataSource: "Référentiel central, moteur marketplace, moteur images serveur.",
    syncTarget: "Produits publiés côté utilisateur uniquement après règles sûres.",
    status: "Publication contrôlée",
    owner: "Admin",
  },
  {
    platform: "admin",
    section: "Utilisateurs, crédits, fraudes et historique",
    purpose: "Garantir que les comptes et décomptes viennent du serveur.",
    uiState: "Transactions, paiements, fraude, pass, demandes et audit global.",
    dataSource: "Paiements confirmés, débits crédits, accès débloqués.",
    syncTarget: "Portefeuille utilisateur, notifications et restrictions.",
    status: "Verrouillé",
    owner: "Admin",
  },
];

export const PLATFORM_SYNC_FLOWS: PlatformSyncFlow[] = [
  {
    id: "pharmacy-profile-publication",
    title: "Profil pharmacie validé vers fiche utilisateur",
    source: "Pharmacie ou Admin",
    processor: "Validation Admin + règles de publication",
    target: "Utilisateur",
    status: "Publication contrôlée",
    checks: [
      "Compte pharmacie validé",
      "Photos publiques propres",
      "Documents admin invisibles au public",
      "Contacts verrouillés par crédits",
    ],
    visibleFor: ["user", "pharmacy", "admin"],
  },
  {
    id: "inventory-marketplace",
    title: "Import inventaire vers marketplace",
    source: "Pharmacie ou Admin",
    processor: "Normalisation, interdits, validation groupée et retrait individuel",
    target: "Médicaments utilisateur",
    status: "Publication contrôlée",
    checks: [
      "Médicament reconnu ou validé",
      "Médicament non interdit",
      "Ligne sûre publiée",
      "Prix et disponibilité verrouillés sans crédit",
    ],
    visibleFor: ["user", "pharmacy", "admin"],
  },
  {
    id: "image-enrichment",
    title: "Images produits vers affichage public",
    source: "Référentiel, photos pharmacie ou fournisseur serveur",
    processor: "Score, licence, validation admin ou placeholder SABLIN",
    target: "Cartes médicaments et détails",
    status: "Contrôle admin",
    checks: [
      "Aucune clé exposée côté client",
      "Image web jamais publiée sans validation",
      "Placeholder utilisé si doute",
      "Source et licence conservées",
    ],
    visibleFor: ["pharmacy", "admin"],
  },
  {
    id: "payments-credits",
    title: "Paiement confirmé vers crédits et pass",
    source: "PayDunya et prestataire paiement",
    processor: "Webhook serveur, idempotence, audit et anti-fraude",
    target: "Portefeuille utilisateur",
    status: "Verrouillé",
    checks: [
      "SUCCESS serveur obligatoire",
      "Aucun solde local accepté",
      "Transaction atomique",
      "Pass Ordonnance Unique à 500 FCFA",
    ],
    visibleFor: ["user", "admin"],
  },
  {
    id: "confirmation-reliability",
    title: "Confirmation pharmacie vers fiabilité",
    source: "Demandes utilisateurs payées",
    processor: "Réponse pharmacie, source donnée et niveau de fiabilité",
    target: "Disponibilité affichable après crédit",
    status: "Synchronisé",
    checks: [
      "Réponse historisée",
      "Stock exact jamais public",
      "Donnée ancienne devient à confirmer",
      "Notification utilisateur créée",
    ],
    visibleFor: ["pharmacy", "admin"],
  },
  {
    id: "counts-sync",
    title: "Compteurs synchronisés entre espaces",
    source: "Base commune et endpoints de résumé",
    processor: "Agrégations publiques, pharmacie et admin",
    target: "KPIs, listes et tableaux de bord",
    status: "Synchronisé",
    checks: [
      "Même source pour les compteurs",
      "Filtres appliqués avant affichage",
      "Pharmacies non validées exclues du public",
      "Aucun chiffre codé en dur",
    ],
    visibleFor: ["user", "pharmacy", "admin"],
  },
];

export const UX_SYNC_GUARDRAILS = [
  "Aucun bouton public ne redirige vers Admin ou Pharmacie.",
  "Les espaces restent séparés dans l’UI, les routes et les sessions.",
  "Les données avancées restent verrouillées sans crédit ou pass valide.",
  "Les prix, contacts, stocks et comparaisons ne sortent pas des API sans autorisation.",
  "Les photos publiques sont séparées des documents administratifs internes.",
  "Les lignes ambiguës restent en validation Admin, les lignes sûres peuvent être publiées.",
  "Aucune couleur dégradée ni texte à faible contraste.",
  "Le responsive mobile doit empiler, réduire et faire passer les badges à la ligne.",
];

export function sectionsForPlatform(scope: PlatformScope) {
  return PLATFORM_UX_SECTIONS.filter((section) => section.platform === scope);
}

export function flowsForPlatform(scope: PlatformScope) {
  return PLATFORM_SYNC_FLOWS.filter((flow) => flow.visibleFor.includes(scope));
}

export function sectionGuideFor(scope: PlatformScope, pageKey: string) {
  const alias = PAGE_KEY_ALIASES[scope][pageKey];
  return (
    PLATFORM_SECTION_GUIDES.find((guide) => guide.scope === scope && guide.pageKey === pageKey) ??
    (alias ? PLATFORM_SECTION_GUIDES.find((guide) => guide.scope === scope && guide.pageKey === alias) : undefined) ??
    DEFAULT_SECTION_GUIDES[scope]
  );
}

export function sectionGuidesFor(scope?: PlatformScope) {
  return scope ? PLATFORM_SECTION_GUIDES.filter((guide) => guide.scope === scope) : PLATFORM_SECTION_GUIDES;
}

export function routeForSection(scope: PlatformScope, pageKey: string) {
  const alias = PAGE_KEY_ALIASES[scope][pageKey];
  return PLATFORM_SECTION_ROUTES[scope][pageKey] ?? (alias ? PLATFORM_SECTION_ROUTES[scope][alias] : null) ?? null;
}

export function maturityScoreForStatus(status: UxSyncStatus) {
  if (status === "Synchronisé") return 100;
  if (status === "Publication contrôlée") return 88;
  if (status === "Contrôle admin") return 78;
  if (status === "Verrouillé") return 72;
  return 58;
}

export function coverageItemsFor(scope?: PlatformScope): PlatformCoverageItem[] {
  return sectionGuidesFor(scope).map((guide) => ({
    ...guide,
    route: routeForSection(guide.scope, guide.pageKey),
    maturityScore: maturityScoreForStatus(guide.status),
  }));
}

export function coverageSummaryFor(items: PlatformCoverageItem[]): PlatformCoverageSummary {
  const total = items.length;
  const controlled = items.filter((item) => item.status === "Publication contrôlée" || item.status === "Contrôle admin").length;
  const maturityTotal = items.reduce((sum, item) => sum + item.maturityScore, 0);
  return {
    total,
    synchronized: items.filter((item) => item.status === "Synchronisé").length,
    controlled,
    locked: items.filter((item) => item.status === "Verrouillé").length,
    watch: items.filter((item) => item.status === "À surveiller").length,
    missingCoverage: 0,
    averageMaturity: total > 0 ? Math.round(maturityTotal / total) : 0,
  };
}

export function coverageReportFor(scope?: PlatformScope): PlatformCoverageReport {
  const sections = coverageItemsFor(scope);
  const missingPageKeys = missingCoverageKeysFor(scope);
  const summary = coverageSummaryFor(sections);
  return {
    scope: scope ?? "all",
    generatedAt: new Date().toISOString(),
    summary: { ...summary, missingCoverage: missingPageKeys.length },
    sections,
    missingPageKeys,
  };
}

export function missingCoverageKeysFor(scope?: PlatformScope) {
  const scopes: PlatformScope[] = scope ? [scope] : ["user", "pharmacy", "admin"];
  return scopes.flatMap((currentScope) => {
    const explicitKeys = new Set(PLATFORM_SECTION_GUIDES.filter((guide) => guide.scope === currentScope).map((guide) => guide.pageKey));
    const aliases = PAGE_KEY_ALIASES[currentScope];
    return PLATFORM_REQUIRED_PAGE_KEYS[currentScope]
      .filter((pageKey) => !explicitKeys.has(pageKey) && !explicitKeys.has(aliases[pageKey]))
      .map((pageKey) => ({ scope: currentScope, pageKey, route: routeForSection(currentScope, pageKey) }));
  });
}

export function sectionWorkflowFor(scope: PlatformScope, pageKey: string): PlatformSectionWorkflow {
  const guide = sectionGuideFor(scope, pageKey);
  const alias = PAGE_KEY_ALIASES[scope][pageKey];
  const apiRoutes = SECTION_API_ROUTES[scope][pageKey] ?? (alias ? SECTION_API_ROUTES[scope][alias] : undefined) ?? [];
  const dataInputs = guide.syncedData.length ? guide.syncedData : DEFAULT_SECTION_GUIDES[scope].syncedData;
  const serverActions = guide.primaryActions.length ? guide.primaryActions : DEFAULT_SECTION_GUIDES[scope].primaryActions;

  const syncOutputs =
    scope === "user"
      ? ["Affichage public contrôlé", "Historique utilisateur si action payante", "Notifications liées au compte"]
      : scope === "pharmacy"
        ? ["Base commune pharmacie", "Vue Admin", "Affichage utilisateur après règles de publication"]
        : ["Pilotage global", "Publication contrôlée", "Audit et supervision multi-plateformes"];

  const auditSignals =
    scope === "user"
      ? ["Session utilisateur", "Débit crédits côté serveur", "Accès temporaire déverrouillé"]
      : scope === "pharmacy"
        ? ["Session pharmacie séparée", "Journal professionnel", "Pharmacie rattachée vérifiée"]
        : ["Session Admin séparée", "Rôle et permission vérifiés", "Action sensible auditée"];

  return {
    scope,
    pageKey,
    dataInputs,
    serverActions,
    syncOutputs,
    protectionChecks: guide.protections,
    auditSignals,
    apiRoutes,
  };
}

export function sectionReadinessFor(scope: PlatformScope, pageKey: string): PlatformSectionReadiness {
  const guide = sectionGuideFor(scope, pageKey);
  const workflow = sectionWorkflowFor(scope, pageKey);
  const action = guide.primaryActions[0] ?? DEFAULT_SECTION_GUIDES[scope].primaryActions[0];
  const data = guide.syncedData[0] ?? DEFAULT_SECTION_GUIDES[scope].syncedData[0];
  const protection = guide.protections[0] ?? DEFAULT_SECTION_GUIDES[scope].protections[0];
  const output = workflow.syncOutputs[0] ?? "Synchronisation contrôlée";

  if (guide.status === "Verrouillé") {
    return {
      scope,
      pageKey,
      priority: "Sécurité",
      nextAction: `Vérifier le verrouillage avant : ${action}`,
      syncProof: `${data} doit passer par une autorisation ou un rôle valide.`,
      completionRule: `Le contenu sensible reste inaccessible tant que : ${protection}.`,
      riskIfIgnored: "Une donnée payante, interne ou sensible pourrait être exposée trop tôt.",
    };
  }

  if (guide.status === "Publication contrôlée") {
    return {
      scope,
      pageKey,
      priority: "Contrôle",
      nextAction: `Traiter les éléments sûrs puis isoler les ambiguës : ${action}`,
      syncProof: `La source « ${data} » alimente « ${output} » uniquement après contrôle.`,
      completionRule: `La section est prête quand les actions sont historisées et que : ${protection}.`,
      riskIfIgnored: "Des données non validées, interdites ou trop anciennes pourraient atteindre l’espace utilisateur.",
    };
  }

  if (guide.status === "Contrôle admin") {
    return {
      scope,
      pageKey,
      priority: "Contrôle",
      nextAction: `Faire valider ou superviser : ${action}`,
      syncProof: `${data} reste visible dans l’Admin avec preuve d’audit.`,
      completionRule: `La section est fiable quand un admin peut expliquer la source, l’action et la sortie.`,
      riskIfIgnored: "La plateforme peut devenir floue pour les équipes internes ou les pharmacies partenaires.",
    };
  }

  if (guide.status === "À surveiller") {
    return {
      scope,
      pageKey,
      priority: "Surveillance",
      nextAction: `Surveiller les signaux faibles : ${action}`,
      syncProof: `${data} doit rester mesurable et comparé aux compteurs publics.`,
      completionRule: "La section est saine quand les compteurs, filtres et états vides restent cohérents.",
      riskIfIgnored: "Les écarts de compteurs ou les données anciennes peuvent réduire la confiance.",
    };
  }

  return {
    scope,
    pageKey,
    priority: "Stable",
    nextAction: `Maintenir le flux principal : ${action}`,
    syncProof: `La source « ${data} » se répercute dans « ${output} ».`,
    completionRule: `La section reste prête tant que : ${protection}.`,
    riskIfIgnored: "La cohérence peut régresser lors d’un ajout de route, d’API ou de données.",
  };
}
