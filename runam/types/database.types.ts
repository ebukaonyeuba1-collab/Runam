export type UserRole = "customer" | "runner" | "admin";
export type ErrandStatus = "open" | "accepted" | "in_progress" | "completed" | "cancelled" | "disputed";
export type ErrandUrgency = "low" | "normal" | "urgent";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RunnerProfile {
  id: string;
  bio: string | null;
  is_available: boolean;
  verification_status: "pending" | "in_review" | "verified" | "rejected";
  id_document_url: string | null;
  selfie_url: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  rating_avg: number;
  rating_count: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Errand {
  id: string;
  customer_id: string;
  runner_id: string | null;
  category_id: string | null;
  title: string;
  description: string;
  pickup_location: string;
  destination: string;
  budget: number;
  urgency: ErrandUrgency;
  preferred_date: string | null;
  photo_url: string | null;
  status: ErrandStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Message {
  id: string;
  errand_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  created_at: string;
  seen_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  errand_id: string | null;
  type: "fund" | "withdraw" | "payment" | "payout" | "refund";
  amount: number;
  status: "pending" | "success" | "failed";
  reference: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; full_name: string }; Update: Partial<Profile> };
      runner_profiles: { Row: RunnerProfile; Insert: Partial<RunnerProfile> & { id: string }; Update: Partial<RunnerProfile> };
      categories: { Row: Category; Insert: Partial<Category> & { name: string }; Update: Partial<Category> };
      errands: { Row: Errand; Insert: Partial<Errand> & { customer_id: string; title: string; description: string; pickup_location: string; destination: string; budget: number }; Update: Partial<Errand> };
      messages: { Row: Message; Insert: Partial<Message> & { errand_id: string; sender_id: string; body: string }; Update: Partial<Message> };
      transactions: { Row: Transaction; Insert: Partial<Transaction> & { user_id: string; type: string; amount: number }; Update: Partial<Transaction> };
    };
  };
}
