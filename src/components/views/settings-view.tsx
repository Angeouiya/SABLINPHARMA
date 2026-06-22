"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Globe,
  Lock,
  Crown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Download,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Loader } from "@/components/shared/loader";
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import type { UserSettings } from "@/lib/types";

const COMMUNES = [
  "Cocody",
  "Plateau",
  "Yopougon",
  "Marcory",
  "Treichville",
  "Adjamé",
  "Abobo",
  "Koumassi",
  "Port-Bouët",
  "Attécoubé",
  "Bingerville",
  "Songon",
];

const DEFAULT_SETTINGS: UserSettings = {
  pushAlerts: true,
  dutyAlerts: true,
  priceAlerts: false,
  promoAlerts: true,
  emailRecap: false,
  language: "fr",
  theme: "light",
  defaultCommune: null,
};

type SettingKey =
  | "pushAlerts"
  | "dutyAlerts"
  | "priceAlerts"
  | "promoAlerts"
  | "emailRecap"
  | "language"
  | "theme"
  | "defaultCommune";

interface SwitchRow {
  key: SettingKey;
  label: string;
  description?: string;
  avanceLocked?: boolean;
}

const NOTIF_ROWS: SwitchRow[] = [
  {
    key: "pushAlerts",
    label: "Notifications push générales",
    description: "Recevez les annonces importantes de SABLIN PHARMA.",
  },
  {
    key: "dutyAlerts",
    label: "Alertes pharmacies de garde",
    description: "Soyez informé des pharmacies de garde près de chez vous.",
  },
  {
    key: "priceAlerts",
    label: "Alertes de prix sur mes favoris",
    description:
      "Préférence gratuite. Le coût d’une alerte avancée est affiché avant validation.",
  },
  {
    key: "promoAlerts",
    label: "Offres et promotions",
    description: "Ne manquez aucune offre de nos pharmacies partenaires.",
  },
  {
    key: "emailRecap",
    label: "Récapitulatif par e-mail",
    description: "Un résumé hebdomadaire de votre activité.",
  },
];

