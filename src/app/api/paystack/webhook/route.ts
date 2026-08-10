import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Paystack webhook. The signature is checked against the raw body, so this
 * route reads text() and never json().
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY ?? "")
    .update(raw)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return NextResponse.json({ ok: true });

  const errandId = event.data?.metadata?.errand_id;
  if (!errandId) return NextResponse.json({ ok: true });

  const db = createServiceClient();
  const { data: errand } = await db
    .from("errands")
    .select("id,status,total_amount")
    .eq("id", errandId)
    .single();

  if (errand && errand.status === "awaiting_payment") {
    await db
      .from("errands")
      .update({ status: "funded", funded_at: new Date().toISOString() })
      .eq("id", errandId);
    await db.from("escrow_ledger").insert({
      errand_id: errandId,
      entry_type: "fund",
      amount: errand.total_amount,
      note: "Funded through Paystack",
    });
  }

  return NextResponse.json({ ok: true });
}
