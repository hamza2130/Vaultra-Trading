import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-text-dim">{label}</label>
      {children}
      {hint ? <p className="text-[11.5px] text-text-faint">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:opacity-45 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-accent text-[#04140F] hover:bg-accent-ink",
    secondary: "border border-border text-text hover:border-text-faint",
    ghost: "text-text-dim hover:text-text",
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
}

export function ErrorNote({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-neg-soft bg-neg-soft px-3 py-2 text-[12.5px] font-medium text-neg">
      {children}
    </p>
  );
}
