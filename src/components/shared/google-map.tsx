"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleMapProps {
  /** Latitude du point central */
  lat: number;
  /** Longitude du point central */
  lng: number;
  /** Zoom de la carte (1-20), défaut 15 */
  zoom?: number;
  /** Hauteur du conteneur, défaut h-64 */
  className?: string;
  /** Libellé du marqueur (nom du lieu) */
  label?: string;
  /** Afficher le bouton "Ouvrir dans Google Maps" */
  showButton?: boolean;
  /** Titre affiché au-dessus de la carte */
  title?: string;
}

/**
 * Composant GoogleMap — carte Google Maps intégrée via iframe (sans clé API).
 * Utilise le format d'embed gratuit : https://www.google.com/maps?q=LAT,LNG&z=ZOOM&output=embed
 */
export function GoogleMap({
  lat,
  lng,
  zoom = 15,
  className,
  label,
  showButton = true,
  title,
}: GoogleMapProps) {
  // Use coordinates directly for the embed URL (most reliable format)
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  const linkUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className={cn("overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      )}
      <iframe
        src={embedUrl}
        className="w-full border-0"
        style={{ height: title ? "calc(100% - 41px)" : "100%", minHeight: "200px" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        title={title || "Carte Google Maps"}
      />
      {showButton && (
        <div className="border-t border-border/60 p-2.5">
          <Button size="sm" variant="outline" className="w-full" asChild>
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Ouvrir dans Google Maps
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
