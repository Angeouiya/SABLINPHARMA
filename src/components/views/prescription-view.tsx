"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ClipboardList,
  Plus,
  Minus,
  Search,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Crown,
  ShieldAlert,
  Pill,
  MapPin,
  X,
  Loader2,
  Calculator,
  Save,
  RotateCcw,
  ArrowRight,
  Info,
  AlertTriangle,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/category-icons";
import { AlertMessage } from "@/components/shared/alert-message";
import { EmptyState } from "@/components/shared/empty-state";
import { Heading, Eyebrow, Muted, Price, PriceRange } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Medication } from "@/lib/types";

const FORMS = [
  "Comprimé",
  "Comprimé effervescent",
  "Gélule",
  "Sirop",
  "Sachet",
  "Pommade",
  "Crème",
  "Flacon",
  "Suppositoire",
  "Inhalateur",
  "Injectable",
];

interface CartItem {
  slug: string;
  name: string;
  genericName: string;
  form: string;
  dosage: string;
  quantity: number;
  duration: string;
  note: string;
  avgPrice: number;
  pharmacyCount: number;
  requiresRx: boolean;
  category?: { iconName: string; color: string; name: string } | null;
}

interface EstimateLine {
  medication: {
    id: string;
    name: string;
    slug: string;
    form: string;
    dosage: string;
    packSize: string;
    requiresRx: boolean;
  };
  quantity: number;
  unitMin: number;
  unitMax: number;
  lineMin: number;
  lineMax: number;
  pharmacyCount: number;
}

interface EstimateResult {
  lines: EstimateLine[];
  totalMin: number;
  totalMax: number;
  availablePharmacies: number;
}

// Deterministic status for cart items
function itemStatus(item: CartItem): "available" | "low-stock" | "to-confirm" | "out-of-stock" {
  if (item.pharmacyCount === 0) return "out-of-stock";
  const hash = item.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pct = hash % 10;
  if (pct < 6) return "available";
  if (pct < 9) return "low-stock";
  return "to-confirm";
}

const STATUS_CONFIG = {
  available: { label: "Disponible", icon: CheckCircle2, className: "bg-success-light text-success" },
  "low-stock": { label: "Stock faible", icon: AlertTriangle, className: "bg-warning-light text-warning-foreground" },
  "to-confirm": { label: "À confirmer", icon: HelpCircle, className: "bg-neutral-light text-neutral-foreground" },
  "out-of-stock": { label: "Rupture", icon: XCircle, className: "bg-danger-light text-danger" },
} as const;

