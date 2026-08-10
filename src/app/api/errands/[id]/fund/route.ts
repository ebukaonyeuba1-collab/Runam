import { NextResponse } from "next/server";
import { loadErrand, fail, ledger } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { initTransaction, simulatePayments } from "@/lib/paystack";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await loadErrand(params.id, "requester");
  if (ctx instanceof NextResponse) return ctx;
  const { errand, db } = ctx;

  if (errand.status !== "awaiting_payment") return fail("This errand is already funded.");

  const reference = `runam_${errand.id.replace(/-/g, "").slice(0, 18)}_${Date.now()}`;

  // Demo mode. Moves the errand to funded with no money involved.
  if (simulatePayments()) {
    await db
      .from("errands")
      .update({
        status: "funded",
        funded_at: new Date().toISOString(),
        paystack_reference: reference,
      })
      .eq("id", errand.id);
    await ledger(db, errand.id, "fund", errand.total_amount, "Simulated funding");
    return NextResponse.json({ simulated: true });
  }

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const tx = await initTransaction({
      email: auth.user!.email!,
      amountNaira: errand.total_amount,
      reference,
      callbackUrl: `${site}/api/paystack/callback?errand=${errand.id}`,
      metadata: { errand_id: errand.id },
    });
    await db.from("errands").update({ paystack_reference: reference }).eq("id", errand.id);
    return NextResponse.json({ authorization_url: tx.authorization_url });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Checkout could not start.", 502);
  }
}