export function SettingsView() {
  const { navigate } = useNav();
  const { user, avance, logout } = useAuth();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings as UserSettings);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchSettings]);

  const patch = async (key: SettingKey, value: unknown) => {
    if (!settings) return;
    // Optimistic update
    setSettings({ ...settings, [key]: value });
    setSaving(key);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Échec de la mise à jour.");
      }
      const data = await res.json();
      setSettings(data.settings as UserSettings);
      toast.success("Préférence mise à jour.");
    } catch (e) {
      // Revert on error
      await fetchSettings();
      toast.error(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Vous êtes déconnecté.");
    navigate("home");
  };

  const handleExportData = async () => {
    if (!user) return;
    const userId = user.id;
    setExporting(true);
    try {
      const res = await fetch("/api/account/export", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Export impossible.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sablin-pharma-export-${userId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export généré.", {
        description: "Le fichier contient vos données utilisateur, sans mot de passe ni secret technique.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/deletion-request", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Demande impossible.");
      toast.success(data?.alreadyRequested ? "Demande déjà enregistrée." : "Demande enregistrée.", {
        description: data?.message ?? "L’équipe SABLIN PHARMA vérifiera votre compte avant toute suppression.",
      });
      setDeletionOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demande impossible.");
    } finally {
      setDeleting(false);
    }
  };

  // Not connected state
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="border-border/70 p-0 shadow-avance">
          <EmptyState
            icon={Settings}
            title="Connectez-vous pour gérer vos paramètres"
            description="Vos préférences sont enregistrées sur votre compte SABLIN PHARMA pour vous suivre sur tous vos appareils."
            action={{
              label: "Se connecter",
              onClick: () => navigate("auth", { authMode: "login" }),
            }}
          />
          <div className="px-6 pb-6">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => navigate("home")}
            >
              <ChevronLeft className="size-4" /> Retour à l&apos;accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-white shadow-avance">
          <Settings className="size-6" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Paramètres
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos préférences et votre compte
          </p>
        </div>
      </div>

      {/* Loading state */}
      {!settings ? (
        <div className="mt-8">
          <Loader label="Chargement de vos préférences..." />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {/* 1. Notifications */}
          <Card className="border-border/70 shadow-avance">
            <CardHeader className="flex flex-row items-center gap-3 px-6 pt-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Bell className="size-4" />
              </span>
              <CardTitle className="text-base font-bold text-foreground">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-4 pt-2">
              <div className="divide-y divide-border/60">
                {NOTIF_ROWS.map((row) => {
                  const checked = Boolean(settings[row.key]);
                  const isSaving = saving === row.key;
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {row.label}
                          </p>
                          {row.avanceLocked && (
                          <Badge className="border-0 bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              <Crown className="mr-1 size-3" />
                              Crédits
                            </Badge>
                          )}
                        </div>
                        {row.description && (
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {row.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isSaving && (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          checked={checked}
                          disabled={isSaving}
                          onCheckedChange={(v) => patch(row.key, v)}
                          aria-label={row.label}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Crown className="size-3.5" />
                Les préférences sont gratuites. Les services avancés affichent leur coût en crédits avant validation.
              </p>
            </CardContent>
          </Card>

          {/* 2. Préférences */}
          <Card className="border-border/70 shadow-avance">
            <CardHeader className="flex flex-row items-center gap-3 px-6 pt-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Globe className="size-4" />
              </span>
              <CardTitle className="text-base font-bold text-foreground">
                Préférences
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 px-6 pb-6 pt-2 sm:grid-cols-2">
              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-semibold">
                  Langue
                </Label>
                <Select
                  value={settings.language}
                  onValueChange={(v) => patch("language", v)}
                  disabled={saving === "language"}
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le français est la langue active du MVP SABLIN PHARMA.
                </p>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-semibold">
                  Thème
                </Label>
                <Select
                  value={settings.theme}
                  onValueChange={(v) => patch("theme", v)}
                  disabled={saving === "theme"}
                >
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Automatique</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Personnalisez l&apos;apparence de l&apos;interface.
                </p>
              </div>

              {/* Default commune */}
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="commune"
                  className="text-sm font-semibold"
                >
                  Commune par défaut
                </Label>
                <Select
                  value={settings.defaultCommune ?? "none"}
                  onValueChange={(v) =>
                    patch("defaultCommune", v === "none" ? null : v)
                  }
                  disabled={saving === "defaultCommune"}
                >
                  <SelectTrigger id="commune" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {COMMUNES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pré-filtrez les pharmacies selon votre commune
                  d&apos;habitation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Confidentialité & sécurité */}
          <Card className="border-border/70 shadow-avance">
            <CardHeader className="flex flex-row items-center gap-3 px-6 pt-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Lock className="size-4" />
              </span>
              <CardTitle className="text-base font-bold text-foreground">
                Confidentialité &amp; sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2 border-border/70"
                  onClick={() => {
                    window.location.href = "/reinitialiser-mot-de-passe";
                  }}
                >
                  <Lock className="size-4 text-brand" />
                  Modifier mon mot de passe par e-mail
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 border-border/70"
                    onClick={handleExportData}
                    disabled={exporting}
                  >
                  {exporting ? <Loader2 className="size-4 animate-spin text-brand" /> : <Download className="size-4 text-brand" />}
                  Télécharger mes données
                </Button>
                <AlertDialog open={deletionOpen} onOpenChange={setDeletionOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-border bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Demander la suppression du compte</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        SABLIN PHARMA va enregistrer une demande auditée. L’équipe vérifie d’abord les crédits,
                        transactions, pass et demandes en cours avant toute suppression définitive.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                      Cette action ne supprime pas brutalement votre compte immédiatement. Elle protège vos preuves de paiement
                      et évite de perdre un historique utile pour le support.
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                      >
                        {deleting && <Loader2 className="size-4 animate-spin" />}
                        Envoyer la demande
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-light/30 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-xs leading-relaxed text-brand-dark">
                  Vos données sont stockées de manière sécurisée et ne sont
                  jamais partagées avec des tiers. Vous gardez le contrôle sur
                  vos informations personnelles.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Portefeuille */}
          <Card className="border-border/70 shadow-avance">
            <CardHeader className="flex flex-row items-center gap-3 px-6 pt-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Crown className="size-4" />
              </span>
              <CardTitle className="text-base font-bold text-foreground">
                Portefeuille
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-50 p-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-amber-500 text-white">
                    <Crown className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-amber-900">
                      Solde : {user.credits ?? 0} crédit{(user.credits ?? 0) > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-amber-800/80">
                      1 crédit = 100 FCFA. Le Pass Ordonnance Unique coûte 500 FCFA et reste valable pour une seule ordonnance.
                    </p>
                  </div>
                  {avance && <CheckCircle2 className="size-5 text-amber-600" />}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    className="w-full bg-brand text-white hover:bg-brand-dark"
                    onClick={() => navigate("wallet")}
                  >
                    Recharger mes crédits
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                    onClick={() => navigate("wallet")}
                  >
                    Acheter un Pass Ordonnance Unique
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="border-border/70">
            <CardContent className="px-6 py-5">
              <LogoutConfirmDialog onConfirm={handleLogout}>
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Se déconnecter
                </Button>
              </LogoutConfirmDialog>
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="pb-2 text-center text-xs text-muted-foreground">
            SABLIN PHARMA v1.0 — Plateforme d&apos;information. Aucune vente en
            ligne.
          </p>
        </div>
      )}
    </div>
  );
}
