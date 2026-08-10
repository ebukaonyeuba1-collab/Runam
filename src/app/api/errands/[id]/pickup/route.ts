import { NextResponse } from "next/server";
import { loadErrand, fail, ledger } from "@/lib/guard";
import { tierOf, TIERS } from "@/lib/tiers";
import type { Profile } from "@/lib/types";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await loadErrand(params.id, "runner");
  if (ctx instanceof NextResponse) return ctx;
  const { errand, db, userId } = ctx;

  if (errand.status !== "accepted") return fail("This errand is not ready for pickup.");

  await db
    .from("errands")
    .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
    .eq("id", errand.id);

  // Transport advance, released at pickup, capped by tier. A new runner gets
  // nothing here because their errands are on their route and cost them nothing.
  const { data: p } = await db.from("profiles").select("*").eq("id", userId).single();
  const profile = p as Profile;
  const rule = TIERS[tierOf(profile.completed_errands, profile.nin_verified)];
  const advance = Math.min(rule.transportAdvance, errand.transport_fee);

  if (advance > 0) {
    await ledger(db, errand.id, "transport_advance", advance, "Transport released at pickup");
  }

  return NextResponse.json({ ok: true, advance });
}
