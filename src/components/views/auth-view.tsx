"use client";

import { useState, type FormEvent } from "react";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  MapPin,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import type { User as AuthUser } from "@/lib/types";

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

const BENEFITS = [
  "Recherchez vos médicaments en 1 clic",
  "Pharmacies de garde 24/7 à Abidjan",
  "Estimez vos ordonnances gratuitement",
  "Information fiable, aucune vente en ligne",
];

function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthView() {
  const { params, navigate } = useNav();
  const { setUser, fetchMe } = useAuth();
  const defaultTab = params.authMode === "register" ? "register" : "login";

  // ---------- Login state ----------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ---------- Register state ----------
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCommune, setRegCommune] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loginEmail.trim() || !loginPassword) {
      toast.error("Veuillez renseigner votre e-mail et votre mot de passe.");
      return;
    }
    if (!emailIsValid(loginEmail)) {
      toast.error("Format d'e-mail invalide.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Connexion impossible.");
        return;
      }
      setUser(data.user as AuthUser);
      await fetchMe();
      toast.success("Connexion réussie. Bienvenue sur SABLIN PHARMA !");
      navigate("home");
    } catch {
      toast.error("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!emailIsValid(regEmail)) {
      toast.error("Format d'e-mail invalide.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone || undefined,
          commune: regCommune || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Inscription impossible.");
        return;
      }
      setUser(data.user as AuthUser);
      await fetchMe();
      toast.success("Compte créé avec succès. Bienvenue !");
      navigate("home");
    } catch {
      toast.error("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* ---------- Left brand panel ---------- */}
      <aside className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative">
          <Logo variant="light" size={44} />
        </div>

        <div className="relative max-w-md text-white">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            Votre santé, simplifiée
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 xl:text-base">
            Rejoignez la plateforme d&apos;information santé n°1 en Côte
            d&apos;Ivoire. Accédez à des informations fiables sur vos
            médicaments et pharmacies à Abidjan.
          </p>

          <ul className="mt-8 space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="size-4 text-white" />
                </span>
                <span className="text-sm leading-snug text-white/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-white/70">
          <MapPin className="size-3.5" />
          <span>Abidjan · Côte d&apos;Ivoire</span>
          <span className="mx-1">•</span>
          <span>100% information, aucune vente</span>
        </div>
      </aside>

      {/* ---------- Right form panel ---------- */}
      <section className="flex flex-col bg-background">
        <div className="border-b border-border/70 px-4 py-3 sm:px-6 lg:hidden">
          <Logo size={36} />
        </div>

        <button
          type="button"
          onClick={() => navigate("home")}
          className="group mx-auto mt-4 flex w-full max-w-md items-center gap-1.5 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-brand sm:px-6 lg:mt-6"
        >
          <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Retour à l&apos;accueil
        </button>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-10">
          <div className="w-full max-w-md">
            <Tabs defaultValue={defaultTab} className="w-full">
              <div className="mb-6 text-center lg:hidden">
                <h1 className="text-2xl font-extrabold tracking-tight text-brand-dark">
                  Votre santé, simplifiée
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connectez-vous ou créez un compte gratuit.
                </p>
              </div>

              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>

              {/* ---------- LOGIN ---------- */}
              <TabsContent value="login" className="mt-6">
                <Card className="border-border/70 p-6 shadow-premium sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight">
                      Bon retour 👋
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Saisissez vos identifiants pour accéder à votre compte.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          placeholder="vous@exemple.ci"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-9"
                          disabled={loginLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <button
                          type="button"
                          onClick={() =>
                            toast.info(
                              "Contactez le support pour réinitialiser votre mot de passe."
                            )
                          }
                          className="text-xs font-medium text-brand transition-colors hover:text-brand-dark hover:underline"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPwd ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-9 pr-10"
                          disabled={loginLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPwd((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showLoginPwd
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                          tabIndex={-1}
                        >
                          {showLoginPwd ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="h-11 w-full bg-brand-gradient text-base font-semibold text-white shadow-premium transition-all hover:opacity-95 hover:shadow-premium-lg"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Connexion…
                        </>
                      ) : (
                        "Se connecter"
                      )}
                    </Button>
                  </form>

                  <Separator className="my-5" />
                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    En continuant, vous acceptez nos{" "}
                    <span className="font-medium text-foreground">
                      conditions d&apos;utilisation
                    </span>
                    .
                  </p>
                </Card>
              </TabsContent>

              {/* ---------- REGISTER ---------- */}
              <TabsContent value="register" className="mt-6">
                <Card className="border-border/70 p-6 shadow-premium sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight">
                      Créer un compte gratuit
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quelques informations suffisent pour commencer.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">
                        Nom complet <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Aïcha Koffi"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="pl-9"
                          disabled={regLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">
                        E-mail <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          autoComplete="email"
                          placeholder="vous@exemple.ci"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="pl-9"
                          disabled={regLoading}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-phone">
                          Téléphone{" "}
                          <span className="text-muted-foreground">
                            (optionnel)
                          </span>
                        </Label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+225 07 00 00 00"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="pl-9"
                            disabled={regLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-commune">Commune</Label>
                        <Select
                          value={regCommune}
                          onValueChange={setRegCommune}
                          disabled={regLoading}
                        >
                          <SelectTrigger id="reg-commune" className="w-full">
                            <span className="flex items-center gap-2">
                              <MapPin className="size-4 text-muted-foreground" />
                              <SelectValue placeholder="Sélectionner" />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {COMMUNES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">
                        Mot de passe <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type={showRegPwd ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="6 caractères minimum"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="pl-9 pr-10"
                          disabled={regLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPwd((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showRegPwd
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                          tabIndex={-1}
                        >
                          {showRegPwd ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">
                        Confirmer le mot de passe{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-confirm"
                          type={showRegConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Saisissez à nouveau"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          className="pl-9 pr-10"
                          disabled={regLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showRegConfirm
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                          tabIndex={-1}
                        >
                          {showRegConfirm ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={regLoading}
                      className="h-11 w-full bg-brand-gradient text-base font-semibold text-white shadow-premium transition-all hover:opacity-95 hover:shadow-premium-lg"
                    >
                      {regLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Création…
                        </>
                      ) : (
                        "Créer mon compte"
                      )}
                    </Button>
                  </form>

                  <Separator className="my-5" />
                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    En continuant, vous acceptez nos{" "}
                    <span className="font-medium text-foreground">
                      conditions d&apos;utilisation
                    </span>
                    .
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
