"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Notice, inputClass } from "@/components/Bits";
import { Empty } from "@/components/Shell";
import { naira, km, STATUS_LABEL } from "@/lib/format";
import { COUNTER_REASONS, counterCeiling } from "@/lib/pricing";
import { detourKm, classifyGeometry, GEOMETRY_LABEL, type Place } from "@/lib/geo";
import { tierOf, TIERS, canAccept, nextTierAt } from "@/lib/tiers";
import type { ErrandRow, Profile } from "@/lib/types";

export default function RunBoard({
  profile,
  places,
  route,
  open,
  mine,
}: {
  profile: Profile;
  places: Place[];
  route: { origin_id: string; destination_id: string } | null;
  open: ErrandRow[];
  mine: ErrandRow[];
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(route?.origin_id ?? places[0]?.id ?? "");
  const [destination, setDestination] = useState(
    route?.destination_id ?? places[1]?.id ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!route);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterReason, setCounterReason] =
    useState<(typeof COUNTER_REASONS)[number]["value"]>("breaks_my_route");
  const [note, setNote] = useState<string | null>(null);

  const byId = useMemo(
    () => Object.fromEntries(places.map((p) => [p.id, p])),
    [places]
  );
  const tier = tierOf(profile.completed_errands, profile.nin_verified);
  const rule = TIERS[tier];
  const nextAt = nextTierAt(tier);

  const scored = useMemo(() => {
    if (!route) return [];
    const o = byId[route.origin_id];
    const d = byId[route.destination_id];
    if (!o || !d) return [];
    return open
      .map((e) => {
        const detour = detourKm(o, d, byId[e.pickup_id], byId[e.dropoff_id]);
        return {
          errand: e,
          detour,
          geometry: classifyGeometry(detour),
          check: canAccept({
            tier,
            totalAmount: e.total_amount,
            detourKm: detour,
            category: e.category,
          }),
        };
      })
      .sort((a, b) => a.detour - b.detour);
  }, [open, route, byId, tier]);

  async function saveRoute() {
    setBusy(true);
    await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function accept(id: string) {
    setBusy(true);
    setNote(null);
    const res = await fetch(`/api/errands/${id}/accept`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) router.push(`/errands/${id}`);
    else {
      setNote(data.error ?? "Could not take that errand.");
      router.refresh();
    }
  }

  async function sendCounter(id: string) {
    setBusy(true);
    setNote(null);
    const res = await fetch(`/api/errands/${id}/counter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(counterAmount), reason: counterReason }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setCounterFor(null);
      setCounterAmount("");
      setNote("Sent. The requester will answer once.");
      router.refresh();
    } else {
      setNote(data.error ?? "That offer did not go through.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-navy p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
              Your tier
            </p>
            <p className="display text-lg font-bold">{rule.name}</p>
          </div>
          <div className="text-right">
            <p className="tnum text-2xl font-bold">{profile.completed_errands}</p>
            <p className="text-[11px] text-white/50">errands done</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/60">
          Up to {naira(rule.maxErrandValue)} per errand, within {km(rule.maxDetourKm)}{" "}
          of your route.{" "}
          {nextAt
            ? `${nextAt - profile.completed_errands} more to move up.`
            : "You can take purchase errands."}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">The trip you are already making</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-green-dark underline"
            >
              Change
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <select
              className={inputClass}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  From {p.name}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  To {p.name}
                </option>
              ))}
            </select>
            <Button
              onClick={saveRoute}
              disabled={busy || origin === destination}
            >
              {busy ? "Saving" : "Show errands on this route"}
            </Button>
          </div>
        ) : (
          <p className="text-sm">
            <span className="font-semibold">{byId[route!.origin_id]?.name}</span>{" "}
            <span className="text-muted">to</span>{" "}
            <span className="font-semibold">
              {byId[route!.destination_id]?.name}
            </span>
          </p>
        )}
      </div>

      {mine.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">In progress</h2>
          <ul className="space-y-2">
            {mine.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/errands/${e.id}`}
                  className="flex items-center justify-between rounded-2xl border border-navy bg-navy/5 p-4"
                >
                  <span>
                    <span className="block font-semibold">{e.title}</span>
                    <span className="block text-xs text-muted">
                      {STATUS_LABEL[e.status]}
                    </span>
                  </span>
                  <span className="tnum font-semibold">{naira(e.runner_payout)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Errands near your route</h2>
        {note && (
          <p className="mb-3 rounded-xl bg-paper px-3 py-2.5 text-xs text-muted">{note}</p>
        )}

        {!route ? (
          <Notice>Set your trip above and RunAm will sort errands by how far each one pulls you off it.</Notice>
        ) : scored.length === 0 ? (
          <Empty
            title="Nothing on this route yet"
            body="Try a different trip, or check again when you are heading out."
          />
        ) : (
          <ul className="space-y-3">
            {scored.map(({ errand: e, detour, geometry, check }) => (
              <li
                key={e.id}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug">{e.title}</p>
                  <span className="tnum shrink-0 font-semibold text-green-dark">
                    {naira(e.runner_payout)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {byId[e.pickup_id]?.name} to {byId[e.dropoff_id]?.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={geometry === "route_aligned" ? "green" : "neutral"}>
                    {GEOMETRY_LABEL[geometry]}
                  </Badge>
                  <span className="text-xs text-muted">
                    {detour < 0.2 ? "no detour" : `${km(detour)} extra`}
                  </span>
                </div>

                {check.eligible ? (
                  <div className="mt-3 space-y-2">
                    <Button disabled={busy} onClick={() => accept(e.id)}>
                      Take this errand
                    </Button>

                    {counterFor === e.id ? (
                      <div className="space-y-2 rounded-xl border border-line p-3">
                        <p className="text-xs font-semibold">Why do you need more?</p>
                        {COUNTER_REASONS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setCounterReason(r.value)}
                            className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs ${
                              counterReason === r.value
                                ? "border-green bg-green-light font-semibold"
                                : "border-line"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                        <input
                          className={inputClass + " tnum"}
                          inputMode="numeric"
                          placeholder={`Up to ${naira(counterCeiling(e.total_amount))}`}
                          value={counterAmount}
                          onChange={(ev) =>
                            setCounterAmount(ev.target.value.replace(/\D/g, ""))
                          }
                        />
                        <p className="text-[11px] text-muted">
                          You can ask once, and only up to{" "}
                          {naira(counterCeiling(e.total_amount))}.
                        </p>
                        <Button
                          disabled={busy || !counterAmount}
                          onClick={() => sendCounter(e.id)}
                        >
                          Send offer
                        </Button>
                        <button
                          onClick={() => setCounterFor(null)}
                          className="w-full py-1 text-xs text-muted underline"
                        >
                          Never mind
                        </button>
                      </div>
                    ) : (
                      !e.counter_status && (
                        <button
                          onClick={() => setCounterFor(e.id)}
                          className="w-full py-1 text-xs font-semibold text-muted underline"
                        >
                          Ask for more
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-xs text-muted">
                    {check.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
