"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSideNav({
  pendingKyc,
  pendingRequests,
}: {
  pendingKyc: number;
  pendingRequests: number;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard", badge: 0 },
    { href: "/admin/users", label: "Users", badge: pendingKyc },
    { href: "/admin/requests", label: "Requests", badge: pendingRequests },
    { href: "/admin/wallets", label: "Wallets", badge: 0 },
    { href: "/admin/ledger", label: "Balance ledger", badge: 0 },
    { href: "/admin/pnl", label: "Daily PnL", badge: 0 },
    { href: "/admin/history", label: "History", badge: 0 },
  ];

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map((link) => {
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
            {link.badge > 0 ? (
              <span className="rounded-full bg-warn-soft px-1.5 py-0.5 font-mono text-[11px] text-warn">
                {link.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
