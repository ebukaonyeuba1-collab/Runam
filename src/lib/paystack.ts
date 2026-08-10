const BASE = "https://api.paystack.co";

export const simulatePayments = () =>
  process.env.NEXT_PUBLIC_SIMULATE_PAYMENTS === "true";

async function paystack(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === false) {
    throw new Error(body.message ?? `Paystack request failed (${res.status})`);
  }
  return body;
}

/** Amounts are naira everywhere in this app. Paystack wants kobo. */
export const toKobo = (naira: number) => Math.round(naira * 100);

export async function initTransaction(args: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const body = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: args.email,
      amount: toKobo(args.amountNaira),
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata ?? {},
    }),
  });
  return body.data as { authorization_url: string; reference: string };
}

export async function verifyTransaction(reference: string) {
  const body = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  return body.data as { status: string; amount: number; reference: string };
}
