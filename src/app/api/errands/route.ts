import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { distanceKm, type Place } from "@/lib/geo";
import { quote, type Category } from "@/lib/pricing";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { title, instructions, category, pickup, dropoff } = await request.json();
  if (!title || !pickup || !dropoff || pickup === dropoff) {
    return NextResponse.json(
      { error: "Give the errand a title and two different points." },
      { status: 400 }
    );
  }

  const db = createServiceClient();
  const { data: placeRows } = await db
    .from("places")
    .select("*")
    .in("id", [pickup, dropoff]);
  const places = Object.fromEntries(
    ((placeRows ?? []) as Place[]).map((p) => [p.id, p])
  );
  if (!places[pickup] || !places[dropoff]) {
    return NextResponse.json({ error: "Unknown pickup or drop off." }, { status: 400 });
  }

  // The server prices it. The browser only ever previewed.
  const d = distanceKm(places[pickup], places[dropoff]);
  const hour = new Date().getHours();
  const q = quote({
    distanceKm: d,
    category: (category ?? "simple") as Category,
    peakHour: (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19),
  });

  const { data, error } = await db
    .from("errands")
    .insert({
      requester_id: auth.user.id,
      title: String(title).slice(0, 80),
      instructions: String(instructions ?? "").slice(0, 1000),
      category: category ?? "simple",
      pickup_id: pickup,
      dropoff_id: dropoff,
      distance_km: q.distanceKm,
      base_fee: q.baseFee,
      distance_fee: q.distanceFee,
      complexity_fee: q.complexityFee,
      service_fee: q.serviceFee,
      transport_fee: q.transportFee,
      total_amount: q.totalAmount,
      runam_fee: q.runamFee,
      runner_payout: q.runnerPayout,
      status: "awaiting_payment",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
