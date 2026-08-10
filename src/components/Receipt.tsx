import { naira, km } from "@/lib/format";

type Line = { label: string; value: string; strong?: boolean; hint?: string };

/**
 * The itemised quote. This is the product promise made visible: the requester
 * sees every naira before they commit, and sees that transport is passed
 * through untouched.
 */
export function Receipt({
  distanceKm,
  baseFee,
  distanceFee,
  complexityFee,
  serviceFee,
  transportFee,
  totalAmount,
  runamFee,
  runnerPayout,
  showRunnerView = false,
}: {
  distanceKm: number;
  baseFee: number;
  distanceFee: number;
  complexityFee: number;
  serviceFee: number;
  transportFee: number;
  totalAmount: number;
  runamFee: number;
  runnerPayout: number;
  showRunnerView?: boolean;
}) {
  const lines: Line[] = [
    { label: "Base", value: naira(baseFee) },
    { label: `Distance, ${km(distanceKm)}`, value: naira(distanceFee) },
  ];
  if (complexityFee > 0) {
    lines.push({ label: "Task difficulty", value: naira(complexityFee) });
  }
  lines.push({ label: "Service", value: naira(serviceFee), strong: true });
  lines.push({
    label: "Transport",
    value: naira(transportFee),
    hint: "Passed through whole. RunAm takes nothing from this.",
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="receipt px-4 py-3">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          What you pay
        </p>
        <dl className="space-y-0">
          {lines.map((l) => (
            <div key={l.label} className="flex h-7 items-center justify-between">
              <dt
                className={`text-sm ${
                  l.strong ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {l.label}
              </dt>
              <dd
                className={`tnum text-sm ${
                  l.strong ? "font-semibold text-ink" : "text-ink"
                }`}
              >
                {l.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-center justify-between border-t-2 border-dashed border-line bg-paper px-4 py-3">
        <span className="display text-sm font-bold">Total</span>
        <span className="tnum display text-xl font-bold">{naira(totalAmount)}</span>
      </div>

      <div className="space-y-1 border-t border-line px-4 py-3 text-xs text-muted">
        <div className="flex justify-between">
          <span>RunAm fee, 12% of service</span>
          <span className="tnum">{naira(runamFee)}</span>
        </div>
        <div className="flex justify-between font-semibold text-green-dark">
          <span>{showRunnerView ? "You keep" : "Runner keeps"}</span>
          <span className="tnum">{naira(runnerPayout)}</span>
        </div>
      </div>
    </div>
  );
}
