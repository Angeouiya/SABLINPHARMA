import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  processProviderConfirmation,
  verifyPayDunyaHash,
  verifyWebhookSignature,
} from "@/lib/payment-security";

type WebhookPayload = {
  reference: string;
  providerReference: string | null;
  amount: number | null;
  currency: string;
  status: unknown;
  provider: string;
  eventId: string | null;
  paydunyaHash: string | null;
};

function parseJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getPath(source: unknown, path: string[]) {
  let current = source as Record<string, unknown> | null;
  for (const key of path) {
    if (!current || typeof current !== "object") return null;
    current = current[key] as Record<string, unknown> | null;
  }
  return current;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function firstAmount(...values: unknown[]) {
  const raw = firstString(...values);
  if (!raw) return null;
  const parsed = Number(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWebhook(rawBody: string, contentType: string | null): WebhookPayload {
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    const data = parseJson(params.get("data"));
    const invoice = getPath(data, ["invoice"]);
    const customData = getPath(data, ["custom_data"]);
    return {
      reference:
        firstString(
          params.get("reference"),
          params.get("sablinReference"),
          params.get("data[custom_data][sablin_reference]"),
          params.get("custom_data[sablin_reference]"),
          getPath(customData, ["sablin_reference"])
        ) ?? "",
      providerReference: firstString(
        params.get("providerReference"),
        params.get("transactionId"),
        params.get("token"),
        params.get("data[invoice][token]"),
        getPath(invoice, ["token"])
      ),
      amount: firstAmount(
        params.get("amount"),
        params.get("data[invoice][total_amount]"),
        params.get("invoice[total_amount]"),
        getPath(invoice, ["total_amount"])
      ),
      currency: firstString(params.get("currency"), "XOF") ?? "XOF",
      status: firstString(params.get("status"), params.get("data[status]"), getPath(data, ["status"])) ?? "PENDING",
      provider: "paydunya",
      eventId: firstString(params.get("eventId"), params.get("id"), params.get("data[invoice][token]")),
      paydunyaHash: firstString(params.get("hash"), params.get("data[hash]"), getPath(data, ["hash"])),
    };
  }

  const body = parseJson(rawBody) as Record<string, unknown> | null;
  const data = body?.data as Record<string, unknown> | undefined;
  const invoice = (data?.invoice ?? body?.invoice) as Record<string, unknown> | undefined;
  const customData = (data?.custom_data ?? body?.custom_data) as Record<string, unknown> | undefined;
  return {
    reference:
      firstString(
        body?.reference,
        body?.sablinReference,
        customData?.sablin_reference,
        body?.sablin_reference
      ) ?? "",
    providerReference: firstString(body?.providerReference, body?.transactionId, invoice?.token, body?.token),
    amount: firstAmount(body?.amount, invoice?.total_amount),
    currency: firstString(body?.currency, "XOF") ?? "XOF",
    status: firstString(body?.status, data?.status) ?? "PENDING",
    provider: firstString(body?.provider, data ? "paydunya" : null) ?? "paydunya",
    eventId: firstString(body?.eventId, body?.id, invoice?.token),
    paydunyaHash: firstString(body?.hash, data?.hash),
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const parsed = parseWebhook(rawBody, req.headers.get("content-type"));
  const signature = req.headers.get("x-payment-signature") ?? req.headers.get("x-webhook-signature");
  const signatureValid =
    parsed.provider === "paydunya"
      ? verifyPayDunyaHash(parsed.paydunyaHash) || verifyWebhookSignature(rawBody, signature)
      : verifyWebhookSignature(rawBody, signature);

  if (!signatureValid) {
    return NextResponse.json({ error: "Signature webhook invalide." }, { status: 401 });
  }

  let reference = parsed.reference;
  let fallbackAmount = parsed.amount;
  if ((!reference || fallbackAmount === null) && parsed.providerReference) {
    const payment = await db.payment.findFirst({ where: { providerReference: parsed.providerReference } });
    reference = reference || payment?.reference || "";
    fallbackAmount = fallbackAmount ?? payment?.amount ?? null;
  }

  const result = await processProviderConfirmation({
    reference,
    providerReference: parsed.providerReference,
    amount: fallbackAmount ?? 0,
    currency: parsed.currency,
    status: parsed.status,
    provider: parsed.provider,
    webhookEventId: parsed.eventId,
    signatureValid,
  });
  return NextResponse.json(result);
}
