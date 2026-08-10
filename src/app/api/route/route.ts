import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** The runner declares the trip they were already making. */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { origin, destination } = await request.json();
  if (!origin || !destination || origin === destination) {
    return NextResponse.json({ error: "Pick two different points." }, { status: 400 });
  }

  const db = createServiceClient();
  await db
    .from("runner_routes")
    .update({ active: false })
    .eq("runner_id", auth.user.id)
    .eq("active", true);
  await db.from("runner_routes").insert({
    runner_id: auth.user.id,
    origin_id: origin,
    destination_id: destination,
  });
  await db.from("profiles").update({ runner_mode: true }).eq("id", auth.user.id);

  return NextResponse.json({ ok: true });
}
