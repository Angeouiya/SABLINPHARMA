import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();
const TABLES = [
  "AuditLog",
  "SecurityNotification",
  "PasswordResetToken",
  "ProfessionalSessionRecord",
  "ProfessionalInvitation",
  "ProfessionalPharmacyMembership",
  "ProfessionalAccount",
  "ProfessionalSetting",
  "ProfessionalActionLog",
  "RequestRefund",
  "RequestDispute",
  "RequestStatusHistory",
  "ContactUnlock",
  "PharmacyRequestResponse",
  "PharmacyRequest",
  "InventoryConflict",
  "ProductMapping",
  "InventorySyncRow",
  "InventorySyncJob",
  "InventoryConnection",
  "EnrichmentProviderConfig",
  "EnrichmentCandidate",
  "EnrichmentJob",
  "InventoryImportRow",
  "MedicationDescription",
  "MedicationImage",
  "MedicationAlias",
  "MedicationAddRequest",
  "PharmacyImport",
  "PharmacyMedication",
  "PharmacyMedia",
  "PassOrdonnance",
  "CreditTransaction",
  "UserSettings",
  "Favorite",
  "SearchHistory",
  "Notification",
  "Payment",
  "Subscription",
  "Pharmacy",
  "Medication",
  "Category",
  "User",
] as const;

type MedSeed = {
  name: string;
  genericName: string;
  form: string;
  dosage: string;
  packSize: string;
  description: string;
  avgPrice: number;
  requiresRx: boolean;
  categorySlug: string;
  imageUrl?: string;
};

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  iconName: string;
  color: string;
};

type PharmacySeed = {
  name: string;
  slug: string;
  address: string;
  commune: string;
  phone: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  isOpen247: boolean;
  isOnDuty: boolean;
  latitude: number;
  longitude: number;
  rating: number;
  imageUrl?: string;
};

const categories: CategorySeed[] = [
  { name: "Douleur & Fièvre", slug: "douleur-fievre", description: "Antalgiques et antipyrétiques", iconName: "Thermometer", color: "#ef4444" },
  { name: "Antibiotiques", slug: "antibiotiques", description: "Traitements antibactériens sur ordonnance", iconName: "ShieldCheck", color: "#0d9488" },
  { name: "Vitamines & Compléments", slug: "vitamines", description: "Compléments et tonifiants", iconName: "Pill", color: "#f59e0b" },
  { name: "Cardiovasculaire", slug: "cardiovasculaire", description: "Tension, cœur et circulation", iconName: "HeartPulse", color: "#e11d48" },
  { name: "Digestif", slug: "digestif", description: "Estomac, intestin et transit", iconName: "Droplet", color: "#d97706" },
  { name: "Voies Respiratoires", slug: "respiratoire", description: "Toux, rhume et allergies", iconName: "Wind", color: "#0284c7" },
  { name: "Dermatologie", slug: "dermatologie", description: "Peau, cicatrisation et soins", iconName: "Hand", color: "#9333ea" },
  { name: "Mère & Enfant", slug: "mere-enfant", description: "Soins pédiatriques et maternité", iconName: "Baby", color: "#ec4899" },
  { name: "Hygiène & Soins", slug: "hygiene", description: "Premiers soins et hygiène", iconName: "Droplets", color: "#06b6d4" },
  { name: "Antipaludéens", slug: "antipaludeens", description: "Traitement et prévention du paludisme", iconName: "ShieldPlus", color: "#16a34a" },
];

