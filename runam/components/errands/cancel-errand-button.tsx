"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelErrand } from "@/lib/actions/errand-actions";

export function CancelErrandButton({ errandId }: { errandId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Cancel Errand
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-brand-gray">Are you sure?</span>
      <Button
        variant="danger"
        size="sm"
        isLoading={isPending}
        onClick={() =>
          startTransition(() => {
            void cancelErrand(errandId);
          })
        }
      >
        Yes, cancel
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Never mind
      </Button>
    </div>
  );
}
