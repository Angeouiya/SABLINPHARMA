import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SABLIN PHARMA — Médicaments & Pharmacies en Côte d'Ivoire",
  description:
    "Recherchez vos médicaments, trouvez les pharmacies ouvertes et de garde à Abidjan, estimez le coût de votre ordonnance. La plateforme d'information santé n°1 en Côte d'Ivoire.",
  keywords: [
    "pharmacie",
    "médicament",
    "Abidjan",
    "Côte d'Ivoire",
    "pharmacie de garde",
    "ordonnance",
    "SABLIN PHARMA",
  ],
  authors: [{ name: "SABLIN PHARMA" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "SABLIN PHARMA — Santé & Pharmacie en Côte d'Ivoire",
    description:
      "Trouvez vos médicaments et pharmacies à Abidjan.",
    siteName: "SABLIN PHARMA",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f8a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
