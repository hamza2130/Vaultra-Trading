"use client";

import { useState, useTransition } from "react";
import { Card, StatusPill } from "@/components/ui";
import { getPayoutProofUrl } from "./request-actions";

export type RequestItem = {
  id: string;
  kind: "Deposit" | "Withdrawal";
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  rejectReason: string | null;
  hasPayoutProof: boolean;
};

export function RequestHistory({ items }: { items: RequestItem[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openProof(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await getPayoutProofUrl(id);
      if (res.url) window.open(res.url, "_blank", "noopener");
      else setError(res.error ?? "Could not open the proof.");
    });
  }

  return (
    <Card>
      <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Recent requests</h3>
      <p className="mb-3 text-[12.5px] text-text-dim">Status of your deposit and withdrawal requests.</p>
      {items.length === 0 ? (
        <p className="py-4 text-center text-[12.5px] text-text-faint">No requests yet.</p>
      ) : (
        <div className="divide-y divide-border-soft">
          {items.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <div className="text-[13px] font-semibold text-text">
                  {r.kind} · <span className="font-mono">{r.amount.toFixed(2)} {r.currency}</span>
                </div>
                <div className="font-mono text-[11.5px] text-text-faint">
                  {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                {r.status === "rejected" && r.rejectReason ? (
                  <div className="mt-1 max-w-[280px] text-[12px] text-neg">Reason: {r.rejectReason}</div>
                ) : null}
                {r.hasPayoutProof ? (
                  <button
                    onClick={() => openProof(r.id)}
                    disabled={pending}
                    className="mt-1 text-[12px] font-semibold text-info hover:underline disabled:opacity-50"
                  >
                    View payout proof ↗
                  </button>
                ) : null}
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}
      {error ? <p className="mt-2 text-[12px] text-neg">{error}</p> : null}
    </Card>
  );
}
