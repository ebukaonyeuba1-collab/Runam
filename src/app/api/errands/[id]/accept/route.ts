import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fail } from "@/lib/guard";
import { distanceKm, detourKm, type Place } from "@/lib/geo";
import { tierOf, canAccept } from "@/lib/tiers";
import type { ErrandRow, Profile } from "@/lib/types";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Sign in first.", 401);

  const db = createServiceClient();
  const { data: e } = await db.from("errands").select("*").eq("id", params.id).single();
  if (!e) return fail("Errand not found.", 404);
  const errand = e as ErrandRow;

  if (errand.status !== "funded" || errand.runner_id) {
    return fail("Someone already took this one.", 409);
  }
  if (errand.requester_id === auth.user.id) {
    return fail("You cannot run your own errand.");
  }

  const { data: p } = await db
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  const profile = p as Profile;
  const tier = tierOf(profile.completed_errands, profile.nin_verified);

  // Re-check the geometry server side against the route the runner declared.
  const { data: route } = await db
    .from("runner_routes")
    .select("*")
    .eq("runner_id", auth.user.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!route) return fail("Set the trip you are making before taking errands.");

  const { data: placeRows } = await db.from("places").select("*");
  const places = Object.fromEntries(
    ((placeRows ?? []) as Place[]).map((pl) => [pl.id, pl])
  );
  const detour = detourKm(
    places[route.origin_id],
    places[route.destination_id],
    places[errand.pickup_id],
    places[errand.dropoff_id]
  );

  const check = canAccept({
    tier,
    totalAmount: errand.total_amount,
    detourKm: detour,
    category: errand.category,
  });
  if (!check.eligible) return fail(check.reason, 403);

  // Conditional update. Two runners tapping at once cannot both win.
  const { data: updated } = await db
    .from("errands")
    .update({
      runner_id: auth.user.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", errand.id)
    .eq("status", "funded")
    .is("runner_id", null)
    .select("id")
    .maybeSingle();

  if (!updated) return fail("Someone already took this one.", 409);
  return NextResponse.json({ ok: true, detourKm: Number(detour.toFixed(2)) });
}
