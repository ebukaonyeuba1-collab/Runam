/**
 * Runner tiers. This is the fraud control and the onboarding path at once.
 *
 * A brand new runner can steal nothing, because they never hold RunAm money:
 * they only see errands that sit on a route they were already travelling, so
 * their outlay is zero. Trust is earned in errands, not in paperwork.
 */

export type Tier = 1 | 2 | 3;

export type TierRule = {
  tier: Tier;
  name: string;
  maxErrandValue: number;
  maxDetourKm: number;
  transportAdvance: number;
  allowsPurchase: boolean;
  requirement: string;
};

export const TIERS: Record<Tier, TierRule> = {
  1: {
    tier: 1,
    name: "New runner",
    maxErrandValue: 5000,
    maxDetourKm: 1.5,
    transportAdvance: 0,
    allowsPurchase: false,
    requirement: "Complete 10 errands and verify your NIN to reach Verified.",
  },
  2: {
    tier: 2,
    name: "Verified",
    maxErrandValue: 20000,
    maxDetourKm: 5,
    transportAdvance: 1000,
    allowsPurchase: false,
    requirement: "Complete 40 errands to reach Trusted.",
  },
  3: {
    tier: 3,
    name: "Trusted",
    maxErrandValue: 100000,
    maxDetourKm: 25,
    transportAdvance: 3000,
    allowsPurchase: true,
    requirement: "You can take purchase errands and high value work.",
  },
};

export function tierOf(completed: number, ninVerified: boolean): Tier {
  if (completed >= 40 && ninVerified) return 3;
  if (completed >= 10 && ninVerified) return 2;
  return 1;
}

export function nextTierAt(tier: Tier): number | null {
  if (tier === 1) return 10;
  if (tier === 2) return 40;
  return null;
}

export type EligibilityResult = { eligible: true } | { eligible: false; reason: string };

export function canAccept(args: {
  tier: Tier;
  totalAmount: number;
  detourKm: number;
  category: string;
}): EligibilityResult {
  const rule = TIERS[args.tier];
  if (args.category === "purchase" && !rule.allowsPurchase) {
    return { eligible: false, reason: "Purchase errands open up at Trusted." };
  }
  if (args.totalAmount > rule.maxErrandValue) {
    return {
      eligible: false,
      reason: `Above your ${rule.name} limit of N${rule.maxErrandValue.toLocaleString()}.`,
    };
  }
  if (args.detourKm > rule.maxDetourKm) {
    return {
      eligible: false,
      reason: "Too far off the route you set. Set a route that passes it.",
    };
  }
  return { eligible: true };
}
