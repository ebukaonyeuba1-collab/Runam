import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, Clock, CheckCircle2, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import type { Errand } from "@/types/database.types";

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: errands }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("errands")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const list = (errands ?? []) as Errand[];
  const active = list.filter((e) => ["open", "accepted", "in_progress"].includes(e.status));
  const completed = list.filter((e) => e.status === "completed");
  const totalSpent = completed.reduce((sum, e) => sum + Number(e.budget), 0);

  const stats = [
    { label: "Active Errands", value: active.length, icon: Clock },
    { label: "Completed", value: completed.length, icon: CheckCircle2 },
    { label: "Total Errands", value: list.length, icon: ListChecks },
    { label: "Total Spent", value: formatNaira(totalSpent), icon: Wallet },
  ];

  return (
    <DashboardShell role="customer" fullName={profile?.full_name ?? "there"}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-brand-gray">{stat.label}</p>
              <p className="text-lg font-semibold text-brand-navy">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-navy">Recent Errands</h2>
          <Link href="/errands" className="text-sm font-medium text-brand-green hover:underline">
            View all
          </Link>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="No errands yet"
            description="Post your first errand and a runner will pick it up shortly."
            action={
              <Link href="/errands/new">
                <Button>Post an Errand</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((errand) => (
              <Link key={errand.id} href={`/errands/${errand.id}`}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-brand-navy">{errand.title}</p>
                    <p className="mt-1 text-sm text-brand-gray">
                      {errand.pickup_location} → {errand.destination}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-brand-navy">{formatNaira(Number(errand.budget))}</span>
                    <StatusBadge status={errand.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
