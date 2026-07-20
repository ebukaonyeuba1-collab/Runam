import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import type { Errand } from "@/types/database.types";
import { ListChecks } from "lucide-react";

export default async function CustomerErrandsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: errands }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("errands").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
  ]);

  const list = (errands ?? []) as Errand[];

  return (
    <DashboardShell role="customer" fullName={profile?.full_name ?? "there"}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-navy">My Errands</h1>
        <Link href="/errands/new">
          <Button>Post an Errand</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
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
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
    </DashboardShell>
  );
}
