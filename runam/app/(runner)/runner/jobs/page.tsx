import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RunnerJobAction } from "@/components/errands/runner-job-action";
import { formatNaira } from "@/lib/utils";
import type { Errand } from "@/types/database.types";

export default async function AvailableJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: openJobs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("errands").select("*").eq("status", "open").order("created_at", { ascending: false }),
  ]);

  const jobs = (openJobs ?? []) as Errand[];

  return (
    <DashboardShell role="runner" fullName={profile?.full_name ?? "there"}>
      <h1 className="mb-6 text-2xl font-semibold text-brand-navy">Available Jobs</h1>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No open errands right now"
          description="Check back soon — new errands are posted throughout the day."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-brand-navy">{job.title}</p>
                <p className="mt-1 text-sm text-brand-gray">
                  {job.pickup_location} → {job.destination}
                </p>
                <p className="mt-1 text-xs capitalize text-brand-gray">{job.urgency} urgency</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-brand-navy">{formatNaira(Number(job.budget))}</span>
                <RunnerJobAction errandId={job.id} status={job.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
