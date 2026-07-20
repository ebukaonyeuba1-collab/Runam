import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { NewErrandForm } from "@/components/errands/new-errand-form";

export default async function NewErrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  return (
    <DashboardShell role="customer" fullName={profile?.full_name ?? "there"}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-brand-navy">Post an errand</h1>
        <p className="mt-1 text-sm text-brand-gray">
          Tell runners what you need done — the more detail, the faster you&apos;ll get offers.
        </p>
        <div className="mt-6">
          <NewErrandForm categories={categories ?? []} />
        </div>
      </div>
    </DashboardShell>
  );
}
