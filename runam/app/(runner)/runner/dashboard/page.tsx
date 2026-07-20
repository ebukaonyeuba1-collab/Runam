import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Wallet, Star, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RunnerJobAction } from "@/components/errands/runner-job-action";
import { formatNaira } from "@/lib/utils";
import type { Errand, RunnerProfile } from "@/types/database.types";

export default async function RunnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: runnerProfile }, { data: myJobs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("runner_profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("errands")
      .select("*")
      .eq("runner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const rp = runnerProfile as RunnerProfile | null;
  const jobs = (myJobs ?? []) as Errand[];
  const active = jobs.filter((j) => ["accepted", "in_progress"].includes(j.status));
  const completedToday = jobs.filter(
    (j) => j.status === "completed" && j.completed_at && new Date(j.completed_at).toDateString() === new Date().toDateString()
  );
  const todaysEarnings = completedToday.reduce((sum, j) => sum + Number(j.budget), 0);

  const stats = [
    { label: "Active Jobs", value: active.length, icon: Briefcase },
    { label: "Today's Earnings", value: formatNaira(todaysEarnings), icon: Wallet },
    { label: "Total Earnings", value: formatNaira(Number(rp?.total_earnings ?? 0)), icon: CheckCircle2 },
    { label: "Rating", value: rp?.rating_count ? rp.rating_avg.toFixed(1) : "New", icon: Star },
  ];

  return (
    <DashboardShell role="runner" fullName={profile?.full_name ?? "there"}>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-brand-navy">Verification status</p>
          <p className="text-xs capitalize text-brand-gray">{rp?.verification_status.replace("_", " ") ?? "pending"}</p>
        </div>
        {rp?.verification_status !== "verified" && (
          <Link href="/runner/verification" className="text-sm font-medium text-brand-green hover:underline">
            Complete verification
          </Link>
        )}
      </div>

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
          <h2 className="text-lg font-semibold text-brand-navy">My Jobs</h2>
          <Link href="/runner/jobs" className="text-sm font-medium text-brand-green hover:underline">
            Find available jobs
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title="No jobs yet"
            description="Browse available errands and accept your first job."
            action={
              <Link href="/runner/jobs" className="text-sm font-medium text-brand-green hover:underline">
                Browse available jobs →
              </Link>
            }
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
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-brand-navy">{formatNaira(Number(job.budget))}</span>
                  <StatusBadge status={job.status} />
                  <RunnerJobAction errandId={job.id} status={job.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
