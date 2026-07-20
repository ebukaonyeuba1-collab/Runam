import { notFound, redirect } from "next/navigation";
import { MapPin, Calendar, Wallet, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { CancelErrandButton } from "@/components/errands/cancel-errand-button";
import { formatNaira } from "@/lib/utils";
import type { Errand } from "@/types/database.types";

export default async function ErrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: errand }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("errands").select("*").eq("id", id).single(),
  ]);

  if (!errand) notFound();

  const e = errand as Errand;
  const runner = e.runner_id
    ? (await supabase.from("profiles").select("full_name, phone").eq("id", e.runner_id).single()).data
    : null;

  const timeline = [
    { label: "Errand posted", done: true, at: e.created_at },
    { label: "Runner accepted", done: !!e.runner_id, at: e.status !== "open" ? e.updated_at : null },
    { label: "In progress", done: ["in_progress", "completed"].includes(e.status), at: null },
    { label: "Completed", done: e.status === "completed", at: e.completed_at },
  ];

  return (
    <DashboardShell role="customer" fullName={profile?.full_name ?? "there"}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-navy">{e.title}</h1>
            <div className="mt-2">
              <StatusBadge status={e.status} />
            </div>
          </div>
          {["open", "accepted"].includes(e.status) && <CancelErrandButton errandId={e.id} />}
        </div>

        <Card className="mb-6">
          <p className="text-sm text-brand-gray">{e.description}</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-brand-green" />
              <div>
                <p className="text-xs text-brand-gray">Pickup</p>
                <p className="text-sm font-medium text-brand-navy">{e.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-brand-navy" />
              <div>
                <p className="text-xs text-brand-gray">Destination</p>
                <p className="text-sm font-medium text-brand-navy">{e.destination}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-4 w-4 text-brand-green" />
              <div>
                <p className="text-xs text-brand-gray">Budget</p>
                <p className="text-sm font-medium text-brand-navy">{formatNaira(Number(e.budget))}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-brand-gray">Urgency</p>
                <p className="text-sm font-medium capitalize text-brand-navy">{e.urgency}</p>
              </div>
            </div>
            {e.preferred_date && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-brand-gray" />
                <div>
                  <p className="text-xs text-brand-gray">Preferred date</p>
                  <p className="text-sm font-medium text-brand-navy">{e.preferred_date}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Runner</CardTitle>
          </CardHeader>
          {runner ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-sm font-semibold text-brand-green">
                {runner.full_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-brand-navy">{runner.full_name}</p>
                <p className="text-xs text-brand-gray">{runner.phone ?? "Phone not shared yet"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-gray">No runner has accepted this errand yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <ol className="flex flex-col gap-4">
            {timeline.map((step, i) => (
              <li key={step.label} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    step.done ? "bg-brand-green text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? "text-brand-navy" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {step.at && <p className="text-xs text-brand-gray">{new Date(step.at).toLocaleString()}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </DashboardShell>
  );
}
