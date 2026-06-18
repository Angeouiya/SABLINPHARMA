export function normalizeEmail(value: unknown): string | null {
  const email = String(value ?? "").trim().toLowerCase();
  return email || null;
}

export function normalizePhone(value: unknown): string | null {
  const phone = String(value ?? "").trim().replace(/[\s.-]/g, "");
  return phone || null;
}

export function emailIsValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function phoneIsValid(value: string): boolean {
  const cleaned = normalizePhone(value) ?? "";
  return /^(\+225)?\d{8,10}$/.test(cleaned);
}

export function primaryUserContact(user: { email?: string | null; phone?: string | null }) {
  return user.email || user.phone || "Contact non renseigné";
}
