// Formatting helpers for SABLIN PHARMA

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// Determine if a pharmacy is currently open based on its schedule string
export function isOpenNow(p: {
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  isOpen247: boolean;
}): boolean {
  if (p.isOpen247) return true;
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hours = now.getHours();
  const minutes = now.getHours() * 60 + now.getMinutes();

  let schedule = p.hoursWeekday;
  if (day === 6) schedule = p.hoursSaturday;
  else if (day === 0) schedule = p.hoursSunday;

  if (!schedule || schedule.toLowerCase().includes("ferm")) return false;

  const match = schedule.match(/(\d{1,2})h(\d{0,2})\s*-\s*(\d{1,2})h(\d{0,2})/);
  if (!match) return false;

  const startH = parseInt(match[1], 10);
  const startM = match[2] ? parseInt(match[2], 10) : 0;
  const endH = parseInt(match[3], 10);
  const endM = match[4] ? parseInt(match[4], 10) : 0;

  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  return minutes >= start && minutes <= end;
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
