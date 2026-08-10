import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "./supabase/server";
import type { ErrandRow } from "./types";

export type Ctx = {
  userId: string;
  errand: ErrandRow;
  db: ReturnType<typeof createServiceClient>;
};

export const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/**
 * Loads the errand with the service role after checking who is asking.
 * Every state transition goes through here so the rules live in one place.
 */
export async function loadErrand(
  id: string,
  role: "requester" | "runner" | "either"
): Promise<Ctx | NextResponse> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Sign in first.", 401);

  const db = createServiceClient();
  const { data } = await db.from("errands").select("*").eq("id", id).single();
  if (!data) return fail("Errand not found.", 404);

  const errand = data as ErrandRow;
  const isRequester = errand.requester_id === auth.user.id;
  const isRunner = errand.runner_id === auth.user.id;

  if (role === "requester" && !isRequester) return fail("Not your errand.", 403);
  if (role === "runner" && !isRunner) return fail("Not your errand.", 403);
  if (role === "either" && !isRequester && !isRunner)
    return fail("Not your errand.", 403);

  return { userId: auth.user.id, errand, db };
}

export async function ledger(
  db: ReturnType<typeof createServiceClient>,
  errandId: string,
  entry_type: string,
  amount: number,
  note: string
) {
  await db.from("escrow_ledger").insert({ errand_id: errandId, entry_type, amount, note });
}
