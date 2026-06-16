"use client";

import { Phone, MessageCircle, Crown, ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { useNav } from "@/store/nav";
import type { View } from "@/lib/types";

export function Footer() {
  const { navigate } = useNav();

  const go = (v: View) => navigate(v);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Logo size={40} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              La plateforme d&apos;information santé n°1 en Côte d&apos;Ivoire.
              Trouvez vos médicaments et les pharmacies près de chez vous, à toute heure.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href="tel:+2250700000000"
                className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground hover:text-brand"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-light text-brand">
                  <Phone className="size-4" />
                </span>
                Besoin d&apos;aide ? <span className="font-bold">+225 07 00 00 00 00</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground hover:text-brand"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-light text-brand">
                  <MessageCircle className="size-4" />
                </span>
                Assistance WhatsApp 24/7
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => go("home")} className="hover:text-brand">Accueil</button></li>
              <li><button onClick={() => go("medications")} className="hover:text-brand">Médicaments</button></li>
              <li><button onClick={() => go("pharmacies")} className="hover:text-brand">Pharmacies</button></li>
              <li><button onClick={() => go("prescription")} className="hover:text-brand">Estimer mon ordonnance</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">Compte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => go("auth")} className="hover:text-brand">Connexion</button></li>
              <li><button onClick={() => go("auth")} className="hover:text-brand">Inscription</button></li>
              <li><button onClick={() => go("profile")} className="hover:text-brand">Mon profil</button></li>
              <li><button onClick={() => go("favorites")} className="hover:text-brand">Mes favoris</button></li>
              <li><button onClick={() => go("history")} className="hover:text-brand">Historique</button></li>
              <li><button onClick={() => go("notifications")} className="hover:text-brand">Notifications</button></li>
              <li><button onClick={() => go("settings")} className="hover:text-brand">Paramètres</button></li>
              <li>
                <button onClick={() => go("subscription")} className="inline-flex items-center gap-1 hover:text-brand">
                  <Crown className="size-3.5 text-amber-500" /> Premium
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-foreground">Application</h4>
            <div className="flex flex-col gap-2.5">
              <button className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-brand/40">
                <span className="text-xl"></span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-muted-foreground">Télécharger sur</span>
                  <span className="text-sm font-bold">Google Play</span>
                </span>
              </button>
              <button className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-brand/40">
                <span className="text-xl"></span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-muted-foreground">Disponible sur</span>
                  <span className="text-sm font-bold">App Store</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} SABLIN PHARMA — Côte d&apos;Ivoire. Plateforme d&apos;information. Aucune vente en ligne.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => go("subscription")} className="inline-flex items-center gap-1 hover:text-brand">
              Mentions légales <ChevronRight className="size-3" />
            </button>
            <span>·</span>
            <button className="hover:text-brand">Confidentialité</button>
            <span>·</span>
            <button onClick={() => go("design-system")} className="hover:text-brand">
              Design System
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
