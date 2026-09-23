import { Card } from "@/components/ui";

export type PnlItem = { id: string; date: string; amount: number; note: string | null };

const usd = (n: number) =>
  (n >= 0 ? "+" : "−") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PnlHistory({ items }: { items: PnlItem[] }) {
  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-extrabold text-text">Daily PnL</h3>
        {items.length > 0 ? (
          <span className={`font-mono text-[13px] font-bold tabular-nums ${total >= 0 ? "text-pos" : "text-neg"}`}>
            {usd(total)}
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-[12.5px] text-text-dim">
        Posted by the Vaultra team as your managed account performs. Not a projection or a guarantee.
      </p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-text-faint">No PnL posted yet.</p>
      ) : (
        <div className="divide-y divide-border-soft">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="font-mono text-[12px] text-text-dim">{i.date}</div>
                {i.note ? <div className="text-[12px] text-text-faint">{i.note}</div> : null}
              </div>
              <span className={`font-mono text-[13px] font-bold tabular-nums ${i.amount >= 0 ? "text-pos" : "text-neg"}`}>
                {usd(i.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
