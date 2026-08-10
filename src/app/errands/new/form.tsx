"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "@/components/Receipt";
import { Button, Field, Notice, inputClass } from "@/components/Bits";
import { distanceKm, type Place } from "@/lib/geo";
import {
  quote,
  CATEGORY_LABEL,
  CATEGORY_HINT,
  type Category,
} from "@/lib/pricing";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export default function NewErrandForm({ places }: { places: Place[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState<Category>("simple");
  const [pickup, setPickup] = useState(places[0]?.id ?? "");
  const [dropoff, setDropoff] = useState(places[1]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(
    () => Object.fromEntries(places.map((p) => [p.id, p])),
    [places]
  );

  const q = useMemo(() => {
    const a = byId[pickup];
    const b = byId[dropoff];
    if (!a || !b) return null;
    const d = distanceKm(a, b);
    const hour = new Date().getHours();
    return quote({
      distanceKm: d,
      category,
      peakHour: (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19),
    });
  }, [byId, pickup, dropoff, category]);

  const sameSpot = pickup === dropoff;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/errands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, instructions, category, pickup, dropoff }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Could not post the errand. Try again.");
      setBusy(false);
      return;
    }
    router.push(`/errands/${body.id}`);
  }

  return (
    <main className="space-y-5 px-4 py-4 pb-28">
      <Field label="What needs doing?">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Collect invoice from my supplier"
          maxLength={80}
        />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-semibold">Type of errand</span>
        <div className="space-y-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                category === c
                  ? "border-green bg-green-light"
                  : "border-line bg-white"
              }`}
            >
              <span className="block text-sm font-semibold">
                {CATEGORY_LABEL[c]}
              </span>
              <span className="block text-xs text-muted">{CATEGORY_HINT[c]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pick up at">
          <select
            className={inputClass}
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Deliver to">
          <select
            className={inputClass}
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Instructions for the runner" hint="Names, phone numbers, what to say at the counter.">
        <textarea
          className={inputClass + " min-h-[90px] resize-none"}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Ask for Mr Efe at the front desk. Invoice is in a brown envelope."
        />
      </Field>

      {sameSpot ? (
        <Notice tone="warn">
          Pick up and delivery are the same place. Choose two different points so
          the price can be worked out.
        </Notice>
      ) : (
        q && <Receipt {...q} />
      )}

      <Notice>
        Your money goes into escrow, not to the runner. It is released when you
        confirm the errand is done, and refunded in full if it is not.
      </Notice>

      {error && (
        <p className="rounded-xl bg-[#FDECEC] px-3 py-2.5 text-xs text-[#A83232]">
          {error}
        </p>
      )}

      <Button onClick={submit} disabled={busy || !title || sameSpot}>
        {busy ? "Posting" : "Post errand and fund escrow"}
      </Button>
    </main>
  );
}