export function PrescriptionView() {
  const { navigate } = useNav();
  const { user, premium } = useAuth();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formDci, setFormDci] = useState("");
  const [formDosage, setFormDosage] = useState("");
  const [formForm, setFormForm] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formDuration, setFormDuration] = useState("");
  const [formNote, setFormNote] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  // Cart
  const [items, setItems] = useState<CartItem[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const url = `/api/medications?q=${encodeURIComponent(query.trim())}&limit=6`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data: Medication[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormDci("");
    setFormDosage("");
    setFormForm("");
    setFormQty("1");
    setFormDuration("");
    setFormNote("");
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setEditingSlug(null);
    setSelectedMed(null);
  }, []);

  const pickSuggestion = (med: Medication) => {
    setSelectedMed(med);
    setFormName(med.name);
    setFormDci(med.genericName);
    setFormDosage(med.dosage);
    setFormForm(med.form);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Veuillez saisir le nom du médicament.");
      return;
    }
    const qty = Math.max(1, parseInt(formQty || "1", 10) || 1);

    // Find matching med in suggestions for richer data
    const matched = selectedMed ?? suggestions.find(
      (s) => s.name.toLowerCase() === formName.toLowerCase()
    );

    const item: CartItem = {
      slug: matched?.slug ?? `custom-${Date.now()}`,
      name: formName.trim(),
      genericName: formDci.trim() || matched?.genericName || "—",
      form: formForm || matched?.form || "Comprimé",
      dosage: formDosage.trim() || matched?.dosage || "—",
      quantity: qty,
      duration: formDuration.trim(),
      note: formNote.trim(),
      avgPrice: matched?.avgPrice ?? 0,
      pharmacyCount: matched?.pharmacyCount ?? 0,
      requiresRx: matched?.requiresRx ?? false,
      category: matched?.category
        ? {
            iconName: matched.category.iconName,
            color: matched.category.color,
            name: matched.category.name,
          }
        : null,
    };

    if (editingSlug) {
      setItems((prev) =>
        prev.map((it) => (it.slug === editingSlug ? item : it))
      );
      toast.success("Médicament modifié.");
    } else {
      setItems((prev) => {
        if (prev.some((it) => it.name.toLowerCase() === item.name.toLowerCase())) {
          toast.info(`${item.name} est déjà dans votre ordonnance.`);
          return prev;
        }
        return [...prev, item];
      });
      toast.success(`${item.name} ajouté à l'ordonnance.`);
    }

    resetForm();
    setShowForm(false);
    setEstimate(null);
  };

  const removeItem = (slug: string) => {
    setItems((prev) => prev.filter((it) => it.slug !== slug));
    setEstimate(null);
    toast.success("Médicament retiré.");
  };

  const editItem = (item: CartItem) => {
    setEditingSlug(item.slug);
    setFormName(item.name);
    setFormDci(item.genericName);
    setFormDosage(item.dosage);
    setFormForm(item.form);
    setFormQty(String(item.quantity));
    setFormDuration(item.duration);
    setFormNote(item.note);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateQty = (slug: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.slug === slug ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
      )
    );
    setEstimate(null);
  };

  // Recalcul
  const stats = useMemo(() => {
    const total = items.length;
    const totalUnits = items.reduce((s, it) => s + it.quantity, 0);
    const totalCost = items.reduce((s, it) => s + it.avgPrice * it.quantity, 0);
    const available = items.filter((i) => itemStatus(i) === "available").length;
    const lowStock = items.filter((i) => itemStatus(i) === "low-stock").length;
    const toConfirm = items.filter((i) => itemStatus(i) === "to-confirm").length;
    const outStock = items.filter((i) => itemStatus(i) === "out-of-stock").length;
    return { total, totalUnits, totalCost, available, lowStock, toConfirm, outStock };
  }, [items]);

  const handleEstimate = async () => {
    if (items.length === 0) {
      toast.error("Ajoutez au moins un médicament à votre ordonnance.");
      return;
    }
    // Only estimate items with a real slug (matched from DB)
    const estimable = items.filter((it) => !it.slug.startsWith("custom-"));
    if (estimable.length === 0) {
      toast.info("Aucun médicamenent référencé à estimer.");
      return;
    }
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await fetch("/api/prescription/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: estimable.map((it) => ({ slug: it.slug, quantity: it.quantity })),
        }),
      });
      if (!res.ok) throw new Error();
      const data: EstimateResult = await res.json();
      setEstimate(data);
      toast.success("Estimation calculée avec succès.");
    } catch {
      toast.error("Erreur lors de l'estimation.");
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = () => {
    if (items.length === 0) {
      toast.error("Votre ordonnance est vide.");
      return;
    }
    if (!user) {
      toast.info("Connectez-vous pour enregistrer votre ordonnance.");
      navigate("auth", { authMode: "login" });
      return;
    }
    // Persist to localStorage as a simple save
    try {
      const saved = JSON.parse(localStorage.getItem("sablin-prescriptions") || "[]");
      saved.push({
        id: `rx-${Date.now()}`,
        date: new Date().toISOString(),
        items: items.map((it) => ({
          name: it.name,
          form: it.form,
          dosage: it.dosage,
          quantity: it.quantity,
          duration: it.duration,
        })),
        totalCost: stats.totalCost,
      });
      localStorage.setItem("sablin-prescriptions", JSON.stringify(saved));
      toast.success("Ordonnance enregistrée dans votre profil.", {
        description: "Retrouvez-la dans la section Historique.",
      });
    } catch {
      toast.error("Impossible d'enregistrer l'ordonnance.");
    }
  };

  const handleNew = () => {
    if (items.length > 0) {
      if (!window.confirm("Voulez-vous vraiment recommencer ? Votre ordonnance actuelle sera effacée.")) return;
    }
    setItems([]);
    setEstimate(null);
    resetForm();
    setShowForm(false);
    toast.success("Nouvelle ordonnance prête.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* ============ INTRO ============ */}
      <Card className="overflow-hidden border-brand/20 py-0 shadow-premium">
        <div className="relative bg-brand-gradient">
          <div className="absolute inset-0 bg-dotted-white opacity-15" />
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <ClipboardList className="size-7 text-white" />
              </span>
              <div className="text-white">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  Estimez votre ordonnance
                </h1>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/85">
                  Ajoutez les médicaments prescrits, précisez les dosages et quantités, puis
                  obtenez une estimation claire du coût total avant de vous rendre en pharmacie.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="shrink-0 bg-white text-brand-dark hover:bg-white/90"
              onClick={() => {
                if (showForm) {
                  resetForm();
                  setShowForm(false);
                } else {
                  setShowForm(true);
                  setTimeout(() => document.getElementById("rx-name")?.focus(), 100);
                }
              }}
            >
              {showForm ? (
                <>
                  <X className="size-4" /> Fermer
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Ajouter un médicament
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT: Form + list */}
        <div className="space-y-6">
          {/* Form */}
          {showForm && (
            <Card className="border-border/70 p-5 shadow-premium animate-fade-up">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Plus className="size-4" />
                </span>
                <h2 className="text-base font-bold text-foreground">
                  {editingSlug ? "Modifier le médicament" : "Ajouter un médicament"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name with autocomplete */}
                <div ref={searchBoxRef} className="relative">
                  <Label htmlFor="rx-name">Nom du médicament *</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="rx-name"
                      value={query || formName}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setFormName(e.target.value);
                      }}
                      onFocus={() => query && setShowSuggestions(true)}
                      placeholder="Ex : Paracétamol, Amoxicilline, Doliprane…"
                      className="h-11 pl-10"
                      autoComplete="off"
                    />
                    {loadingSuggestions && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand" />
                    )}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-premium-lg">
                      <ul className="max-h-60 overflow-y-auto scroll-thin py-1">
                        {suggestions.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => pickSuggestion(s)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent"
                            >
                              <span
                                className="flex size-8 items-center justify-center rounded-lg"
                                style={{
                                  backgroundColor: s.category ? `${s.category.color}14` : undefined,
                                }}
                              >
                                {s.category ? (
                                  <CategoryIcon
                                    name={s.category.iconName}
                                    size={16}
                                    color={s.category.color}
                                  />
                                ) : (
                                  <Pill className="size-4 text-brand" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">
                                  {s.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {s.form} {s.dosage} · {formatFCFA(s.avgPrice)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* DCI + Dosage */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="rx-dci">DCI (principe actif)</Label>
                    <Input
                      id="rx-dci"
                      value={formDci}
                      onChange={(e) => setFormDci(e.target.value)}
                      placeholder="Ex : Paracétamol"
                      className="mt-1.5 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rx-dosage">Dosage</Label>
                    <Input
                      id="rx-dosage"
                      value={formDosage}
                      onChange={(e) => setFormDosage(e.target.value)}
                      placeholder="Ex : 500 mg"
                      className="mt-1.5 h-11"
                    />
                  </div>
                </div>

                {/* Form + Qty */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="rx-form">Forme</Label>
                    <Select value={formForm} onValueChange={setFormForm}>
                      <SelectTrigger id="rx-form" className="mt-1.5 h-11">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rx-qty">Quantité *</Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0"
                        onClick={() =>
                          setFormQty((q) => String(Math.max(1, parseInt(q || "1", 10) - 1)))
                        }
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Input
                        id="rx-qty"
                        type="number"
                        min="1"
                        value={formQty}
                        onChange={(e) => setFormQty(e.target.value)}
                        className="h-11 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 shrink-0"
                        onClick={() =>
                          setFormQty((q) => String(parseInt(q || "1", 10) + 1))
                        }
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="rx-duration">Durée du traitement</Label>
                  <Input
                    id="rx-duration"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="Ex : 7 jours, 2 semaines…"
                    className="mt-1.5 h-11"
                  />
                </div>

                {/* Note */}
                <div>
                  <Label htmlFor="rx-note">Remarque (optionnel)</Label>
                  <Textarea
                    id="rx-note"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Ex : À prendre après les repas, 2 comprimés matin et soir…"
                    className="mt-1.5 min-h-[70px]"
                    rows={2}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" className="bg-brand-gradient text-white hover:opacity-90">
                    <Plus className="size-4" />
                    {editingSlug ? "Modifier" : "Ajouter à l'ordonnance"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Items list */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <Eyebrow>Votre liste</Eyebrow>
                <Heading level="h3">
                  Médicaments de l&apos;ordonnance{" "}
                  {items.length > 0 && (
                    <span className="ml-1 text-base font-bold text-brand">({items.length})</span>
                  )}
                </Heading>
              </div>
              {items.length > 0 && (
                <Button size="sm" variant="ghost" onClick={handleNew} className="text-muted-foreground">
                  <RotateCcw className="size-3.5" /> Tout effacer
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Aucun médicament ajouté"
                description="Cliquez sur « Ajouter un médicament » pour commencer à constituer votre ordonnance. Vous pourrez ensuite estimer le coût total."
                action={{
                  label: "Ajouter un médicament",
                  onClick: () => {
                    setShowForm(true);
                    setTimeout(() => document.getElementById("rx-name")?.focus(), 100);
                  },
                }}
              />
            ) : (
              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const status = itemStatus(item);
                  const sc = STATUS_CONFIG[status];
                  const StatusIcon = sc.icon;
                  return (
                    <Card
                      key={item.slug}
                      className="border-border/60 py-0 transition-all hover:border-brand/30 hover:shadow-premium"
                    >
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        {/* Icon + index */}
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-light text-xs font-bold text-brand">
                            {idx + 1}
                          </span>
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: item.category
                                ? `${item.category.color}14`
                                : "var(--brand-light)",
                            }}
                          >
                            {item.category ? (
                              <CategoryIcon
                                name={item.category.iconName}
                                size={20}
                                color={item.category.color}
                              />
                            ) : (
                              <Pill className="size-5 text-brand" />
                            )}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                            {item.requiresRx && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-50 px-1.5 py-0 text-[9px] font-semibold text-amber-700"
                              >
                                <ShieldAlert className="size-2.5" /> Rx
                              </Badge>
                            )}
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                sc.className
                              )}
                            >
                              <StatusIcon className="size-2.5" /> {sc.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.genericName} · {item.form} {item.dosage}
                            {item.duration && ` · ${item.duration}`}
                          </p>
                          {item.note && (
                            <p className="mt-0.5 truncate text-[11px] italic text-muted-foreground/80">
                              « {item.note} »
                            </p>
                          )}
                        </div>

                        {/* Qty stepper */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-8"
                            onClick={() => updateQty(item.slug, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-8"
                            onClick={() => updateQty(item.slug, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="shrink-0 text-right">
                          {item.avgPrice > 0 ? (
                            <Price
                              amount={item.avgPrice * item.quantity}
                              size="md"
                              variant="brand"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Prix à confirmer</span>
                          )}
                          {item.avgPrice > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {item.pharmacyCount} pharmacies
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-brand"
                            onClick={() => editItem(item)}
                            aria-label="Modifier"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-red-600"
                            onClick={() => removeItem(item.slug)}
                            aria-label="Supprimer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT: Recap */}
        <div className="space-y-4">
          {/* Summary card (sticky) */}
          <Card className="sticky top-24 border-border/70 p-5 shadow-premium">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Calculator className="size-4" />
              </span>
              <h3 className="text-base font-bold text-foreground">Récapitulatif</h3>
            </div>

            {/* Stats grid */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatBox label="Médicaments" value={stats.total} tone="brand" />
              <StatBox label="Unités" value={stats.totalUnits} tone="neutral" />
              <StatBox label="Disponibles" value={stats.available} tone="success" />
              <StatBox label="Stock faible" value={stats.lowStock} tone="warning" />
              <StatBox label="À confirmer" value={stats.toConfirm} tone="info" />
              <StatBox label="Rupture" value={stats.outStock} tone="danger" />
            </div>

            {/* Total cost */}
            <div className="mt-4 rounded-xl bg-brand-light/50 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand">
                Coût estimatif total
              </p>
              {estimate ? (
                <PriceRange
                  min={estimate.totalMin}
                  max={estimate.totalMax}
                  size="xl"
                  variant="brand"
                  className="mt-1 block"
                />
              ) : stats.totalCost > 0 ? (
                <p className="mt-1 text-3xl font-extrabold text-brand-dark">
                  {formatFCFA(stats.totalCost)}
                </p>
              ) : (
                <p className="mt-1 text-2xl font-extrabold text-muted-foreground">— FCFA</p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Basé sur les prix indicatifs moyens
              </p>
            </div>

            {/* Estimate button */}
            <Button
              className="mt-4 w-full bg-brand-gradient text-white hover:opacity-90"
              onClick={handleEstimate}
              disabled={estimating || items.length === 0}
            >
              {estimating ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Calcul…
                </>
              ) : (
                <>
                  <Calculator className="size-4" /> Estimer le coût
                </>
              )}
            </Button>

            {/* Estimate result detail */}
            {estimate && (
              <div className="mt-3 space-y-1.5 rounded-lg border border-brand/20 bg-background p-3 animate-fade-up">
                <p className="text-xs font-bold text-foreground">Détail de l&apos;estimation</p>
                {estimate.lines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate text-muted-foreground">
                      {line.medication.name} ×{line.quantity}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatFCFA(line.lineMin)} — {formatFCFA(line.lineMax)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Save + New */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="size-3.5" /> Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={handleNew}>
                <RotateCcw className="size-3.5" /> Nouvelle
              </Button>
            </div>
          </Card>

          {/* Premium upsell */}
          {!premium && (
            <Card className="overflow-hidden border-amber-500/30 py-0">
              <div className="bg-gradient-to-br from-amber-50 to-background p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                    <Crown className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Passez Premium</p>
                    <p className="text-[11px] text-muted-foreground">500 FCFA / mois</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-foreground/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-amber-500" /> Estimations illimitées
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-amber-500" /> Ordonnances sauvegardées
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-amber-500" /> Alertes de disponibilité
                  </li>
                </ul>
                <Button
                  size="sm"
                  className="mt-3 w-full bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:opacity-90"
                  onClick={() => navigate("subscription")}
                >
                  <Crown className="size-3.5" /> S&apos;abonner
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ============ TROUVER UNE PHARMACIE ============ */}
      {items.length > 0 && (
        <section className="mt-8">
          <Card className="overflow-hidden border-brand/20 py-0">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand">
                  <Store className="size-6" />
                </span>
                <div>
                  <Heading level="h3">Trouver une pharmacie</Heading>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Voir les pharmacies pouvant fournir toute l&apos;ordonnance ou une partie
                    des médicaments à Abidjan.
                  </p>
                </div>
              </div>
              <Button
                className="shrink-0 bg-brand-gradient text-white hover:opacity-90"
                onClick={() => navigate("pharmacies")}
              >
                Voir les résultats <ArrowRight className="size-4" />
              </Button>
            </div>
            {estimate && (
              <div className="border-t border-border/50 bg-brand-light/30 px-5 py-3 sm:px-6">
                <p className="text-sm text-foreground">
                  <span className="font-bold text-brand-dark">
                    {estimate.availablePharmacies}
                  </span>{" "}
                  pharmacie{estimate.availablePharmacies > 1 ? "s" : ""} peuve
                  {estimate.availablePharmacies > 1 ? "nt" : ""} fournir tous vos médicaments.
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* ============ PRUDENCE ============ */}
      <div className="mt-6">
        <AlertMessage variant="warning" icon={Info}>
          Cette estimation est indicative. Vérifiez toujours les disponibilités et demandez
          conseil à un pharmacien ou professionnel de santé avant tout déplacement.
        </AlertMessage>
      </div>
    </div>
  );
}

/* ============================================================
   StatBox — petite statistique colorée
   ============================================================ */
function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const tones = {
    brand: "bg-brand-light text-brand-dark",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning-foreground",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
    neutral: "bg-neutral-light text-neutral-foreground",
  };
  return (
    <div className={cn("rounded-lg px-3 py-2 text-center", tones[tone])}>
      <p className="text-xl font-extrabold leading-none tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold leading-tight">{label}</p>
    </div>
  );
}
