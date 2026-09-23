"use client";

import { useEffect, useState } from "react";
import { CandleChart } from "@/components/CandleChart";
import { formatPrice, type Candle, type Ticker } from "@/lib/market";

const POLL_MS = 5000;

export function HomeChart({ initialTicker, initialCandles }: { initialTicker: Ticker; initialCandles: Candle[] }) {
  const [ticker, setTicker] = useState(initialTicker);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/market/tickers", { cache: "no-store" });
        if (!res.ok) return;
        const all = (await res.json()) as Ticker[];
        const next = all.find((t) => t.symbol === "BTC");
        if (next && !cancelled) setTicker(next);
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

  const up = ticker.changePct >= 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7A93B] font-display text-[11px] font-extrabold text-white">
            BTC
          </span>
          <div>
            <div className="text-[13px] font-bold text-text">Bitcoin / USDT</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-bold tabular-nums text-text">{formatPrice(ticker.price)}</span>
              <span className={`font-mono text-[12px] font-semibold tabular-nums ${up ? "text-pos" : "text-neg"}`}>
                {up ? "+" : ""}
                {ticker.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-pos" />
          Live
        </span>
      </div>
      <CandleChart symbol="BTC" timeframe="1D" initialCandles={initialCandles} />
    </div>
  );
}
