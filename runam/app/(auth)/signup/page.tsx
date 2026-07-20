"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, User, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<"customer" | "runner">("customer");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "customer" },
  });

  function selectRole(next: "customer" | "runner") {
    setRole(next);
    setValue("role", next);
  }

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone: values.phone,
          role: values.role,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push(values.role === "runner" ? "/runner/dashboard" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gray-light px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card"
      >
        <Link href="/" className="mb-8 flex items-center gap-1 text-xl font-bold">
          <span className="text-brand-green">R</span>
          <span className="text-brand-navy">UNAM</span>
        </Link>

        <h1 className="text-2xl font-semibold text-brand-navy">Create your account</h1>
        <p className="mt-1 text-sm text-brand-gray">Get started with RunAm in a minute.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectRole("customer")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
              role === "customer"
                ? "border-brand-green bg-brand-green/5 text-brand-green"
                : "border-gray-200 text-brand-gray hover:border-gray-300"
            )}
          >
            <User className="h-5 w-5" />
            I need errands done
          </button>
          <button
            type="button"
            onClick={() => selectRole("runner")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
              role === "runner"
                ? "border-brand-green bg-brand-green/5 text-brand-green"
                : "border-gray-200 text-brand-gray hover:border-gray-300"
            )}
          >
            <Bike className="h-5 w-5" />
            I want to run errands
          </button>
        </div>

        {serverError && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <input type="hidden" {...register("role")} value={role} />
          <Input label="Full name" placeholder="Ada Okafor" error={errors.fullName?.message} {...register("fullName")} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <Input label="Phone number" placeholder="0803 123 4567" error={errors.phone?.message} {...register("phone")} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-gray">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-green hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
