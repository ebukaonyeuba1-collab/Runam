"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/Bits";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { error } = signup
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push(params.get("next") ?? "/errands");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col bg-navy px-6 py-12 text-white">
      <h1 className="display text-3xl font-bold">
        {signup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-white/60">
        {signup
          ? "You can post errands and run them from the same account."
          : "Sign in to pick up where you left off."}
      </p>

      <div className="mt-8 space-y-4 [&_span]:text-white">
        {signup && (
          <>
            <Field label="Your name">
              <input
                className={inputClass + " text-ink"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass + " text-ink"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="0803..."
                autoComplete="tel"
              />
            </Field>
          </>
        )}
        <Field label="Email">
          <input
            className={inputClass + " text-ink"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass + " text-ink"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-[#3A1C1C] px-3 py-2.5 text-xs text-[#FFB4B4]">
            {error}
          </p>
        )}

        <Button onClick={submit} disabled={busy || !email || !password}>
          {busy ? "One moment" : signup ? "Create account" : "Sign in"}
        </Button>

        <button
          onClick={() => {
            setSignup(!signup);
            setError(null);
          }}
          className="w-full py-2 text-center text-sm text-white/60 underline"
        >
          {signup ? "I already have an account" : "Create an account instead"}
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
