import { createClient } from "@/lib/supabase/server";
import { TopBar, BottomNav, Page } from "@/components/Shell";
import { tierOf, TIERS, nextTierAt } from "@/lib/tiers";
import { naira, km } from "@/lib/format";
import type { Profile } from "@/lib/types";
import MeActions from "./actions";

export const dynamic = "force-dynamic";

export default async function Me() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user!.id)
    .single();
  const p = data as Profile;
  const tier = tierOf(p.completed_errands, p.nin_verified);
  const rule = TIERS[tier];
  const nextAt = nextTierAt(tier);

  return (
    <>
      <TopBar title="Me" />
      <Page>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="display text-lg font-bold">{p.full_name || "Your account"}</p>
          <p className="text-sm text-muted">{p.phone || auth.user!.email}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Runner status
          </p>
          <p className="display mt-1 text-xl font-bold">{rule.name}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li className="flex justify-between">
              <span>Errand ceiling</span>
              <span className="tnum text-ink">{naira(rule.maxErrandValue)}</span>
            </li>
            <li className="flex justify-between">
              <span>Detour allowed</span>
              <span className="tnum text-ink">{km(rule.maxDetourKm)}</span>
            </li>
            <li className="flex justify-between">
              <span>Transport advance</span>
              <span className="tnum text-ink">
                {rule.transportAdvance ? naira(rule.transportAdvance) : "None yet"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Purchase errands</span>
              <span className="text-ink">{rule.allowsPurchase ? "Yes" : "Not yet"}</span>
            </li>
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
            {rule.requirement}
            {nextAt && ` ${nextAt - p.completed_errands} errands to go.`}
          </p>
        </div>

        <MeActions profile={p} />
      </Page>
      <BottomNav active="/me" />
    </>
  );
}
