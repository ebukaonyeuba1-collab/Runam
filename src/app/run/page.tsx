import { createClient } from "@/lib/supabase/server";
import { TopBar, BottomNav, Page } from "@/components/Shell";
import RunBoard from "./board";
import type { Place } from "@/lib/geo";
import type { ErrandRow, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RunPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user!.id;

  const [{ data: profile }, { data: places }, { data: route }, { data: open }, { data: mine }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", me).single(),
      supabase.from("places").select("*").order("area").order("name"),
      supabase
        .from("runner_routes")
        .select("*")
        .eq("runner_id", me)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("errands")
        .select("*")
        .eq("status", "funded")
        .is("runner_id", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("errands")
        .select("*")
        .eq("runner_id", me)
        .in("status", ["accepted", "picked_up", "proof_submitted"])
        .order("created_at", { ascending: false }),
    ]);

  return (
    <>
      <TopBar title="Run mode" />
      <Page>
        <RunBoard
          profile={profile as Profile}
          places={(places ?? []) as Place[]}
          route={route as { origin_id: string; destination_id: string } | null}
          open={(open ?? []) as ErrandRow[]}
          mine={(mine ?? []) as ErrandRow[]}
        />
      </Page>
      <BottomNav active="/run" />
    </>
  );
}
