export const naira = (n: number) => `\u20A6${Math.round(n).toLocaleString("en-NG")}`;

export const km = (n: number) => `${n.toFixed(1)} km`;

export function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Waiting for payment",
  funded: "In escrow, looking for a runner",
  accepted: "Runner assigned",
  picked_up: "Picked up",
  proof_submitted: "Proof sent, waiting on you",
  completed: "Released",
  disputed: "Disputed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
