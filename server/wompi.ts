import crypto from "crypto";

const WOMPI_BASE_URL = process.env.WOMPI_ENV === "production"
  ? "https://production.wompi.co/v1"
  : "https://sandbox.wompi.co/v1";

export const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY ?? "";
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY ?? "";
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY ?? "";
const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY ?? "";

export function wompiEnabled(): boolean {
  return Boolean(WOMPI_PUBLIC_KEY && WOMPI_PRIVATE_KEY);
}

export function generateReference(userId: string, planSlug: string): string {
  const ts = Date.now();
  return `LL-${planSlug}-${userId.slice(0, 8)}-${ts}`;
}

export async function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string
): Promise<string> {
  const raw = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface WompiTransaction {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type: string;
  customer_email: string;
  created_at: string;
}

export async function getTransaction(transactionId: string): Promise<WompiTransaction | null> {
  if (!wompiEnabled()) return null;
  try {
    const res = await fetch(`${WOMPI_BASE_URL}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
    });
    if (!res.ok) return null;
    const json = await res.json() as { data: WompiTransaction };
    return json.data;
  } catch {
    return null;
  }
}

export function verifyWebhookSignature(
  payload: string,
  timestamp: string,
  signature: string
): boolean {
  if (!WOMPI_EVENTS_KEY) return false;
  const raw = `${payload}${timestamp}${WOMPI_EVENTS_KEY}`;
  const expected = crypto.createHash("sha256").update(raw).digest("hex");
  return expected === signature;
}

export function buildCheckoutUrl(
  reference: string,
  amountInCents: number,
  currency: string,
  signature: string,
  redirectUrl: string,
  customerEmail?: string
): string {
  const params = new URLSearchParams({
    "public-key": WOMPI_PUBLIC_KEY,
    currency,
    "amount-in-cents": String(amountInCents),
    reference,
    "redirect-url": redirectUrl,
    "signature:integrity": signature,
  });
  if (customerEmail) params.set("customer-data:email", customerEmail);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}
