/**
 * RunAm pricing engine. Rules based, on purpose.
 *
 * There is no model here and there should not be one until there is data to
 * train it on. Every completed errand writes a labelled row (quote, geometry,
 * accepted or countered, time taken). When that table is large enough, this
 * file is what gets replaced.
 *
 * Two rules that must not be broken:
 *   1. Transport is passed through whole. RunAm never takes a cut of petrol.
 *   2. The requester sees every line before they commit.
 */

export type Category = "simple" | "purchase" | "queue" | "multi_stop";

export const CATEGORY_LABEL: Record<Category, string> = {
  simple: "Pick up and deliver",
  purchase: "Buy something for me",
  queue: "Queue or wait on my behalf",
  multi_stop: "Several stops",
};

export const CATEGORY_HINT: Record<Category, string> = {
  simple: "Collect an item or document and bring it over.",
  purchase: "Runner buys with escrow money and sends the receipt.",
  queue: "Bank, government office, utility desk. Time on their feet.",
  multi_stop: "Two or more pickups before the drop.",
};

const BASE_FEE = 500;
const PER_KM = 120;
const TRANSPORT_PER_KM = 100;
const TRANSPORT_FLOOR = 200;
const TAKE_RATE = 0.12;

const COMPLEXITY: Record<Category, number> = {
  simple: 1.0,
  purchase: 1.3,
  queue: 1.6,
  multi_stop: 1.8,
};

/** Round to the nearest 50 naira. Nobody quotes N1,437 in a market. */
const round50 = (n: number) => Math.round(n / 50) * 50;

export type Quote = {
  distanceKm: number;
  baseFee: number;
  distanceFee: number;
  complexityFee: number;
  serviceFee: number;
  transportFee: number;
  totalAmount: number;
  runamFee: number;
  runnerPayout: number;
};

export function quote(args: {
  distanceKm: number;
  category: Category;
  peakHour?: boolean;
}): Quote {
  const { distanceKm, category, peakHour = false } = args;

  const baseFee = BASE_FEE;
  const distanceFee = round50(distanceKm * PER_KM);
  const multiplier = COMPLEXITY[category] * (peakHour ? 1.15 : 1);

  const preComplexity = baseFee + distanceFee;
  const complexityFee = round50(preComplexity * (multiplier - 1));
  const serviceFee = baseFee + distanceFee + complexityFee;

  // Transport is estimated from the errand leg itself. It belongs to whoever
  // spends it, so it is quoted separately and never touched by the fee.
  const transportFee = Math.max(
    TRANSPORT_FLOOR,
    round50(distanceKm * TRANSPORT_PER_KM)
  );

  const totalAmount = serviceFee + transportFee;
  const runamFee = Math.round(serviceFee * TAKE_RATE);
  const runnerPayout = totalAmount - runamFee;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    baseFee,
    distanceFee,
    complexityFee,
    serviceFee,
    transportFee,
    totalAmount,
    runamFee,
    runnerPayout,
  };
}

/** A runner may counter once, and never by more than 40 percent. */
export const COUNTER_CAP = 0.4;

export function counterCeiling(totalAmount: number): number {
  return Math.round(totalAmount * (1 + COUNTER_CAP));
}

/** Recompute the split when a counter offer is accepted. */
export function repriceFromTotal(q: Quote, newTotal: number): Quote {
  const serviceFee = newTotal - q.transportFee;
  const runamFee = Math.round(serviceFee * TAKE_RATE);
  return {
    ...q,
    serviceFee,
    totalAmount: newTotal,
    runamFee,
    runnerPayout: newTotal - runamFee,
  };
}

export const COUNTER_REASONS = [
  { value: "breaks_my_route", label: "This breaks my route" },
  { value: "long_queue_expected", label: "That office has a long queue" },
  { value: "multiple_stops", label: "This needs more stops than listed" },
  { value: "item_cost_higher", label: "The item costs more than stated" },
] as const;

export type CounterReason = (typeof COUNTER_REASONS)[number]["value"];
