import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fail } from "@/lib/guard";
import { counterCeiling, COUNTER_REASONS } from "@/lib/pricing";
import type { ErrandRow } from "@/lib/types";

/**
 * One counter offer per errand, from a fixed list of reasons, inside a capped
 * band. No free text and no thread, so there is no channel for the two sides
 * to arrange payment off platform.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Sign in first.", 401);

  const { amount, reason } = await request.json();
  const validReason = COUNTER_REASONS.some((r) => r.value === reason);
  if (!validReason) return fail("Pick one of the listed reasons.");

  const db = createServiceClient();
  const { data: e } = await db.from("errands").select("*").eq("id", params.id).single();
  if (!e) return fail("Errand not found.", 404);
  const errand = e as ErrandRow;

  if (errand.status !== "funded" || errand.runner_id) {
    return fail("This errand is no longer open.", 409);
  }
  if (errand.counter_status) return fail("This errand has already been countered once.");

  const ceiling = counterCeiling(errand.total_amount);
  if (amount <= errand.total_amount) return fail("Ask for more than the quoted price.");
  if (amount > ceiling) {
    return fail(`The most you can ask here is N${ceiling.toLocaleString()}.`);
  }

  await db
    .from("errands")
    .update({
      counter_amount: Math.round(amount),
      counter_reason: reason,
      counter_status: "pending",
    })
    .eq("id", errand.id);

  return NextResponse.json({ ok: true });
}
