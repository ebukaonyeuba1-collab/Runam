"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { errandSchema, type ErrandInput } from "@/lib/validations/errand";

export async function createErrand(input: ErrandInput) {
  const parsed = errandSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "You must be logged in to post an errand." };
  }

  const { data, error } = await supabase
    .from("errands")
    .insert({
      customer_id: user.id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      pickup_location: parsed.data.pickupLocation,
      destination: parsed.data.destination,
      budget: parsed.data.budget,
      urgency: parsed.data.urgency,
      preferred_date: parsed.data.preferredDate || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/errands");
  revalidatePath("/dashboard");

  return { success: true as const, errand: data };
}
