import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";

/**
 * Where Paystack sends the customer back to. The webhook is the source of
 * truth, but verifying here as well means the requester sees the right state
 * immediately rather than waiting on a callback.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");
  const errandId = url.searchParams.get("errand");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!reference || !errandId) return NextResponse.redirect(`${site}/errands`);

  try {
    const tx = await verifyTransaction(reference);
    if (tx.status === "success") {
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
    }
  } catch {
    // Fall through. The webhook settles it.
  }

  return NextResponse.redirect(`${site}/errands/${errandId}`);
}
