import { NextResponse } from "next/server";
import { loadErrand, fail } from "@/lib/guard";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await loadErrand(params.id, "either");
  if (ctx instanceof NextResponse) return ctx;
  const { errand, db, userId } = ctx;

  const { reason } = await request.json();
  if (!reason) return fail("Say what went wrong.");
  if (["completed", "refunded", "cancelled"].includes(errand.status)) {
    return fail("This errand is already closed.");
  }

  await db.from("disputes").insert({
    errand_id: errand.id,
    raised_by: userId,
    reason: String(reason).slice(0, 1000),
  });
  await db.from("errands").update({ status: "disputed" }).eq("id", errand.id);

  // Funds stay in escrow. Nothing releases while a dispute is open.
  return NextResponse.json({ ok: true });
}
