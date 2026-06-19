type LogLevel = "info" | "warn" | "error";

function sanitizeMessage(message: string) {
  return message
    .replace(/key=[^&\s]+/gi, "key=[redacted]")
    .replace(/token=[^&\s]+/gi, "token=[redacted]")
    .replace(/secret=[^&\s]+/gi, "secret=[redacted]");
}

export function logEnrichment(level: LogLevel, message: string, details?: Record<string, unknown>) {
  const safeMessage = sanitizeMessage(message);
  const safeDetails = details
    ? Object.fromEntries(
        Object.entries(details).filter(([key]) => !/(api|key|secret|token|credential)/i.test(key))
      )
    : undefined;

  if (level === "error") {
    console.error(safeMessage, safeDetails ?? "");
    return;
  }
  if (level === "warn") {
    console.warn(safeMessage, safeDetails ?? "");
    return;
  }
  console.info(safeMessage, safeDetails ?? "");
}

