"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ClipboardList,
  Crown,
  ChevronRight,
  Clock,
  Timer,
  Plus,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { SearchBar } from "@/components/shared/search-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { MedicationCard, MedicationRow } from "@/components/shared/medication-card";
import { PharmacyCard } from "@/components/shared/pharmacy-card";
import { CategoryIcon } from "@/components/category-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNav } from "@/store/nav";
import { formatFCFA } from "@/lib/format";
import type { Category, Medication, Pharmacy } from "@/lib/types";

export function HomeView() {
  const { navigate } = useNav();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularMeds, setPopularMeds] = useState<Medication[]>([]);
  const [onDuty, setOnDuty] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, meds, pharma] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/medications?limit=8").then((r) => r.json()),
          fetch("/api/pharmacies?filter=on-duty").then((r) => r.json()),
        ]);
        setCategories(cats);
        setPopularMeds(meds);
        setOnDuty(pharma.slice(0, 4));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div className="text-white">
            <Badge className="border-0 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="mr-1.5 flex size-1.5 rounded-full bg-amber-300 animate-pulse" />
              Plateforme d&apos;information santé · Côte d&apos;Ivoire
            </Badge>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {greeting} !<br />
              Trouvez vos médicaments{" "}
              <span className="text-amber-300">en toute simplicité</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Recherchez un médicament, localisez les pharmacies ouvertes ou de garde à Abidjan, et estimez le coût de votre ordonnance. Aucune vente en ligne — uniquement de l&apos;information fiable.
            </p>

            <div className="mt-6 max-w-xl">
              <SearchBar variant="hero" placeholder="Rechercher un médicament (ex : Paracétamol)..." />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-white/70">Recherches populaires :</span>
              {["Paracétamol", "Amoxicilline", "Vitamine C", "Coartem"].map((p) => (
                <button
                  key={p}
                  onClick={() => navigate("medications", { query: p })}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
              <img
                src="/images/hero-pharmacy.png"
                alt="Pharmacie moderne à Abidjan"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 backdrop-blur-sm">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Plus className="size-6" strokeWidth={3} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Pharmacie de la Riviera</p>
                    <p className="text-xs text-muted-foreground">Cocody · Ouvert maintenant</p>
                  </div>
                  <Badge className="border-0 bg-amber-400 text-[10px] font-bold text-amber-950">
                    <Timer className="size-3" /> De garde
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* STATS STRIP */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "12", label: "Pharmacies partenaires", icon: MapPin },
            { value: "33+", label: "Médicaments référencés", icon: Search },
            { value: "24/7", label: "Pharmacies de garde", icon: Clock },
            { value: "Abidjan", label: "Toutes les communes", icon: CheckCircle2 },
          ].map((s) => (
            <Card key={s.label} className="gap-0 border-border/60 py-4">
              <div className="flex items-center gap-3 px-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CATEGORIES */}
        <section>
          <SectionHeader
            title="Catégories de médicaments"
            subtitle="Explorez nos familles de produits santé"
            icon={<Search className="size-5" />}
            action={{ label: "Voir tout", onClick: () => navigate("medications") }}
          />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate("medications", { category: cat.slug })}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/60 bg-background p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium"
                  >
                    <span
                      className="flex size-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${cat.color}14` }}
                    >
                      <CategoryIcon name={cat.iconName} size={24} color={cat.color} />
                    </span>
                    <span className="text-xs font-semibold leading-tight text-foreground">
                      {cat.name}
                    </span>
                  </button>
                ))}
          </div>
        </section>

        {/* ON-DUTY PHARMACIES */}
        <section>
          <SectionHeader
            title="Pharmacies de garde"
            subtitle="Ouvertes maintenant à Abidjan"
            icon={<Timer className="size-5" />}
            action={{ label: "Voir tout", onClick: () => navigate("pharmacies", { filter: "on-duty" }) }}
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
            ) : onDuty.length > 0 ? (
              onDuty.map((p) => <PharmacyCard key={p.id} pharma={p} />)
            ) : (
              <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
                Aucune pharmacie de garde pour le moment.
              </Card>
            )}
          </div>
        </section>

        {/* PRESCRIPTION + PREMIUM — two CTA blocks */}
        <section className="grid gap-5 lg:grid-cols-2">
          {/* Prescription estimation */}
          <Card className="relative overflow-hidden border-brand/20 bg-gradient-to-br from-brand-light/60 to-background py-0">
            <div className="absolute -right-8 -top-8 size-40 rounded-full bg-brand/10 blur-2xl" />
            <div className="relative flex h-full flex-col gap-4 p-6">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-premium">
                <ClipboardList className="size-6" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">Estimer mon ordonnance</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saisissez vos médicaments et obtenez instantanément une estimation du coût total et la liste des pharmacies où les trouver au meilleur prix.
                </p>
              </div>
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {["Estimation min. / max. du coût", "Comparaison des prix par pharmacie", "Vérification de la disponibilité"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-brand" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full bg-brand-gradient text-white hover:opacity-90"
                size="lg"
                onClick={() => navigate("prescription")}
              >
                <ClipboardList className="size-4" /> Commencer l&apos;estimation
              </Button>
            </div>
          </Card>

          {/* Premium subscription */}
          <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50 to-background py-0">
            <div className="absolute -right-10 -top-10 size-44 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="relative flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium">
                  <Crown className="size-6" />
                </span>
                <Badge className="border-0 bg-amber-500 text-[11px] font-bold text-white">
                  Recommandé
                </Badge>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">Abonnement Premium</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Débloquez toutes les fonctionnalités avancées de SABLIN PHARMA pour un prix unique.
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-brand-dark">500</span>
                <span className="text-sm font-semibold text-muted-foreground">FCFA / mois</span>
              </div>
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {[
                  "Recherches illimitées et sans publicité",
                  "Estimations d'ordonnance illimitées",
                  "Alertes pharmacies de garde en temps réel",
                  "Priorité sur l'assistance WhatsApp",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-amber-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:opacity-90"
                size="lg"
                onClick={() => navigate("subscription")}
              >
                <Crown className="size-4" /> S&apos;abonner maintenant
              </Button>
            </div>
          </Card>
        </section>

        {/* POPULAR MEDICATIONS */}
        <section>
          <SectionHeader
            title="Médicaments les plus recherchés"
            subtitle="Disponibles dans les pharmacies partenaires"
            icon={<Plus className="size-5" />}
            action={{ label: "Voir tout", onClick: () => navigate("medications") }}
          />
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
              : popularMeds.map((m) => <MedicationCard key={m.id} med={m} />)}
          </div>
        </section>

        {/* INFO TABLE — recently searched */}
        <section>
          <Card className="overflow-hidden border-border/60 py-0">
            <div className="border-b border-border/60 bg-brand-light/40 px-5 py-4">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-brand" />
                <h3 className="text-base font-bold text-foreground">Médicaments récemment consultés</h3>
              </div>
            </div>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Médicament</th>
                    <th className="px-5 py-3 font-semibold">Dosage</th>
                    <th className="px-5 py-3 font-semibold">Prix moyen</th>
                    <th className="px-5 py-3 font-semibold">Pharmacies</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-3"><Skeleton className="h-6 w-full" /></td>
                      </tr>
                    ))
                  ) : (
                    popularMeds.slice(0, 6).map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => navigate("medication-detail", { slug: m.slug })}
                        className="cursor-pointer transition-colors hover:bg-accent/40"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{m.name}</span>
                            {m.requiresRx && (
                              <ShieldAlert className="size-3.5 text-amber-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{m.genericName}</span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{m.dosage}</td>
                        <td className="px-5 py-3 font-bold text-brand-dark">{formatFCFA(m.avgPrice)}</td>
                        <td className="px-5 py-3 text-muted-foreground">{m.pharmacyCount} dispo</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                            <CheckCircle2 className="size-3" /> Disponible
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* ASSISTANCE BANNER */}
        <section>
          <Card className="flex flex-col items-center gap-4 border-brand/20 bg-brand-gradient py-8 text-center text-white sm:flex-row sm:text-left">
            <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
              <h3 className="text-xl font-extrabold">Besoin d&apos;aide ou d&apos;un conseil ?</h3>
              <p className="max-w-lg text-sm text-white/85">
                Notre équipe d&apos;assistance est disponible 24h/24 pour vous orienter vers la pharmacie la plus proche ou vous aider dans votre recherche.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" size="lg" asChild>
                <a href="tel:+2250700000000">Appeler l&apos;assistance</a>
              </Button>
              <Button className="bg-white text-brand-dark hover:bg-white/90" size="lg" onClick={() => navigate("pharmacies", { filter: "on-duty" })}>
                Voir les pharmacies de garde <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
