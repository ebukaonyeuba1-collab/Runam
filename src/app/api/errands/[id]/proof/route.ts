import { NextResponse } from "next/server";
import { loadErrand, fail } from "@/lib/guard";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await loadErrand(params.id, "runner");
  if (ctx instanceof NextResponse) return ctx;
  const { errand, db } = ctx;

  if (errand.status !== "picked_up") return fail("Confirm pickup first.");

  const { proofUrl, proofNote } = await request.json();
  if (!proofUrl) return fail("Add a photo or receipt link so the requester can see it.");

  await db
    .from("errands")
    .update({
      status: "proof_submitted",
      proof_url: String(proofUrl).slice(0, 500),
      proof_note: String(proofNote ?? "").slice(0, 500),
    })
    .eq("id", errand.id);

  return NextResponse.json({ ok: true });
}
