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
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition active:translate-y-px disabled:opacity-45 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-accent text-[#04140F] hover:bg-accent-ink",
    secondary: "border border-border text-text hover:border-text-faint",
    ghost: "text-text-dim hover:text-text",
    danger: "bg-neg-soft text-neg hover:bg-neg hover:text-white",
  };
  const sizes: Record<string, string> = {
    md: "px-4 py-2.5 text-sm",
    sm: "px-3 py-1.5 text-[12.5px]",
  };
  return <button {...props} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} />;
}

export function ErrorNote({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-neg-soft bg-neg-soft px-3 py-2 text-[12.5px] font-medium text-neg">
      {children}
    </p>
  );
}

const PILL_STYLES: Record<string, string> = {
  pending: "bg-warn-soft text-warn",
  approved: "bg-pos-soft text-pos",
  restricted: "bg-neg-soft text-neg",
  rejected: "bg-neg-soft text-neg",
  fulfilled: "bg-info-soft text-info",
  logged: "bg-info-soft text-info",
};

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-[15.5px] font-extrabold text-text">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-faint hover:bg-surface-2 hover:text-text"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const style = PILL_STYLES[key] ?? "bg-border-soft text-text-dim";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
