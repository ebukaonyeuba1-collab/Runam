import Link from "next/link";

export function TopBar({
  title,
  back,
  right,
}: {
  title: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-navy-600/30 bg-navy px-4 py-3 text-white">
      {back && (
        <Link href={back} aria-label="Go back" className="-ml-1 p-1 text-white/70">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}
      <h1 className="display flex-1 text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}

const TABS = [
  { href: "/errands", label: "Errands" },
  { href: "/run", label: "Run" },
  { href: "/wallet", label: "Escrow" },
  { href: "/me", label: "Me" },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white">
      {TABS.map((t) => {
        const on = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`py-3 text-center text-xs font-semibold tracking-wide ${
              on ? "text-green-dark" : "text-muted"
            }`}
          >
            <span
              className={`mx-auto mb-1 block h-0.5 w-6 rounded-full ${
                on ? "bg-green" : "bg-transparent"
              }`}
            />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="min-h-[calc(100vh-116px)] px-4 py-4">{children}</main>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
      <p className="display text-base font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
