"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { coinColor, coinName, formatPrice, type Ticker } from "@/lib/market";

const POLL_MS = 5000;
const COUNT = 8;

export function HomeTicker({ initial }: { initial: Ticker[] }) {
  const [tickers, setTickers] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/market/tickers", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Ticker[];
        if (!cancelled) setTickers(data);
      } catch {
        // keep last known values
      }
    }
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const rows = tickers.slice(0, COUNT);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {rows.map((t) => {
        const up = t.changePct >= 0;
        return (
          <Link
            key={t.symbol}
            href={`/coin/${t.symbol}`}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 hover:border-accent"
          >
            <span
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-display text-[10px] font-extrabold text-white"
              style={{ background: coinColor(t.symbol) }}
            >
              {t.symbol.slice(0, 3)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold text-text">{coinName(t.symbol)}</div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11.5px] tabular-nums text-text-dim">{formatPrice(t.price)}</span>
                <span className={`font-mono text-[11px] font-semibold tabular-nums ${up ? "text-pos" : "text-neg"}`}>
                  {up ? "+" : ""}
                  {t.changePct.toFixed(2)}%
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
