"use client";

import { useState, useTransition } from "react";
import { Button, ErrorNote, Modal, StatusPill } from "@/components/ui";
import { approveDeposit, fulfillWithdrawal, getProofUrl, rejectDeposit, rejectWithdrawal } from "./actions";

export type QueueRow = {
  id: string;
  kind: "deposit" | "withdrawal";
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  address: string;
  rejectReason: string | null;
  hasPayoutProof: boolean;
};

type Action = { type: "approveDeposit" | "rejectDeposit" | "fulfill" | "rejectWithdrawal"; row: QueueRow };

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function RequestsClient({ deposits, withdrawals }: { deposits: QueueRow[]; withdrawals: QueueRow[] }) {
  const [tab, setTab] = useState<"deposit" | "withdrawal">("deposit");
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = tab === "deposit" ? deposits : withdrawals;
  const pendingCount = (list: QueueRow[]) => list.filter((r) => r.status === "pending").length;

  function open(type: Action["type"], row: QueueRow) {
    setAction({ type, row });
    setReason("");
    setFile(null);
    setError(null);
  }

  function viewProof(row: QueueRow) {
    startTransition(async () => {
      const res = await getProofUrl(row.kind, row.id);
      if (res.url) window.open(res.url, "_blank", "noopener");
      else setError(res.error ?? "Could not open the proof.");
    });
  }

  function confirm() {
    if (!action) return;
    setError(null);

    if (action.type === "fulfill" && !file) {
      setError("Upload the payout screenshot first — it's sent to the user.");
      return;
    }
    if (action.type === "rejectWithdrawal" && !reason.trim()) {
      setError("Write a reason — the user will see it.");
      return;
    }

    startTransition(async () => {
      let res: { error?: string };
      if (action.type === "approveDeposit") res = await approveDeposit(action.row.id);
      else if (action.type === "rejectDeposit") res = await rejectDeposit(action.row.id);
      else if (action.type === "rejectWithdrawal") res = await rejectWithdrawal(action.row.id, reason);
      else {
        const fd = new FormData();
        fd.set("requestId", action.row.id);
        fd.set("proof", file as File);
        res = await fulfillWithdrawal(fd);
      }
      if (res.error) setError(res.error);
      else setAction(null);
    });
  }

  const titles: Record<Action["type"], string> = {
    approveDeposit: "Approve deposit",
    rejectDeposit: "Reject deposit",
    fulfill: "Approve withdrawal",
    rejectWithdrawal: "Reject withdrawal",
  };
  const confirmLabels: Record<Action["type"], string> = {
    approveDeposit: "Approve & credit balance",
    rejectDeposit: "Reject deposit",
    fulfill: "Approve & send proof to user",
    rejectWithdrawal: "Reject & notify user",
  };

  return (
    <div>
      <div className="mb-5 flex gap-6 border-b border-border">
        {(["deposit", "withdrawal"] as const).map((t) => {
          const n = pendingCount(t === "deposit" ? deposits : withdrawals);
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex items-center gap-2 pb-2.5 text-[13.5px] font-bold ${tab === t ? "text-text" : "text-text-faint"}`}
            >
              {t === "deposit" ? "Deposits" : "Withdrawals"}
              {n > 0 ? <span className="rounded-full bg-warn-soft px-1.5 py-0.5 font-mono text-[11px] text-warn">{n}</span> : null}
              {tab === t ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-faint">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">{tab === "deposit" ? "Proof" : "Send to"}</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border-soft align-top last:border-none">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 font-display text-[10.5px] font-bold text-text-dim">
                      {initials(r.userName)}
                    </span>
                    <div>
                      <div className="text-[13px] font-bold text-text">{r.userName}</div>
                      <div className="text-[11.5px] text-text-faint">{r.userEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-text">
                  {r.amount.toFixed(2)} {r.currency}
                </td>
                <td className="px-4 py-3">
                  {r.kind === "deposit" ? (
                    <button onClick={() => viewProof(r)} className="text-[12.5px] font-semibold text-info hover:underline">
                      View proof ↗
                    </button>
                  ) : (
                    <span className="break-all font-mono text-[11.5px] text-text-dim">{r.address}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-text-dim">
                  {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={r.status} />
                  {r.rejectReason ? (
                    <div className="mt-1 max-w-[180px] text-[11.5px] text-text-faint">Reason: {r.rejectReason}</div>
                  ) : null}
                  {r.hasPayoutProof ? (
                    <button onClick={() => viewProof(r)} className="mt-1 block text-[12px] font-semibold text-info hover:underline">
                      View sent proof ↗
                    </button>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {r.status === "pending" ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => open(r.kind === "deposit" ? "approveDeposit" : "fulfill", r)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => open(r.kind === "deposit" ? "rejectDeposit" : "rejectWithdrawal", r)}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-text-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[12.5px] text-text-faint">
                  No {tab === "deposit" ? "deposit" : "withdrawal"} requests yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {!action && error ? <div className="mt-3"><ErrorNote>{error}</ErrorNote></div> : null}

      {action ? (
        <Modal
          title={titles[action.type]}
          onClose={() => setAction(null)}
          footer={
            <>
              <Button size="sm" variant="ghost" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={action.type.startsWith("reject") ? "danger" : "primary"}
                disabled={pending}
                onClick={confirm}
              >
                {pending ? "Working…" : confirmLabels[action.type]}
              </Button>
            </>
          }
        >
          <p className="mb-3 text-[13px] text-text-dim">
            <span className="font-semibold text-text">{action.row.userName}</span> ·{" "}
            <span className="font-mono">{action.row.amount.toFixed(2)} {action.row.currency}</span>
          </p>

          {action.type === "approveDeposit" ? (
            <p className="text-[13px] leading-relaxed text-text-dim">
              This adds {action.row.amount.toFixed(2)} to the user&apos;s balance and records it in the
              balance ledger. Only approve after you&apos;ve checked the payment proof and confirmed the
              funds arrived.
            </p>
          ) : null}
          {action.type === "rejectDeposit" ? (
            <p className="text-[13px] leading-relaxed text-text-dim">
              The deposit is marked rejected and no balance is added.
            </p>
          ) : null}
          {action.type === "fulfill" ? (
            <div>
              <p className="mb-2.5 text-[13px] leading-relaxed text-text-dim">
                Send the funds to <span className="break-all font-mono text-[12px]">{action.row.address}</span>,
                then upload a screenshot of the payout. The user sees it, and their balance is reduced by{" "}
                {action.row.amount.toFixed(2)}.
              </p>
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-[1.5px] border-dashed border-border px-4 py-6 text-center text-[12.5px] text-text-dim hover:border-accent hover:text-accent-ink">
                <span className="font-semibold">{file ? `✓ ${file.name}` : "Click to upload payout screenshot"}</span>
                <span className="text-[11.5px] text-text-faint">PNG, JPG, WebP or PDF · up to 6MB</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          ) : null}
          {action.type === "rejectWithdrawal" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-dim">Reason for rejection</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="e.g. The address doesn't match the name on your KYC document"
                className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
              />
              <p className="text-[11.5px] text-text-faint">The user sees this reason on their Account page.</p>
            </div>
          ) : null}
          {error ? <div className="mt-3"><ErrorNote>{error}</ErrorNote></div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
