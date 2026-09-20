"use client";

import { useMemo, useState } from "react";
import { Card, Select, StatusPill } from "@/components/ui";

export type HistoryRow = {
  id: string;
  userName: string;
  userEmail: string;
  type: string;
  detail: string;
  status: string;
  createdAt: string;
};

const PAGE = 50;

export function HistoryClient({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [limit, setLimit] = useState(PAGE);

  const types = useMemo(() => [...new Set(rows.map((r) => r.type))].sort(), [rows]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (type === "all" || r.type === type) &&
        (!q || `${r.userName} ${r.userEmail} ${r.detail}`.toLowerCase().includes(q)),
    );
  }, [rows, query, type]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-extrabold text-text">Full activity history</h3>
          <p className="text-[12.5px] text-text-dim">
            Every registration, deposit, withdrawal, balance edit and restriction, across all users.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search user or detail"
            className="w-52 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-text outline-none focus:border-accent"
          />
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setLimit(PAGE);
            }}
            className="!py-2 text-[13px]"
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-faint">
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Details</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {matches.slice(0, limit).map((r) => (
              <tr key={r.id} className="border-b border-border-soft align-top last:border-none">
                <td className="whitespace-nowrap px-3 py-3 font-mono text-[12px] text-text-dim">
                  {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-3 py-3">
                  <div className="text-[13px] font-bold text-text">{r.userName}</div>
                  {r.userEmail ? <div className="text-[11.5px] text-text-faint">{r.userEmail}</div> : null}
                </td>
                <td className="px-3 py-3 text-[13px] text-text">{r.type}</td>
                <td className="min-w-[220px] px-3 py-3 text-[13px] text-text-dim">{r.detail}</td>
                <td className="px-3 py-3">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
            {matches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-[12.5px] text-text-faint">
                  No matching activity.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-text-faint">
        <span>
          Showing {Math.min(limit, matches.length)} of {matches.length}
          {rows.length >= 500 ? " (most recent 500 events)" : ""}
        </span>
        {matches.length > limit ? (
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-bold text-text hover:border-text-faint"
          >
            Show more
          </button>
        ) : null}
      </div>
    </Card>
  );
}
