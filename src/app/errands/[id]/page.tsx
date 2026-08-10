import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/Shell";
import { Receipt } from "@/components/Receipt";
import { Badge } from "@/components/Bits";
import { naira, timeAgo, STATUS_LABEL } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/pricing";
import type { ErrandRow, LedgerRow } from "@/lib/types";
import type { Place } from "@/lib/geo";
import Actions from "./actions";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "funded", label: "Money in escrow" },
  { key: "accepted", label: "Runner assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "proof_submitted", label: "Proof sent" },
  { key: "completed", label: "Released to runner" },
];

const ORDER = ["awaiting_payment", "funded", "accepted", "picked_up", "proof_submitted", "completed"];

export default async function ErrandDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user!.id;

  const { data: errand } = await supabase
    .from("errands")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!errand) notFound();
  const e = errand as ErrandRow;

  const { data: placeRows } = await supabase
    .from("places")
    .select("*")
    .in("id", [e.pickup_id, e.dropoff_id]);
  const places = Object.fromEntries(
    ((placeRows ?? []) as Place[]).map((p) => [p.id, p])
  );

  const { data: ledgerRows } = await supabase
    .from("escrow_ledger")
    .select("*")
    .eq("errand_id", e.id)
    .order("created_at");
  const ledger = (ledgerRows ?? []) as LedgerRow[];

  const isRequester = e.requester_id === me;
  const isRunner = e.runner_id === me;
  const stageIndex = ORDER.indexOf(e.status);

  return (
    <>
      <TopBar title="Errand" back={isRunner ? "/run" : "/errands"} />
      <main className="space-y-5 px-4 py-4 pb-28">
        <div>
          <h2 className="display text-xl font-bold leading-snug">{e.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={e.status === "completed" ? "green" : "navy"}>
              {STATUS_LABEL[e.status] ?? e.status}
            </Badge>
            <Badge>{CATEGORY_LABEL[e.category]}</Badge>
            <span className="text-xs text-muted">{timeAgo(e.created_at)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex flex-col items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-navy" />
              <span className="my-1 h-8 w-px bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
            </div>
            <div className="flex-1 space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted">Pick up</p>
                <p className="font-semibold">{places[e.pickup_id]?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Deliver to</p>
                <p className="font-semibold">{places[e.dropoff_id]?.name}</p>
              </div>
            </div>
          </div>
          {e.instructions && (
            <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">
              {e.instructions}
            </p>
          )}
        </div>

        <ol className="rounded-2xl border border-line bg-white px-4 py-3">
          {STEPS.map((s) => {
            const done = ORDER.indexOf(s.key) <= stageIndex;
            return (
              <li key={s.key} className="flex items-center gap-3 py-1.5">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                    done ? "bg-green text-white" : "bg-paper text-muted"
                  }`}
                >
                  {done ? "\u2713" : ""}
                </span>
                <span className={`text-sm ${done ? "font-semibold" : "text-muted"}`}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>

        <Receipt
          distanceKm={Number(e.distance_km)}
          baseFee={e.base_fee}
          distanceFee={e.distance_fee}
          complexityFee={e.complexity_fee}
          serviceFee={e.service_fee}
          transportFee={e.transport_fee}
          totalAmount={e.total_amount}
          runamFee={e.runam_fee}
          runnerPayout={e.runner_payout}
          showRunnerView={isRunner}
        />

        {e.proof_url && (
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Proof from the runner
            </p>
            {e.proof_note && <p className="text-sm">{e.proof_note}</p>}
            <a
              href={e.proof_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-green-dark underline"
            >
              Open the photo
            </a>
          </div>
        )}

        {ledger.length > 0 && (
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Escrow activity
            </p>
            <ul className="space-y-1.5">
              {ledger.map((l) => (
                <li key={l.id} className="flex justify-between text-sm">
                  <span className="text-muted">{l.note || l.entry_type}</span>
                  <span className="tnum">{naira(l.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Actions errand={e} isRequester={isRequester} isRunner={isRunner} />
      </main>
    </>
  );
}
