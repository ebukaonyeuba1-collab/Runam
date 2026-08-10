import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/Shell";
import NewErrandForm from "./form";
import type { Place } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function NewErrand() {
  const supabase = createClient();
  const { data } = await supabase.from("places").select("*").order("area").order("name");
  return (
    <>
      <TopBar title="Post an errand" back="/errands" />
      <NewErrandForm places={(data ?? []) as Place[]} />
    </>
  );
}
