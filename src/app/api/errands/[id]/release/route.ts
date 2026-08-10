import { NextResponse } from "next/server";
import { loadErrand, fail, ledger } from "@/lib/guard";

/**
 * Release. Money leaves escrow only from here, only on the requester's word.
 *
 * Payout to the runner's bank account is deliberately not wired up. Doing it
 * from this codebase would mean RunAm holding and moving customer funds, which
 * needs a licence. Until the licensed partner arrangement is signed, this
 * writes the ledger entries and payouts are settled by the partner against
 * this record.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await loadErrand(params.id, "requester");
  if (ctx instanceof NextResponse) return ctx;
  const { errand, db } = ctx;

  if (errand.status !== "proof_submitted") {
    return fail("Wait for the runner to send proof.");
  }

  await db
    .from("errands")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", errand.id);

  await ledger(db, errand.id, "release_runner", errand.runner_payout, "Paid to runner");
  await ledger(db, errand.id, "release_platform", errand.runam_fee, "RunAm fee");

  if (errand.runner_id) {
    const { data: p } = await db
      .from("profiles")
      .select("completed_errands")
      .eq("id", errand.runner_id)
      .single();
    await db
      .from("profiles")
      .update({ completed_errands: (p?.completed_errands ?? 0) + 1 })
      .eq("id", errand.runner_id);
  }

  return NextResponse.json({ ok: true });
}
