"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gray-light px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
        <Link href="/" className="mb-8 flex items-center gap-1 text-xl font-bold">
          <span className="text-brand-green">R</span>
          <span className="text-brand-navy">UNAM</span>
        </Link>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-brand-green" />
            <p className="font-semibold text-brand-navy">Check your inbox</p>
            <p className="text-sm text-brand-gray">
              We sent a password reset link to <span className="font-medium">{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-brand-navy">Reset your password</h1>
            <p className="mt-1 text-sm text-brand-gray">
              Enter the email linked to your account and we&apos;ll send you a reset link.
            </p>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Send Reset Link
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-brand-gray">
          <Link href="/login" className="font-medium text-brand-green hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
