export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "warn" | "navy";
}) {
  const tones = {
    neutral: "bg-paper text-muted border-line",
    green: "bg-green-light text-green-dark border-green/30",
    warn: "bg-[#FFF3E0] text-[#8A5300] border-[#F0C68A]",
    navy: "bg-navy text-white border-navy",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-green";

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-green text-white disabled:bg-line disabled:text-muted",
    ghost: "border border-line bg-white text-ink",
    danger: "border border-[#E0B4B4] bg-white text-[#A83232]",
  } as const;
  return (
    <button
      {...props}
      className={`w-full rounded-xl px-4 py-3 text-[15px] font-semibold transition-opacity active:opacity-80 ${styles[variant]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: React.ReactNode;
}) {
  return (
    <p
      className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
        tone === "warn"
          ? "bg-[#FFF3E0] text-[#8A5300]"
          : "bg-paper text-muted"
      }`}
    >
      {children}
    </p>
  );
}
