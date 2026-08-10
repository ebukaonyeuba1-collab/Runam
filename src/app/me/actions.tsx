"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Notice, inputClass } from "@/components/Bits";
import type { Profile } from "@/lib/types";

export default function MeActions({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitNin() {
    setBusy(true);
    await fetch("/api/profile/nin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nin }),
    });
    setBusy(false);
    setNin("");
    router.refresh();
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-4">
      {!profile.nin_verified && (
        <div className="space-y-3 rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-semibold">Verify your NIN</p>
          <p className="text-xs text-muted">
            Needed to unlock higher value errands and the transport advance.
          </p>
          <input
            className={inputClass}
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
            inputMode="numeric"
            placeholder="11 digit NIN"
          />
          <Button onClick={submitNin} disabled={busy || nin.length !== 11}>
            {busy ? "Checking" : "Submit NIN"}
          </Button>
          <Notice tone="warn">
            Pilot build: this records the last four digits and marks you verified.
            Wire it to a licensed NIMC verification provider before launch.
          </Notice>
        </div>
      )}

      <Button variant="ghost" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
