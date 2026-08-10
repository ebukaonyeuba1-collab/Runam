import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar, BottomNav, Page, Empty } from "@/components/Shell";
import { Badge } from "@/components/Bits";
import { naira, timeAgo, STATUS_LABEL } from "@/lib/format";
import type { ErrandRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const TONE: Record<string, "neutral" | "green" | "warn" | "navy"> = {
  awaiting_payment: "warn",
  funded: "navy",
  accepted: "navy",
  picked_up: "navy",
  proof_submitted: "warn",
  completed: "green",
  disputed: "warn",
};

export default async function Errands() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("errands")
    .select("*")
    .eq("requester_id", user.user!.id)
    .order("created_at", { ascending: false });

  const errands = (data ?? []) as ErrandRow[];

  return (
    <>
      <TopBar title="My errands" />
      <Page>
        <Link
          href="/errands/new"
          className="mb-4 flex items-center justify-between rounded-2xl bg-navy px-4 py-4 text-white"
        >
          <span>
            <span className="display block text-base font-bold">Post an errand</span>
            <span className="block text-xs text-white/60">
              See the price before you pay
            </span>
          </span>
          <span className="text-2xl leading-none text-green">+</span>
        </Link>

        {errands.length === 0 ? (
          <Empty
            title="Nothing posted yet"
            body="Your first errand takes about a minute. You will see the full price broken down before anything is charged."
          />
        ) : (
          <ul className="space-y-3">
            {errands.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/errands/${e.id}`}
                  className="block rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{e.title}</p>
                    <span className="tnum shrink-0 font-semibold">
                      {naira(e.total_amount)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge tone={TONE[e.status] ?? "neutral"}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </Badge>
                    <span className="text-xs text-muted">{timeAgo(e.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Page>
      <BottomNav active="/errands" />
    </>
  );
}
