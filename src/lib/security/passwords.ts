import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";

const KEY_LENGTH = 64;

export function passwordStrength(password: string) {
  const checks = [
    password.length >= 10,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const tooSimple = /^(password|admin|sablin|pharma|123456|azerty)/i.test(password);
  return {
    score,
    valid: score >= 4 && !tooSimple,
    message:
      score >= 4 && !tooSimple
        ? "Mot de passe robuste."
        : "Utilisez au moins 10 caractères avec majuscule, minuscule, chiffre et symbole.",
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
