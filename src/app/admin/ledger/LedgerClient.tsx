"use client";

import { useState, useTransition } from "react";
import { Button, Card, ErrorNote, Field, Modal, Select, TextInput } from "@/components/ui";
import { editBalance } from "./actions";

export type UserOption = { id: string; name: string; email: string; balance: number };
export type LedgerRow = {
  id: string;
  userId: string;
  userName: string;
  oldBalance: number;
  newBalance: number;
  changedBy: string;
  note: string | null;
  createdAt: string;
};

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function LedgerClient({ users, rows }: { users: UserOption[]; rows: LedgerRow[] }) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [newBalance, setNewBalance] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = users.find((u) => u.id === userId);
  const parsed = /^\d+(\.\d{1,2})?$/.test(newBalance.trim()) ? Number(newBalance.trim()) : null;
  const shown = filter === "all" ? rows : rows.filter((r) => r.userId === filter);

  function review() {
    setError(null);
    setSaved(null);
    if (!selected) return setError("Choose a user.");
    if (parsed === null) return setError("Enter the new balance as a number with up to 2 decimals.");
    if (parsed === selected.balance) return setError("That's already their balance.");
    setConfirming(true);
  }

  function apply() {
    startTransition(async () => {
      const res = await editBalance({ userId, newBalance, note });
      if (res.error) {
        setError(res.error);
        setConfirming(false);
        return;
      }
      setSaved(`${selected?.name}'s balance is now ${usd(parsed ?? 0)}.`);
      setConfirming(false);
      setNewBalance("");
      setNote("");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Manual balance edit</h3>
        <p className="mb-4 text-[12.5px] text-text-dim">
          Type the user&apos;s new balance directly. Every edit — this one and each approved deposit or
          fulfilled withdrawal — is recorded below with who made it and when.
        </p>
        {users.length === 0 ? (
          <p className="text-[13px] text-text-faint">No approved users yet.</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="User">
                <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {usd(u.balance)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="New balance (USD)" hint={selected ? `Current: ${usd(selected.balance)}` : undefined}>
                <TextInput value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="e.g. 4520.00" inputMode="decimal" />
              </Field>
            </div>
            <Field label="Note (optional)">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Weekly pool allocation" maxLength={200} />
            </Field>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            {saved ? (
              <p className="rounded-lg bg-pos-soft px-3 py-2 text-[12.5px] font-medium text-pos">{saved}</p>
            ) : null}
            <Button size="sm" onClick={review} className="self-start">
              Review change
            </Button>
          </div>
        )}
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-[15px] font-extrabold text-text">Balance ledger</h3>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!py-1.5 text-[13px]">
            <option value="all">All users</option>
            {[...new Map(rows.map((r) => [r.userId, r.userName])).entries()].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-faint">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">Old</th>
                <th className="px-4 py-3 text-right">New</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const delta = r.newBalance - r.oldBalance;
                return (
                  <tr key={r.id} className="border-b border-border-soft last:border-none">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-text-dim">
                      {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-text">{r.userName}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12.5px] tabular-nums text-text-dim">{usd(r.oldBalance)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12.5px] tabular-nums text-text">{usd(r.newBalance)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-[12.5px] font-semibold tabular-nums ${delta >= 0 ? "text-pos" : "text-neg"}`}>
                      {delta >= 0 ? "+" : "−"}
                      {usd(Math.abs(delta))}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-dim">{r.changedBy}</td>
                    <td className="px-4 py-3 text-[13px] text-text-dim">{r.note}</td>
                  </tr>
                );
              })}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12.5px] text-text-faint">
                    No balance changes yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {confirming && selected && parsed !== null ? (
        <Modal
          title="Confirm balance change"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={pending} onClick={apply}>
                {pending ? "Saving…" : "Apply & log change"}
              </Button>
            </>
          }
        >
          <p className="mb-3 text-[13px] text-text-dim">
            <span className="font-semibold text-text">{selected.name}</span>
          </p>
          <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface-2 py-4 font-mono text-[15px] tabular-nums">
            <span className="text-text-dim">{usd(selected.balance)}</span>
            <span className="text-text-faint">→</span>
            <span className="font-bold text-text">{usd(parsed)}</span>
            <span className={parsed >= selected.balance ? "text-pos" : "text-neg"}>
              ({parsed >= selected.balance ? "+" : "−"}
              {usd(Math.abs(parsed - selected.balance))})
            </span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-text-faint">
            This takes effect immediately and can&apos;t be undone — only corrected with another edit.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
