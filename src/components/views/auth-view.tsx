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
  ShieldCheck,
  Search,
  ClipboardList,
  Timer,
  Heart,
  AlertCircle,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
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
  { icon: Search, text: "Trouvez vos médicaments plus rapidement" },
  { icon: ClipboardList, text: "Estimez vos ordonnances en quelques clics" },
  { icon: Timer, text: "Consultez les pharmacies de garde 24/7" },
  { icon: Heart, text: "Gardez vos recherches et pharmacies en favoris" },
];

function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function phoneIsValid(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  return /^(\+225)?\d{8,10}$/.test(cleaned);
}

export function AuthView() {
  const { params, navigate } = useNav();
  const { setUser, fetchMe } = useAuth();
  const defaultTab = params.authMode === "register" ? "register" : "login";

  // ---------- Login state ----------
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // ---------- Register state ----------
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCommune, setRegCommune] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regAccept, setRegAccept] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // ---------- Login ----------
  function validateLogin() {
    const errors: Record<string, string> = {};
    if (!loginIdentifier.trim()) {
      errors.identifier = "Ce champ est obligatoire.";
    }
    if (!loginPassword) {
      errors.password = "Le mot de passe est obligatoire.";
    } else if (loginPassword.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateLogin()) return;

    // Determine if identifier is email or phone
    const isEmail = emailIsValid(loginIdentifier);
    const isPhone = phoneIsValid(loginIdentifier);
    if (!isEmail && !isPhone) {
      setLoginErrors({ identifier: "Format invalide. Saisissez un e-mail ou téléphone valide." });
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmail ? loginIdentifier : `${loginIdentifier.replace(/\s/g, "")}@phone.ci`,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setLoginErrors({ password: "E-mail ou mot de passe incorrect." });
        } else {
          toast.error(data?.error ?? "Connexion impossible.");
        }
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

  // ---------- Register ----------
  function validateRegister() {
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = "Le nom complet est obligatoire.";
    if (!regEmail.trim()) {
      errors.email = "L'e-mail est obligatoire.";
    } else if (!emailIsValid(regEmail)) {
      errors.email = "Format d'e-mail invalide.";
    }
    if (!regPhone.trim()) {
      errors.phone = "Le téléphone est obligatoire.";
    } else if (!phoneIsValid(regPhone)) {
      errors.phone = "Numéro invalide. Ex : 07 00 00 00 00";
    }
    if (!regCommune) errors.commune = "Veuillez sélectionner votre commune.";
    if (!regPassword) {
      errors.password = "Le mot de passe est obligatoire.";
    } else if (regPassword.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }
    if (!regConfirm) {
      errors.confirm = "Veuillez confirmer votre mot de passe.";
    } else if (regPassword !== regConfirm) {
      errors.confirm = "Les mots de passe ne correspondent pas.";
    }
    if (!regAccept) errors.accept = "Vous devez accepter les conditions d'utilisation.";
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateRegister()) return;

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          commune: regCommune,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setRegErrors({ email: "Un compte existe déjà avec cet e-mail." });
        } else {
          toast.error(data?.error ?? "Inscription impossible.");
        }
        return;
      }
      setUser(data.user as AuthUser);
      await fetchMe();
      toast.success("Compte créé avec succès. Bienvenue sur SABLIN PHARMA !");
      navigate("home");
    } catch {
      toast.error("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setRegLoading(false);
    }
  }

  function handleQuickAuth(provider: string) {
    toast.info(`${provider} bientôt disponible.`, {
      description: "Utilisez l'e-mail/téléphone pour le moment.",
    });
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* ---------- Left brand panel ---------- */}
      <aside className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-dotted-white opacity-20" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative">
          <Logo variant="light" size={56} />
        </div>

        <div className="relative max-w-md text-white">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            Votre santé, simplifiée
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 xl:text-base">
            Rejoignez la plateforme d&apos;information santé n°1 en Côte
            d&apos;Ivoire. Accédez à des informations fiables sur vos médicaments
            et pharmacies à Abidjan.
          </p>

          <ul className="mt-8 space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <b.icon className="size-4 text-white" />
                </span>
                <span className="text-sm leading-snug text-white/90">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-white/70">
          <ShieldCheck className="size-3.5" />
          <span>Plateforme 100% information · Aucune vente en ligne</span>
        </div>
      </aside>

      {/* ---------- Right form panel ---------- */}
      <section className="flex flex-col bg-background">
        <div className="border-b border-border/70 px-4 py-3 sm:px-6 lg:hidden">
          <Logo size={50} />
        </div>

        <button
          type="button"
          onClick={() => navigate("home")}
          className="group mx-auto mt-4 flex w-full max-w-md items-center gap-1.5 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-brand sm:px-6 lg:mt-6"
        >
          <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Retour à l&apos;accueil
        </button>

        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:py-10">
          <div className="w-full max-w-md">
            <Tabs defaultValue={defaultTab} className="w-full">
              {/* Mobile intro */}
              <div className="mb-5 text-center lg:hidden">
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
                <Card className="border-border/70 p-6 shadow-avance sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-brand-dark">
                      Connexion à votre compte
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Saisissez vos identifiants pour accéder à tous les services
                      SABLIN PHARMA.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    {/* Identifier (email or phone) */}
                    <Field
                      id="login-identifier"
                      label="Téléphone ou e-mail"
                      icon={Mail}
                      placeholder="07 00 00 00 00 ou vous@exemple.ci"
                      value={loginIdentifier}
                      onChange={(v) => {
                        setLoginIdentifier(v);
                        if (loginErrors.identifier)
                          setLoginErrors((e) => ({ ...e, identifier: "" }));
                      }}
                      error={loginErrors.identifier}
                      disabled={loginLoading}
                      autoComplete="username"
                    />

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <button
                          type="button"
                          onClick={() =>
                            toast.info(
                              "Contactez le support pour réinitialiser votre mot de passe.",
                              { description: "+225 07 00 00 00 00" }
                            )
                          }
                          className="text-xs font-medium text-brand transition-colors hover:text-brand-dark hover:underline"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <PasswordInput
                        id="login-password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(v) => {
                          setLoginPassword(v);
                          if (loginErrors.password)
                            setLoginErrors((e) => ({ ...e, password: "" }));
                        }}
                        error={loginErrors.password}
                        show={showLoginPwd}
                        onToggle={() => setShowLoginPwd((v) => !v)}
                        disabled={loginLoading}
                        autoComplete="current-password"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="h-11 w-full bg-brand text-base font-semibold text-white shadow-avance transition-all hover:opacity-95 hover:shadow-avance-lg"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Connexion…
                        </>
                      ) : (
                        <>
                          Se connecter <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Quick auth */}
                  <div className="relative my-5">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                      ou continuer avec
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={() => handleQuickAuth("Connexion Google")}
                    >
                      <GoogleIcon /> Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={() => handleQuickAuth("Connexion par téléphone")}
                    >
                      <Smartphone className="size-4 text-brand" /> Téléphone
                    </Button>
                  </div>

                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("auth", { authMode: "register" })}
                      className="font-semibold text-brand hover:underline"
                    >
                      Créer un compte
                    </button>
                  </p>
                </Card>
              </TabsContent>

              {/* ---------- REGISTER ---------- */}
              <TabsContent value="register" className="mt-6">
                <Card className="border-border/70 p-6 shadow-avance sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-brand-dark">
                      Créer votre compte
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quelques informations suffisent pour profiter de tous les
                      services SABLIN PHARMA.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    <Field
                      id="reg-name"
                      label="Nom complet"
                      icon={User}
                      placeholder="Aïcha Koffi"
                      value={regName}
                      onChange={(v) => {
                        setRegName(v);
                        if (regErrors.name) setRegErrors((e) => ({ ...e, name: "" }));
                      }}
                      error={regErrors.name}
                      disabled={regLoading}
                      autoComplete="name"
                      required
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        id="reg-phone"
                        label="Téléphone"
                        icon={Phone}
                        placeholder="07 00 00 00 00"
                        value={regPhone}
                        onChange={(v) => {
                          setRegPhone(v);
                          if (regErrors.phone)
                            setRegErrors((e) => ({ ...e, phone: "" }));
                        }}
                        error={regErrors.phone}
                        disabled={regLoading}
                        autoComplete="tel"
                        required
                      />
                      <Field
                        id="reg-email"
                        label="E-mail"
                        icon={Mail}
                        placeholder="vous@exemple.ci"
                        value={regEmail}
                        onChange={(v) => {
                          setRegEmail(v);
                          if (regErrors.email)
                            setRegErrors((e) => ({ ...e, email: "" }));
                        }}
                        error={regErrors.email}
                        disabled={regLoading}
                        autoComplete="email"
                        required
                      />
                    </div>

                    {/* Commune */}
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-commune">
                        Commune ou ville <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={regCommune}
                        onValueChange={(v) => {
                          setRegCommune(v);
                          if (regErrors.commune)
                            setRegErrors((e) => ({ ...e, commune: "" }));
                        }}
                        disabled={regLoading}
                      >
                        <SelectTrigger
                          id="reg-commune"
                          className={cn(
                            "h-11 w-full",
                            regErrors.commune && "border-destructive"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="size-4 text-muted-foreground" />
                            <SelectValue placeholder="Sélectionner votre commune" />
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
                      {regErrors.commune && <FieldError msg={regErrors.commune} />}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">
                        Mot de passe <span className="text-destructive">*</span>
                      </Label>
                      <PasswordInput
                        id="reg-password"
                        placeholder="6 caractères minimum"
                        value={regPassword}
                        onChange={(v) => {
                          setRegPassword(v);
                          if (regErrors.password)
                            setRegErrors((e) => ({ ...e, password: "" }));
                        }}
                        error={regErrors.password}
                        show={showRegPwd}
                        onToggle={() => setShowRegPwd((v) => !v)}
                        disabled={regLoading}
                        autoComplete="new-password"
                      />
                      {regPassword && regPassword.length < 6 && !regErrors.password && (
                        <p className="text-xs text-muted-foreground">
                          Le mot de passe doit contenir au moins 6 caractères.
                        </p>
                      )}
                    </div>

                    {/* Confirm */}
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">
                        Confirmer le mot de passe{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <PasswordInput
                        id="reg-confirm"
                        placeholder="Saisissez à nouveau"
                        value={regConfirm}
                        onChange={(v) => {
                          setRegConfirm(v);
                          if (regErrors.confirm)
                            setRegErrors((e) => ({ ...e, confirm: "" }));
                        }}
                        error={regErrors.confirm}
                        show={showRegConfirm}
                        onToggle={() => setShowRegConfirm((v) => !v)}
                        disabled={regLoading}
                        autoComplete="new-password"
                      />
                      {regConfirm && regConfirm === regPassword && !regErrors.confirm && (
                        <p className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="size-3" /> Les mots de passe
                          correspondent.
                        </p>
                      )}
                    </div>

                    {/* Accept conditions */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-accept"
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                          regErrors.accept
                            ? "border-destructive bg-red-50/50"
                            : regAccept
                            ? "border-brand/30 bg-brand-light/30"
                            : "border-border hover:bg-accent/40"
                        )}
                      >
                        <Checkbox
                          id="reg-accept"
                          checked={regAccept}
                          onCheckedChange={(v) => {
                            setRegAccept(v === true);
                            if (regErrors.accept)
                              setRegErrors((e) => ({ ...e, accept: "" }));
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs leading-relaxed text-foreground/80">
                          J&apos;accepte les{" "}
                          <span className="font-semibold text-brand">
                            conditions d&apos;utilisation
                          </span>{" "}
                          et la{" "}
                          <span className="font-semibold text-brand">
                            politique de confidentialité
                          </span>{" "}
                          de SABLIN PHARMA.
                        </span>
                      </label>
                      {regErrors.accept && <FieldError msg={regErrors.accept} />}
                    </div>

                    <Button
                      type="submit"
                      disabled={regLoading}
                      className="h-11 w-full bg-brand text-base font-semibold text-white shadow-avance transition-all hover:opacity-95 hover:shadow-avance-lg"
                    >
                      {regLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Création…
                        </>
                      ) : (
                        <>
                          Créer mon compte <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Quick auth */}
                  <div className="relative my-5">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                      ou inscrivez-vous avec
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={() => handleQuickAuth("Inscription Google")}
                    >
                      <GoogleIcon /> Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={() => handleQuickAuth("Inscription par téléphone")}
                    >
                      <Smartphone className="size-4 text-brand" /> Téléphone
                    </Button>
                  </div>

                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    Déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("auth", { authMode: "login" })}
                      className="font-semibold text-brand hover:underline"
                    >
                      Se connecter
                    </button>
                  </p>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Trust badges */}
            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-brand" /> Données chiffrées
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-brand" /> 100% gratuit
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 text-brand" /> Côte d&apos;Ivoire
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   Field — champ avec icône, label, erreur inline
   ============================================================ */
function Field({
  id,
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  error,
  disabled,
  autoComplete,
  required = false,
  type = "text",
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-11 pl-9", error && "border-destructive")}
          disabled={disabled}
        />
      </div>
      {error && <FieldError msg={error} />}
    </div>
  );
}

/* ============================================================
   PasswordInput — champ mot de passe avec toggle œil
   ============================================================ */
function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  error,
  show,
  onToggle,
  disabled,
  autoComplete,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-11 pl-9 pr-10", error && "border-destructive")}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/* ============================================================
   FieldError — message d'erreur inline
   ============================================================ */
function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="size-3" /> {msg}
    </p>
  );
}

/* ============================================================
   GoogleIcon — icône Google SVG
   ============================================================ */
function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
