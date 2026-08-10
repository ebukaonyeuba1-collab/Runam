import { createClient } from "@/lib/supabase/server";
import { TopBar, BottomNav, Page, Empty } from "@/components/Shell";
import { naira, timeAgo } from "@/lib/format";
import type { ErrandRow, LedgerRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  fund: "Into escrow",
  transport_advance: "Transport released at pickup",
  release_runner: "Paid to runner",
  release_platform: "RunAm fee",
  refund: "Refunded to requester",
};

export default async function Wallet() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user!.id;

  const { data: errands } = await supabase
    .from("errands")
    .select("*")
    .or(`requester_id.eq.${me},runner_id.eq.${me}`);
  const rows = (errands ?? []) as ErrandRow[];

  const { data: ledgerRows } = await supabase
    .from("escrow_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const ledger = (ledgerRows ?? []) as LedgerRow[];

  const held = rows
    .filter(
      (e) =>
        e.requester_id === me &&
        ["funded", "accepted", "picked_up", "proof_submitted"].includes(e.status)
    )
    .reduce((sum, e) => sum + e.total_amount, 0);

  const earned = rows
    .filter((e) => e.runner_id === me && e.status === "completed")
    .reduce((sum, e) => sum + e.runner_payout, 0);

  return (
    <>
      <TopBar title="Escrow" />
      <Page>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-navy p-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
              Held for you
            </p>
            <p className="tnum display mt-1 text-2xl font-bold">{naira(held)}</p>
            <p className="mt-1 text-[11px] text-white/50">
              Refundable until you confirm
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              Earned running
            </p>
            <p className="tnum display mt-1 text-2xl font-bold text-green-dark">
              {naira(earned)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Paid out on release</p>
          </div>
        </div>

        <p className="mb-2 mt-6 text-sm font-semibold">Every movement</p>
        {ledger.length === 0 ? (
          <Empty
            title="No money has moved yet"
            body="Fund an errand or complete one and it shows up here, line by line."
          />
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">
                    {LABEL[l.entry_type] ?? l.entry_type}
                  </span>
                  <span className="block text-xs text-muted">
                    {timeAgo(l.created_at)}
                  </span>
                </span>
                <span className="tnum text-sm font-semibold">{naira(l.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Page>
      <BottomNav active="/wallet" />
    </>
  );
}