const medications: MedSeed[] = [
  // Douleur & Fièvre
  { name: "Paracétamol", genericName: "Paracétamol", form: "Comprimé", dosage: "500 mg", packSize: "Boîte de 20", description: "Antalgique et antipyrétique pour soulager les douleurs légères à modérées et faire baisser la fièvre.", avgPrice: 150, requiresRx: false, categorySlug: "douleur-fievre" },
  { name: "Paracétamol Sirop", genericName: "Paracétamol", form: "Sirop", dosage: "125 mg/5 mL", packSize: "Flacon 100 mL", description: "Sirop antipyrétique adapté aux enfants pour la fièvre et les douleurs.", avgPrice: 850, requiresRx: false, categorySlug: "douleur-fievre" },
  { name: "Ibuprofène", genericName: "Ibuprofène", form: "Comprimé", dosage: "400 mg", packSize: "Boîte de 20", description: "Anti-inflammatoire non stéroïdien pour douleurs articulaires et fièvre.", avgPrice: 500, requiresRx: false, categorySlug: "douleur-fievre" },
  { name: "Aspirine", genericName: "Acide acétylsalicylique", form: "Comprimé", dosage: "500 mg", packSize: "Boîte de 20", description: "Antalgique, antipyrétique et anti-inflammatoire classique.", avgPrice: 300, requiresRx: false, categorySlug: "douleur-fievre" },
  { name: "Efferalgan", genericName: "Paracétamol effervescent", form: "Comprimé effervescent", dosage: "500 mg", packSize: "Tube de 16", description: "Paracétamol effervescent à action rapide contre la douleur et la fièvre.", avgPrice: 700, requiresRx: false, categorySlug: "douleur-fievre" },

  // Antibiotiques
  { name: "Amoxicilline", genericName: "Amoxicilline", form: "Gélule", dosage: "500 mg", packSize: "Boîte de 12", description: "Antibiotique à large spectre de la famille des pénicillines, sur ordonnance.", avgPrice: 1200, requiresRx: true, categorySlug: "antibiotiques" },
  { name: "Amoxicilline Sirop", genericName: "Amoxicilline", form: "Sirop", dosage: "250 mg/5 mL", packSize: "Flacon 60 mL", description: "Antibiotique en sirop pour enfants, sur ordonnance médicale.", avgPrice: 2500, requiresRx: true, categorySlug: "antibiotiques" },
  { name: "Cotrimoxazole", genericName: "Sulfaméthoxazole / Triméthoprime", form: "Comprimé", dosage: "400/80 mg", packSize: "Boîte de 20", description: "Antibiotique synergique pour infections urinaires et respiratoires.", avgPrice: 900, requiresRx: true, categorySlug: "antibiotiques" },
  { name: "Métronidazole", genericName: "Métronidazole", form: "Comprimé", dosage: "250 mg", packSize: "Boîte de 20", description: "Antibactérien et antiparasitaire pour infections digestives.", avgPrice: 600, requiresRx: true, categorySlug: "antibiotiques" },
  { name: "Augmentin", genericName: "Amoxicilline / Acide clavulanique", form: "Comprimé", dosage: "1 g", packSize: "Boîte de 12", description: "Antibiotique puissant à large spectre, sur ordonnance.", avgPrice: 4500, requiresRx: true, categorySlug: "antibiotiques" },

  // Vitamines
  { name: "Vitamine C", genericName: "Acide ascorbique", form: "Comprimé", dosage: "500 mg", packSize: "Tube de 30", description: "Complément vitaminé pour soutenir l'immunité au quotidien.", avgPrice: 1500, requiresRx: false, categorySlug: "vitamines" },
  { name: "Vitamine C 1000", genericName: "Acide ascorbique", form: "Comprimé effervescent", dosage: "1000 mg", packSize: "Tube de 20", description: "Vitamine C haute dose effervescente pour la vitalité.", avgPrice: 2500, requiresRx: false, categorySlug: "vitamines" },
  { name: "Supradyn", genericName: "Multivitamines", form: "Comprimé effervescent", dosage: "Multivitaminé", packSize: "Tube de 30", description: "Complexe multivitaminé et minéraux pour l'énergie.", avgPrice: 3500, requiresRx: false, categorySlug: "vitamines" },
  { name: "Fer + Acide folique", genericName: "Fer / Acide folique", form: "Comprimé", dosage: "Fer 65 mg", packSize: "Boîte de 30", description: "Complément en fer recommandé en cas d'anémie et durant la grossesse.", avgPrice: 1200, requiresRx: false, categorySlug: "vitamines" },

  // Cardiovasculaire
  { name: "Amlodipine", genericName: "Amlodipine", form: "Comprimé", dosage: "5 mg", packSize: "Boîte de 30", description: "Inhibiteur calcique pour l'hypertension artérielle.", avgPrice: 2000, requiresRx: true, categorySlug: "cardiovasculaire" },
  { name: "Lisinopril", genericName: "Lisinopril", form: "Comprimé", dosage: "10 mg", packSize: "Boîte de 30", description: "IEC pour le traitement de l'hypertension.", avgPrice: 1800, requiresRx: true, categorySlug: "cardiovasculaire" },
  { name: "Aspégic", genericName: "Acide acétylsalicylique", form: "Sachet", dosage: "100 mg", packSize: "Boîte de 30", description: "Faible dose d'aspirine pour la prévention cardiovasculaire.", avgPrice: 1500, requiresRx: true, categorySlug: "cardiovasculaire" },

  // Digestif
  { name: "Oméprazole", genericName: "Oméprazole", form: "Gélule", dosage: "20 mg", packSize: "Boîte de 14", description: "Inhibiteur de la pompe à protons contre les brûlures d'estomac.", avgPrice: 1800, requiresRx: false, categorySlug: "digestif" },
  { name: "Smecta", genericName: "Diosmectite", form: "Sachet", dosage: "3 g", packSize: "Boîte de 30", description: "Antidiarrhéique qui protège la muqueuse intestinale.", avgPrice: 1500, requiresRx: false, categorySlug: "digestif" },
  { name: "Métoclopramide", genericName: "Métoclopramide", form: "Comprimé", dosage: "10 mg", packSize: "Boîte de 20", description: "Antinaupathique et antiémétique sur ordonnance.", avgPrice: 800, requiresRx: true, categorySlug: "digestif" },

  // Respiratoire
  { name: "Loratadine", genericName: "Loratadine", form: "Comprimé", dosage: "10 mg", packSize: "Boîte de 10", description: "Antihistaminique non sédatif contre les allergies.", avgPrice: 1000, requiresRx: false, categorySlug: "respiratoire" },
  { name: "Salbutamol", genericName: "Salbutamol", form: "Inhalateur", dosage: "100 µg/dose", packSize: "Flacon 200 doses", description: "Bronchodilatateur pour l'asthme, sur ordonnance.", avgPrice: 3500, requiresRx: true, categorySlug: "respiratoire" },
  { name: "Toplexil", genericName: "Oxomémazine", form: "Sirop", dosage: "0,33 mg/mL", packSize: "Flacon 150 mL", description: "Sirop antitussif calmant contre la toux sèche.", avgPrice: 1200, requiresRx: false, categorySlug: "respiratoire" },

  // Dermatologie
  { name: "Pommade Cicatrisante", genericName: "Pommade cicatrisante", form: "Pommade", dosage: "Usage externe", packSize: "Tube 30 g", description: "Pommade favorisant la cicatrisation des petites plaies.", avgPrice: 1500, requiresRx: false, categorySlug: "dermatologie" },
  { name: "Hydrocortisone Crème", genericName: "Hydrocortisone", form: "Crème", dosage: "1 %", packSize: "Tube 15 g", description: "Crème anti-inflammatoire cutanée sur ordonnance.", avgPrice: 1200, requiresRx: true, categorySlug: "dermatologie" },

  // Mère & Enfant
  { name: "Sirop Antitussif Enfant", genericName: "Sirop antitussif pédiatrique", form: "Sirop", dosage: "Pédiatrique", packSize: "Flacon 100 mL", description: "Sirop calmant pour la toux de l'enfant.", avgPrice: 1000, requiresRx: false, categorySlug: "mere-enfant" },
  { name: "Sérophyt Sirop", genericName: "Sirop tonique", form: "Sirop", dosage: "Tonique", packSize: "Flacon 125 mL", description: "Sirop tonifiant pour enfant en période de croissance.", avgPrice: 1300, requiresRx: false, categorySlug: "mere-enfant" },

  // Hygiène
  { name: "Sérum Physiologique", genericName: "Chlorure de sodium 0,9 %", form: "Flacon", dosage: "0,9 %", packSize: "Flacon 500 mL", description: "Solution saline pour nettoyage et rinçage.", avgPrice: 500, requiresRx: false, categorySlug: "hygiene" },
  { name: "Alcool à 70°", genericName: "Éthanol 70°", form: "Flacon", dosage: "70°", packSize: "Flacon 500 mL", description: "Solution antiseptique pour la désinfection.", avgPrice: 600, requiresRx: false, categorySlug: "hygiene" },
  { name: "Cotons (100 pièces)", genericName: "Coton hydrophile", form: "Paquet", dosage: "100 pièces", packSize: "Paquet de 100", description: "Cotons hydrophiles pour les soins du quotidien.", avgPrice: 800, requiresRx: false, categorySlug: "hygiene" },

  // Antipaludéens
  { name: "Artésunate", genericName: "Artésunate", form: "Comprimé", dosage: "50 mg", packSize: "Boîte de 12", description: "Antipaludéen dérivé de l'artémisinine, sur ordonnance.", avgPrice: 1500, requiresRx: true, categorySlug: "antipaludeens" },
  { name: "Coartem", genericName: "Artéméther / Luméfantrine", form: "Comprimé", dosage: "20/120 mg", packSize: "Boîte de 24", description: "Traitement combiné antipaludéen de première intention.", avgPrice: 2500, requiresRx: true, categorySlug: "antipaludeens" },
  { name: "Malarone", genericName: "Atovaquone / Proguanil", form: "Comprimé", dosage: "250/100 mg", packSize: "Boîte de 12", description: "Traitement et chimioprophylaxie du paludisme.", avgPrice: 8000, requiresRx: true, categorySlug: "antipaludeens" },
];

