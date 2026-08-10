import type { Category } from "./pricing";

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  nin_last4: string | null;
  nin_verified: boolean;
  completed_errands: number;
  runner_mode: boolean;
};

export type ErrandRow = {
  id: string;
  requester_id: string;
  runner_id: string | null;
  title: string;
  instructions: string;
  category: Category;
  pickup_id: string;
  dropoff_id: string;
  distance_km: number;
  base_fee: number;
  distance_fee: number;
  complexity_fee: number;
  service_fee: number;
  transport_fee: number;
  total_amount: number;
  runam_fee: number;
  runner_payout: number;
  status: string;
  counter_amount: number | null;
  counter_reason: string | null;
  counter_status: string | null;
  paystack_reference: string | null;
  proof_url: string | null;
  proof_note: string | null;
  created_at: string;
  funded_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
};

export type LedgerRow = {
  id: string;
  errand_id: string;
  entry_type:
    | "fund"
    | "transport_advance"
    | "release_runner"
    | "release_platform"
    | "refund";
  amount: number;
  note: string;
  created_at: string;
};
