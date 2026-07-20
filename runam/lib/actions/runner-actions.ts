"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function acceptErrand(errandId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "You must be logged in." };

  const { error } = await supabase
    .from("errands")
    .update({ runner_id: user.id, status: "accepted" })
    .eq("id", errandId)
    .eq("status", "open");

  if (error) return { success: false as const, error: error.message };

  revalidatePath("/runner/jobs");
  revalidatePath("/runner/dashboard");
  revalidatePath(`/errands/${errandId}`);
  return { success: true as const };
}

export async function startErrand(errandId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "You must be logged in." };

  const { error } = await supabase
    .from("errands")
    .update({ status: "in_progress" })
    .eq("id", errandId)
    .eq("runner_id", user.id);

  if (error) return { success: false as const, error: error.message };

  revalidatePath("/runner/dashboard");
  revalidatePath(`/errands/${errandId}`);
  return { success: true as const };
}

export async function completeErrand(errandId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false as const, error: "You must be logged in." };

  const { data: errand, error: fetchError } = await supabase
    .from("errands")
    .select("budget, runner_id")
    .eq("id", errandId)
    .single();

  if (fetchError || !errand) return { success: false as const, error: "Errand not found." };
  if (errand.runner_id !== user.id) return { success: false as const, error: "Not your errand." };

  const { error } = await supabase
    .from("errands")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", errandId)
    .eq("runner_id", user.id);

  if (error) return { success: false as const, error: error.message };

  await supabase.from("transactions").insert({
    user_id: user.id,
    errand_id: errandId,
    type: "payout",
    amount: errand.budget,
    status: "success",
  });

  await supabase.rpc("increment_runner_earnings", {
    runner_id_input: user.id,
    amount_input: errand.budget,
  });

  revalidatePath("/runner/dashboard");
  revalidatePath(`/errands/${errandId}`);
  return { success: true as const };
}