const pharmacies: PharmacySeed[] = [
  { name: "Pharmacie de la Riviera", slug: "pharmacie-de-la-riviera", address: "Rue des Jardins, Riviera Palmeraie", commune: "Cocody", phone: "+225 27 22 44 11 01", hoursWeekday: "07h30 - 20h30", hoursSaturday: "08h00 - 20h00", hoursSunday: "09h00 - 18h00", isOpen247: false, isOnDuty: true, latitude: 5.3625, longitude: -3.9967, rating: 4.8 },
  { name: "Pharmacie du Plateau", slug: "pharmacie-du-plateau", address: "Avenue Chardy, Immeuble Botreau-Roussel", commune: "Plateau", phone: "+225 27 20 25 30 40", hoursWeekday: "07h30 - 20h00", hoursSaturday: "08h00 - 19h00", hoursSunday: "Fermé", isOpen247: false, isOnDuty: false, latitude: 5.3167, longitude: -4.0167, rating: 4.6 },
  { name: "Pharmacie d'Angré", slug: "pharmacie-d-angre", address: "Centre commercial Angré, 8e Tranche", commune: "Cocody", phone: "+225 27 22 45 67 89", hoursWeekday: "08h00 - 21h00", hoursSaturday: "08h00 - 21h00", hoursSunday: "09h00 - 20h00", isOpen247: true, isOnDuty: true, latitude: 5.3900, longitude: -3.9800, rating: 4.7 },
  { name: "Pharmacie de Yopougon", slug: "pharmacie-de-yopougon", address: "Marché de Yopougon, Avenue 13", commune: "Yopougon", phone: "+225 27 23 51 22 33", hoursWeekday: "07h30 - 20h00", hoursSaturday: "08h00 - 19h00", hoursSunday: "Fermé", isOpen247: false, isOnDuty: false, latitude: 5.3400, longitude: -4.0800, rating: 4.3 },
  { name: "Pharmacie de Marcory Zone 4", slug: "pharmacie-de-marcory-zone-4", address: "Bd Valery Giscard d'Estaing, Zone 4", commune: "Marcory", phone: "+225 27 21 35 78 90", hoursWeekday: "07h30 - 20h30", hoursSaturday: "08h00 - 20h00", hoursSunday: "09h00 - 18h00", isOpen247: false, isOnDuty: true, latitude: 5.2900, longitude: -4.0200, rating: 4.5 },
  { name: "Pharmacie de Treichville", slug: "pharmacie-de-treichville", address: "Avenue 12, Rue 14, Treichville", commune: "Treichville", phone: "+225 27 21 30 45 67", hoursWeekday: "08h00 - 19h30", hoursSaturday: "08h00 - 19h00", hoursSunday: "Fermé", isOpen247: false, isOnDuty: false, latitude: 5.2900, longitude: -4.0100, rating: 4.2 },
  { name: "Pharmacie d'Adjamé", slug: "pharmacie-d-adjame", address: "Bd Lagunaire, Adjamé Marché", commune: "Adjamé", phone: "+225 27 22 40 11 22", hoursWeekday: "07h30 - 20h00", hoursSaturday: "08h00 - 19h30", hoursSunday: "09h00 - 17h00", isOpen247: false, isOnDuty: false, latitude: 5.3600, longitude: -4.0200, rating: 4.1 },
  { name: "Pharmacie d'Abobo", slug: "pharmacie-d-abobo", address: "Centre Abobo, Rue Principale", commune: "Abobo", phone: "+225 27 22 30 55 66", hoursWeekday: "08h00 - 20h00", hoursSaturday: "08h00 - 20h00", hoursSunday: "09h00 - 18h00", isOpen247: true, isOnDuty: true, latitude: 5.4200, longitude: -4.0200, rating: 4.4 },
  { name: "Pharmacie de Koumassi", slug: "pharmacie-de-koumassi", address: "Bd Marseille, Koumassi", commune: "Koumassi", phone: "+225 27 21 27 88 99", hoursWeekday: "07h30 - 20h00", hoursSaturday: "08h00 - 19h00", hoursSunday: "Fermé", isOpen247: false, isOnDuty: false, latitude: 5.2800, longitude: -4.0000, rating: 4.0 },
  { name: "Pharmacie de Port-Bouët", slug: "pharmacie-de-port-bouet", address: "Route du Port, Port-Bouët", commune: "Port-Bouët", phone: "+225 27 21 80 12 34", hoursWeekday: "08h00 - 20h00", hoursSaturday: "08h00 - 19h00", hoursSunday: "09h00 - 17h00", isOpen247: false, isOnDuty: true, latitude: 5.2500, longitude: -3.9800, rating: 4.3 },
  { name: "Pharmacie de Bingerville", slug: "pharmacie-de-bingerville", address: "Rue du Marché, Bingerville Centre", commune: "Bingerville", phone: "+225 27 22 60 70 80", hoursWeekday: "07h30 - 19h30", hoursSaturday: "08h00 - 19h00", hoursSunday: "Fermé", isOpen247: false, isOnDuty: false, latitude: 5.3500, longitude: -3.8900, rating: 4.5 },
  { name: "Pharmacie des Deux Plateaux", slug: "pharmacie-des-deux-plateaux", address: "Rue du Café, Vallon, Deux Plateaux", commune: "Cocody", phone: "+225 27 22 48 90 10", hoursWeekday: "07h30 - 21h00", hoursSaturday: "08h00 - 21h00", hoursSunday: "09h00 - 20h00", isOpen247: true, isOnDuty: true, latitude: 5.3750, longitude: -3.9950, rating: 4.9 },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function hashUserPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding SABLIN PHARMA database...");

  // Mapping: category slug → medication image URL
  const medImageByCategory: Record<string, string> = {
    "douleur-fievre": "/images/medications/med-douleur.png",
    "antibiotiques": "/images/medications/med-antibiotiques.png",
    "vitamines": "/images/medications/med-vitamines.png",
    "cardiovasculaire": "/images/medications/med-cardiovasculaire.png",
    "digestif": "/images/medications/med-digestif.png",
    "respiratoire": "/images/medications/med-respiratoire.png",
    "dermatologie": "/images/medications/med-dermatologie.png",
    "mere-enfant": "/images/medications/med-mere-enfant.png",
    "hygiene": "/images/medications/med-hygiene.png",
    "antipaludeens": "/images/medications/med-antipaludeens.png",
  };

  // Pharmacy images (cycled)
  const pharmacyImages = [
    "/images/pharmacies/pharmacy-1.png",
    "/images/pharmacies/pharmacy-2.png",
    "/images/pharmacies/pharmacy-3.png",
    "/images/pharmacies/pharmacy-4.png",
  ];

  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );

  // Categories
  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await db.category.create({ data: { ...c } });
    catMap[c.slug] = created.id;
  }
  console.log(`✓ ${categories.length} catégories`);

  // Medications
  const medMap: Record<string, string> = {};
  for (const m of medications) {
    const created = await db.medication.create({
      data: {
        name: m.name,
        slug: slugify(m.name),
        genericName: m.genericName,
        categoryId: catMap[m.categorySlug],
        form: m.form,
        dosage: m.dosage,
        packSize: m.packSize,
        description: m.description,
        requiresRx: m.requiresRx,
        avgPrice: m.avgPrice,
        imageUrl: m.imageUrl ?? medImageByCategory[m.categorySlug] ?? null,
      },
    });
    medMap[m.name] = created.id;
  }
  console.log(`✓ ${medications.length} médicaments`);

  // Pharmacies
  const pharmaMap: Record<string, string> = {};
  for (let i = 0; i < pharmacies.length; i++) {
    const p = pharmacies[i];
    const created = await db.pharmacy.create({
      data: { ...p, imageUrl: p.imageUrl ?? pharmacyImages[i % pharmacyImages.length] },
    });
    pharmaMap[p.slug] = created.id;
  }
  console.log(`✓ ${pharmacies.length} pharmacies`);

  // PharmacyMedication — link each pharmacy to each medication with varied price & stock
  let links = 0;
  const pharmaIds = Object.values(pharmaMap);
  const medIds = Object.values(medMap);
  const medArr = Object.entries(medMap);
  for (const pharmaId of pharmaIds) {
    // Each pharmacy stocks ~85% of medications
    for (const [medName, medId] of medArr) {
      const seed = medications.find((mm) => mm.name === medName)!;
      const stockRoll = (hashStr(pharmaId + medId) % 100);
      const inStock = stockRoll < 82; // ~82% in stock
      const priceVar = ((hashStr(pharmaId + medId + "p") % 40) - 18); // -18% to +21%
      const price = Math.max(50, Math.round((seed.avgPrice * (100 + priceVar)) / 100 / 50) * 50);
      await db.pharmacyMedication.create({
        data: { pharmacyId: pharmaId, medicationId: medId, price, inStock },
      });
      links++;
    }
  }
  console.log(`✓ ${links} liens pharmacie-médicament`);

  await db.user.create({
    data: {
      name: "Demo SABLIN",
      email: "demo@sablinpharma.ci",
      phone: "+225 07 00 00 00 01",
      password: hashUserPassword("Demo@12345"),
      commune: "Cocody",
      credits: 10,
      notifications: {
        create: [
          {
            type: "success",
            title: "Recharge réussie",
            message: "Votre portefeuille contient 10 crédits SABLIN.",
            icon: "Coins",
            link: "wallet",
          },
          {
            type: "info",
            title: "Pass Ordonnance Unique",
            message: "Le Pass Ordonnance Unique coûte 500 FCFA et expire après comparaison.",
            icon: "ClipboardList",
            link: "prescription",
          },
        ],
      },
      settings: {
        create: {
          pushAlerts: true,
          dutyAlerts: true,
          priceAlerts: true,
          promoAlerts: false,
          emailRecap: false,
          language: "fr",
          theme: "light",
          defaultCommune: "Cocody",
        },
      },
      creditTransactions: {
        create: {
          type: "recharge",
          amount: 10,
          description: "Solde démo initial",
          fcfaEquivalent: 1000,
          balanceBefore: 0,
          balanceAfter: 10,
          status: "réussi",
        },
      },
    },
  });
  console.log("✓ utilisateur démo public");

  console.log("Seed terminé ✓");
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
