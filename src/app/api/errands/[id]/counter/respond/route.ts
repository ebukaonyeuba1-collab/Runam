import { NextResponse } from "next/server";
import { loadErrand, fail } from "@/lib/guard";
import { repriceFromTotal } from "@/lib/pricing";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await loadErrand(params.id, "requester");
  if (ctx instanceof NextResponse) return ctx;
  const { errand, db } = ctx;

  if (errand.counter_status !== "pending") return fail("There is no offer to answer.");
  const { accept } = await request.json();

  if (!accept) {
    await db.from("errands").update({ counter_status: "declined" }).eq("id", errand.id);
    return NextResponse.json({ ok: true, accepted: false });
  }

  const q = repriceFromTotal(
    {
      distanceKm: Number(errand.distance_km),
      baseFee: errand.base_fee,
      distanceFee: errand.distance_fee,
      complexityFee: errand.complexity_fee,
      serviceFee: errand.service_fee,
      transportFee: errand.transport_fee,
      totalAmount: errand.total_amount,
      runamFee: errand.runam_fee,
      runnerPayout: errand.runner_payout,
    },
    errand.counter_amount!
  );

  const difference = q.totalAmount - errand.total_amount;

  await db
    .from("errands")
    .update({
      counter_status: "accepted",
      service_fee: q.serviceFee,
      total_amount: q.totalAmount,
      runam_fee: q.runamFee,
      runner_payout: q.runnerPayout,
      status: "awaiting_payment",
    })
    .eq("id", errand.id);

  // The top up has to be collected before the errand goes live again.
  return NextResponse.json({ ok: true, accepted: true, topUp: difference });
}
