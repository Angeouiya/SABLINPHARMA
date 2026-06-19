"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heading, Muted } from "@/components/ui/typography";

type PasswordResetViewProps = {
  scope: "user" | "professional";
};

export function PasswordResetView({ scope }: PasswordResetViewProps) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isProfessional = scope === "professional";
  const endpoint = isProfessional ? "/api/professional/password-reset" : "/api/auth/password-reset";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Demande impossible.");
      setMessage(data?.message ?? "Si le compte existe, un lien de réinitialisation a été envoyé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demande impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmation }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Réinitialisation impossible.");
      setMessage(data?.message ?? "Mot de passe modifié avec succès.");
      setPassword("");
      setConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <section>
            <Logo size={58} />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-wide text-brand">
              SABLIN PHARMA {isProfessional ? "Professionnel" : "Utilisateur"}
            </p>
            <Heading level="h1" className="mt-2 text-3xl sm:text-4xl">
              Réinitialiser le mot de passe
            </Heading>
            <Muted className="mt-3 max-w-xl">
              {isProfessional
                ? "Saisissez l’e-mail professionnel associé au compte pharmacie ou admin. Un lien sécurisé est envoyé par SABLIN PHARMA."
                : "Saisissez le Gmail ou l’e-mail de votre compte utilisateur. Vous recevrez un lien SABLIN PHARMA pour choisir un nouveau mot de passe."}
            </Muted>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Lien à usage unique", "Expiration après 30 minutes", "Aucun mot de passe envoyé en clair", "Sessions professionnelles révoquées"].map((item) => (
                <Card key={item} className="border-border/70 p-4">
                  <ShieldCheck className="size-5 text-brand" />
                  <p className="mt-2 text-sm font-bold text-foreground">{item}</p>
                </Card>
              ))}
            </div>
          </section>

          <Card className="border-border/70 p-5 shadow-card sm:p-6">
            {token ? (
              <form onSubmit={confirmReset} className="space-y-4">
                <div>
                  <Heading level="h2">Nouveau mot de passe</Heading>
                  <Muted className="mt-1">
                    Choisissez un mot de passe robuste. Le lien ne pourra plus être réutilisé.
                  </Muted>
                </div>
                <PasswordField label="Nouveau mot de passe" value={password} onChange={setPassword} />
                <PasswordField label="Confirmer le mot de passe" value={confirmation} onChange={setConfirmation} />
                <Button disabled={loading} className="h-11 w-full bg-brand text-white hover:bg-brand-dark">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                  Modifier mon mot de passe
                </Button>
              </form>
            ) : (
              <form onSubmit={requestReset} className="space-y-4">
                <div>
                  <Heading level="h2">Recevoir le lien par e-mail</Heading>
                  <Muted className="mt-1">
                    {isProfessional
                      ? "Utilisez l’e-mail professionnel du compte pharmacie ou admin."
                      : "Le téléphone ne suffit pas pour ce flux : le lien est envoyé par Gmail/e-mail."}
                  </Muted>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">{isProfessional ? "E-mail professionnel" : "Gmail ou e-mail"}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={isProfessional ? "pharmacie@sablin.ci" : "vous@gmail.com"}
                      className="h-11 bg-white pl-9 text-foreground placeholder:text-muted-foreground"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button disabled={loading} className="h-11 w-full bg-brand text-white hover:bg-brand-dark">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Envoyer le lien sécurisé
                </Button>
              </form>
            )}

            {message && (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                {error}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="8 caractères minimum"
        className="h-11 bg-white text-foreground placeholder:text-muted-foreground"
        autoComplete="new-password"
      />
    </div>
  );
}
