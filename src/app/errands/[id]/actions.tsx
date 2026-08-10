"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Notice } from "@/components/Bits";
import { naira } from "@/lib/format";
import { COUNTER_REASONS } from "@/lib/pricing";
import type { ErrandRow } from "@/lib/types";

export default function Actions({
  errand: e,
  isRequester,
  isRunner,
}: {
  errand: ErrandRow;
  isRequester: boolean;
  isRunner: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  async function call(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "That did not go through. Try again.");
      return null;
    }
    router.refresh();
    return data;
  }

  const err = error && (
    <p className="rounded-xl bg-[#FDECEC] px-3 py-2.5 text-xs text-[#A83232]">
      {error}
    </p>
  );

  // ---------------------------------------------------------- requester side
  if (isRequester) {
    if (e.status === "awaiting_payment") {
      return (
        <div className="space-y-3">
          {err}
          <Button
            disabled={busy}
            onClick={async () => {
              const data = await call(`/api/errands/${e.id}/fund`);
              if (data?.authorization_url) location.href = data.authorization_url;
            }}
          >
            {busy ? "Opening checkout" : `Fund escrow, ${naira(e.total_amount)}`}
          </Button>
          <Notice>
            Nothing reaches the runner yet. This money is held until you confirm
            the errand is done.
          </Notice>
        </div>
      );
    }

    if (e.counter_status === "pending" && e.counter_amount) {
      const reason = COUNTER_REASONS.find((r) => r.value === e.counter_reason);
      return (
        <div className="space-y-3 rounded-2xl border border-[#F0C68A] bg-[#FFF9F0] p-4">
          <p className="text-sm font-semibold">The runner asked for more</p>
          <p className="text-sm text-muted">{reason?.label}</p>
          <p className="tnum display text-2xl font-bold">
            {naira(e.counter_amount)}
          </p>
          <p className="text-xs text-muted">
            Up from {naira(e.total_amount)}. You can only be asked once.
          </p>
          {err}
          <Button
            disabled={busy}
            onClick={() => call(`/api/errands/${e.id}/counter/respond`, { accept: true })}
          >
            Accept and pay the difference
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => call(`/api/errands/${e.id}/counter/respond`, { accept: false })}
          >
            Decline, keep the original price
          </Button>
        </div>
      );
    }

    if (e.status === "proof_submitted") {
      return (
        <div className="space-y-3">
          {err}
          <Button disabled={busy} onClick={() => call(`/api/errands/${e.id}/release`)}>
            {busy ? "Releasing" : `Confirm done, release ${naira(e.runner_payout)}`}
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              const reason = prompt("What went wrong?");
              if (reason) call(`/api/errands/${e.id}/dispute`, { reason });
            }}
          >
            Something is wrong, raise a dispute
          </Button>
        </div>
      );
    }

    if (e.status === "funded") {
      return (
        <Notice>
          Your money is held. Runners on a route that passes this errand can see
          it now.
        </Notice>
      );
    }
  }

  // ------------------------------------------------------------- runner side
  if (isRunner) {
    if (e.status === "accepted") {
      return (
        <div className="space-y-3">
          {err}
          <Button disabled={busy} onClick={() => call(`/api/errands/${e.id}/pickup`)}>
            {busy ? "Confirming" : "I have picked it up"}
          </Button>
          <Notice>
            Transport is released to you at pickup once you reach Verified. On your
            first errands, take only jobs already on your route.
          </Notice>
        </div>
      );
    }

    if (e.status === "picked_up") {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Send proof to finish</p>
          <input
            className="w-full rounded-xl border border-line px-3 py-2.5 text-[15px]"
            placeholder="Link to the photo or receipt"
            value={proofUrl}
            onChange={(ev) => setProofUrl(ev.target.value)}
          />
          <textarea
            className="min-h-[70px] w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[15px]"
            placeholder="Who you handed it to, anything they should know."
            value={proofNote}
            onChange={(ev) => setProofNote(ev.target.value)}
          />
          {err}
          <Button
            disabled={busy || !proofUrl}
            onClick={() => call(`/api/errands/${e.id}/proof`, { proofUrl, proofNote })}
          >
            {busy ? "Sending" : "Send proof"}
          </Button>
        </div>
      );
    }

    if (e.status === "proof_submitted") {
      return <Notice>Proof sent. You will be paid when the requester confirms.</Notice>;
    }
  }

  if (e.status === "completed") {
    return (
      <Notice>
        Done. {naira(e.runner_payout)} went to the runner and {naira(e.runam_fee)} to
        RunAm.
      </Notice>
    );
  }

  return null;
}
