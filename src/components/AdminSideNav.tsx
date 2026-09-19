"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
];

export function AdminSideNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] font-semibold ${
              active ? "bg-accent-soft text-accent-ink" : "text-text-dim hover:bg-surface-2 hover:text-text"
            }`}
          >
            {link.label}
            {link.href === "/admin/users" && pendingCount > 0 ? (
              <span className="rounded-full bg-warn-soft px-1.5 py-0.5 font-mono text-[11px] text-warn">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
