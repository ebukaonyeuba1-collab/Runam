"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptErrand, startErrand, completeErrand } from "@/lib/actions/runner-actions";
import type { ErrandStatus } from "@/types/database.types";

export function RunnerJobAction({ errandId, status }: { errandId: string; status: ErrandStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action(errandId);
      if (result.success) router.refresh();
    });
  }

  if (status === "open") {
    return (
      <Button size="sm" isLoading={isPending} onClick={() => run(acceptErrand)}>
        Accept Job
      </Button>
    );
  }

  if (status === "accepted") {
    return (
      <Button size="sm" variant="secondary" isLoading={isPending} onClick={() => run(startErrand)}>
        Start Errand
      </Button>
    );
  }

  if (status === "in_progress") {
    return (
      <Button size="sm" isLoading={isPending} onClick={() => run(completeErrand)}>
        Mark Complete
      </Button>
    );
  }

  return null;
}
