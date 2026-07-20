"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelErrand(errandId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "You must be logged in." };
  }

  const { error } = await supabase
    .from("errands")
    .update({ status: "cancelled" })
    .eq("id", errandId)
    .eq("customer_id", user.id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath(`/errands/${errandId}`);
  revalidatePath("/errands");
  return { success: true as const };
}
