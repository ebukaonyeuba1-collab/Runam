import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Pilot NIN capture. Stores the last four digits only and marks the runner
 * verified. Replace the body of this route with a call to a licensed NIMC
 * verification provider before real errands run.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { nin } = await request.json();
  const digits = String(nin ?? "").replace(/\D/g, "");
  if (digits.length !== 11) {
    return NextResponse.json({ error: "A NIN is 11 digits." }, { status: 400 });
  }

  const db = createServiceClient();
  await db
    .from("profiles")
    .update({ nin_last4: digits.slice(-4), nin_verified: true })
    .eq("id", auth.user.id);

  return NextResponse.json({ ok: true });
}
