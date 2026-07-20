import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, Wallet, MapPin } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified runners",
    description: "Every runner completes ID, selfie, and bank verification before going live.",
  },
  {
    icon: Clock,
    title: "Fast turnaround",
    description: "Post an errand and get matched with a nearby runner in minutes, not hours.",
  },
  {
    icon: Wallet,
    title: "Secure payments",
    description: "Funds are held safely and released to your runner only after you confirm completion.",
  },
  {
    icon: MapPin,
    title: "Live tracking",
    description: "Follow your errand from pickup to drop-off with real-time status updates.",
  },
];

const steps = [
  { title: "Post your errand", description: "Tell us what you need done, your budget, and how urgent it is." },
  { title: "A runner accepts", description: "Verified runners near you pick up the job and confirm the details." },
  { title: "Track & pay", description: "Watch progress in real time and release payment once it's done." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-1 text-xl font-bold">
            <span className="text-brand-green">R</span>
            <span className="text-brand-navy">UNAM</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-brand-gray md:flex">
            <a href="#how-it-works" className="hover:text-brand-navy">How It Works</a>
            <Link href="/signup" className="hover:text-brand-navy">Become a Runner</Link>
            <a href="#faq" className="hover:text-brand-navy">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-brand-navy hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-brand-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-green-dark"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-brand-navy sm:text-6xl">
          Your errands. <span className="text-brand-green">Done</span> by trusted people.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-brand-gray">
          RunAm connects you with trusted runners who help you complete everyday errands quickly, securely, and affordably.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-green-dark"
          >
            Request an Errand <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-gray-light"
          >
            Become a Runner
          </Link>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-brand-gray-light/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-brand-navy sm:text-3xl">Why choose RunAm</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-6 shadow-card">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <f.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-brand-navy">{f.title}</p>
                <p className="mt-2 text-sm text-brand-gray">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold text-brand-navy sm:text-3xl">How it works</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-lg font-semibold text-white">
                {i + 1}
              </div>
              <p className="font-semibold text-brand-navy">{step.title}</p>
              <p className="mt-2 text-sm text-brand-gray">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-navy py-20 text-center text-white">
        <h2 className="text-2xl font-semibold sm:text-3xl">Ready to get your first errand done?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-300">
          Join thousands of Nigerians already using RunAm to save time every week.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark"
        >
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-brand-gray sm:flex-row">
          <span className="flex items-center gap-1 font-bold">
            <span className="text-brand-green">R</span>
            <span className="text-brand-navy">UNAM</span>
          </span>
          <p>© {new Date().getFullYear()} RunAm. Built for Nigeria.</p>
        </div>
      </footer>
    </div>
  );
}
