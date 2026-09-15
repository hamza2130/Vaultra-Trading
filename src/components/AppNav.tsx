"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/account", label: "Account" },
];

export function AppNav({ displayName, isAdmin }: { displayName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-raised">
      <div className="mx-auto flex h-[62px] max-w-[1240px] items-center gap-7 px-6">
        <div className="flex items-center gap-2 font-display text-lg font-extrabold text-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-ink text-sm font-extrabold text-[#04140F]">
            V
          </span>
          Vaultra
        </div>
        <div className="flex flex-1 gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold ${
                  active ? "text-text" : "text-text-dim hover:bg-surface-2 hover:text-text"
                }`}
              >
                {link.label}
                {active ? (
                  <span className="absolute inset-x-3.5 -bottom-[9px] h-0.5 rounded-full bg-accent" />
                ) : null}
              </Link>
            );
          })}
          {isAdmin ? (
            <Link
              href="/admin"
              className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold ${
                pathname.startsWith("/admin") ? "text-text" : "text-text-dim hover:bg-surface-2 hover:text-text"
              }`}
            >
              Admin
              {pathname.startsWith("/admin") ? (
                <span className="absolute inset-x-3.5 -bottom-[9px] h-0.5 rounded-full bg-accent" />
              ) : null}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface py-[5px] pl-[5px] pr-2.5">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-ink font-display">
              {initials}
            </span>
            <span className="text-[12.5px] font-semibold text-text">{displayName}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-border text-text-dim hover:text-text"
              title="Sign out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
