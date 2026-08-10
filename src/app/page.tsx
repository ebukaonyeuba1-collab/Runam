import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export default async function Landing() {
  const user = await requireUser();
  if (user) redirect("/errands");

  return (
    <main className="flex min-h-screen flex-col bg-navy px-6 py-12 text-white">
      <div className="flex-1">
        <p className="display text-[44px] font-bold leading-[1.05]">
          Errands,
          <br />
          run by someone
          <br />
          <span className="text-green">already going</span>
          <br />
          that way.
        </p>
        <p className="mt-6 max-w-[30ch] text-[15px] leading-relaxed text-white/70">
          Post the errand. Your money sits in escrow. It only moves when the job is
          proven done.
        </p>

        <ul className="mt-10 space-y-4">
          {[
            ["Priced on the route, not a flat rate", "You see every line before you pay."],
            ["Transport passed through whole", "RunAm never takes a cut of petrol."],
            ["Runners earn on the way home", "Switch to Run mode when an errand is on your path."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
              <div>
                <p className="text-[15px] font-semibold">{title}</p>
                <p className="text-sm text-white/60">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 space-y-3">
        <Link
          href="/login?mode=signup"
          className="block rounded-xl bg-green px-4 py-3.5 text-center text-[15px] font-semibold text-white"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="block rounded-xl border border-white/20 px-4 py-3.5 text-center text-[15px] font-semibold"
        >
          I already have one
        </Link>
        <p className="pt-2 text-center text-xs text-white/40">Warri and Effurun, pilot</p>
      </div>
    </main>
  );
}
