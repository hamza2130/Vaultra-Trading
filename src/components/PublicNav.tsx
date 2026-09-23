"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-raised">
      <div className="mx-auto flex h-[62px] max-w-[1240px] items-center gap-7 px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold text-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-ink text-sm font-extrabold text-[#04140F]">
            V
          </span>
          Vaultra
        </Link>
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
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-[13.5px] font-bold text-text-dim hover:text-text"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-3.5 py-2 text-[13.5px] font-bold text-[#04140F] hover:bg-accent-ink"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
