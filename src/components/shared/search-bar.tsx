"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { Medication } from "@/lib/types";

interface SearchBarProps {
  variant?: "hero" | "compact";
  initialQuery?: string;
  placeholder?: string;
}

const POPULAR = ["Paracétamol", "Amoxicilline", "Vitamine C", "Ibuprofène", "Coartem"];

export function SearchBar({ variant = "compact", initialQuery = "", placeholder }: SearchBarProps) {
  const { navigate } = useNav();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/medications?q=${encodeURIComponent(query)}&limit=6`);
        if (res.ok) setSuggestions(await res.json());
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = (q?: string) => {
    const term = (q ?? query).trim();
    navigate("medications", { query: term });
    setOpen(false);
  };

  const pick = (med: Medication) => {
    navigate("medication-detail", { slug: med.slug });
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border bg-background shadow-premium transition-all",
          variant === "hero"
            ? "h-14 px-4 border-border/80 focus-within:border-brand/50 focus-within:shadow-premium-lg"
            : "h-12 px-3.5 border-border"
        )}
      >
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder ?? "Rechercher un médicament (ex : Paracétamol)..."}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          aria-label="Rechercher un médicament"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="size-4" />
          </button>
        )}
        <Button
          size={variant === "hero" ? "lg" : "default"}
          className={cn(
            "shrink-0 bg-brand text-white hover:bg-brand-dark",
            variant === "hero" && "h-12 px-5"
          )}
          onClick={() => submit()}
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Rechercher</span>
        </Button>
      </div>

      {open && (query.trim().length >= 2 || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-popover shadow-premium-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Recherche...</div>
          )}
          {!loading && suggestions.length > 0 && (
            <ul className="max-h-80 overflow-y-auto scroll-thin py-1.5">
              {suggestions.map((med) => (
                <li key={med.id}>
                  <button
                    onClick={() => pick(med)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                      <Search className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {med.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {med.form} · {med.dosage} · {med.pharmacyCount} pharmacies
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && query.trim().length >= 2 && suggestions.length === 0 && (
            <div className="px-4 py-4 text-sm">
              <p className="text-muted-foreground">Aucun résultat pour « {query} ».</p>
              <button
                onClick={() => submit()}
                className="mt-1 text-sm font-semibold text-brand hover:underline"
              >
                Voir tous les médicaments →
              </button>
            </div>
          )}
          {query.trim().length < 2 && (
            <div className="px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recherches populaires
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    onClick={() => submit(p)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
