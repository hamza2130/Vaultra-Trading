"use client";

import { useState, useTransition } from "react";
import { Button, Card, ErrorNote, Field, Select, TextInput } from "@/components/ui";
import { deleteDailyPnl, setDailyPnl } from "./actions";

export type UserOption = { id: string; name: string; email: string };
export type PnlRow = {
  id: string;
  userId: string;
  userName: string;
  date: string;
  amount: number;
  note: string | null;
  postedBy: string;
  createdAt: string;
};

const usd = (n: number) =>
  (n >= 0 ? "+" : "−") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function today() {
  return new Date().toISOString().slice(0, 10);
}

const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/;

export function PnlClient({ users, rows }: { users: UserOption[]; rows: PnlRow[] }) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = users.find((u) => u.id === userId);
  const shown = filter === "all" ? rows : rows.filter((r) => r.userId === filter);

  function post() {
    setError(null);
    setSaved(null);
    if (!selected) return setError("Choose a user.");
    if (!AMOUNT_RE.test(amount.trim())) return setError("Enter an amount with up to 2 decimals (negative allowed).");
    startTransition(async () => {
      const res = await setDailyPnl({ userId, date, amount, note });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(`Posted ${usd(Number(amount))} for ${selected.name} on ${date}.`);
      setAmount("");
      setNote("");
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this PnL entry?")) return;
    startTransition(async () => {
      await deleteDailyPnl(id);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Post daily PnL</h3>
        <p className="mb-4 text-[12.5px] text-text-dim">
          One entry per user per day — posting again for the same date overwrites it. This is a
          record only; it does not change the user&apos;s balance.
        </p>
        {users.length === 0 ? (
          <p className="text-[13px] text-text-faint">No approved users yet.</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <Field label="User">
                <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <TextInput type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="PnL amount (USD)" hint="Negative for a loss day.">
                <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 42.50 or -18.00" inputMode="decimal" />
              </Field>
            </div>
            <Field label="Note (optional)">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. BTC swing trade" maxLength={200} />
            </Field>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            {saved ? (
              <p className="rounded-lg bg-pos-soft px-3 py-2 text-[12.5px] font-medium text-pos">{saved}</p>
            ) : null}
            <Button size="sm" onClick={post} disabled={pending} className="self-start">
              {pending ? "Posting…" : "Post entry"}
            </Button>
          </div>
        )}
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-[15px] font-extrabold text-text">PnL history</h3>
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
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">PnL</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Posted by</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-border-soft last:border-none">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-text-dim">{r.date}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-text">{r.userName}</td>
                  <td className={`px-4 py-3 text-right font-mono text-[12.5px] font-semibold tabular-nums ${r.amount >= 0 ? "text-pos" : "text-neg"}`}>
                    {usd(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-dim">{r.note}</td>
                  <td className="px-4 py-3 text-[13px] text-text-dim">{r.postedBy}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove(r.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[12.5px] text-text-faint">
                    No PnL entries yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
