import * as React from "react";
import { cn } from "@/lib/utils";
import type { ErrandStatus } from "@/types/database.types";

const statusStyles: Record<ErrandStatus, string> = {
  open: "bg-blue-50 text-blue-700 ring-blue-200",
  accepted: "bg-amber-50 text-amber-700 ring-amber-200",
  in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  completed: "bg-green-50 text-brand-green ring-green-200",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  disputed: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels: Record<ErrandStatus, string> = {
  open: "Open",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

export function StatusBadge({ status }: { status: ErrandStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-gray-light px-2.5 py-1 text-xs font-medium text-brand-navy",
        className
      )}
      {...props}
    />
  );
}
