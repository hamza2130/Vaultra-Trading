"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CandleChart } from "@/components/CandleChart";
import {
  TIMEFRAMES,
  coinColor,
  coinName,
  formatPrice,
  formatVolume,
  type Candle,
  type Ticker,
  type Timeframe,
} from "@/lib/market";

const POLL_MS = 5000;

export function CoinView({
  initialTicker,
  initialCandles,
}: {
  initialTicker: Ticker;
  initialCandles: Candle[];
}) {
  const [ticker, setTicker] = useState(initialTicker);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/market/tickers", { cache: "no-store" });
        if (!res.ok) return;
        const all = (await res.json()) as Ticker[];
        const next = all.find((t) => t.symbol === initialTicker.symbol);
        if (next && !cancelled) setTicker(next);
      } catch {
        // keep the last known values
      }
    }
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [initialTicker.symbol]);

  const up = ticker.changePct >= 0;

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-dim hover:text-text"
      >
        ← Back to market overview
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-extrabold text-white"
            style={{ background: coinColor(ticker.symbol) }}
          >
            {ticker.symbol.slice(0, 3)}
          </span>
          <h1 className="font-display text-[19px] font-extrabold text-text">{coinName(ticker.symbol)}</h1>
          <span className="font-mono text-[13px] text-text-faint">{ticker.symbol} / USDT</span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-[34px] font-bold tabular-nums text-text">
            {formatPrice(ticker.price)}
          </span>
          <span
            className={`font-mono text-[15px] font-semibold tabular-nums ${up ? "text-pos" : "text-neg"}`}
          >
            {up ? "+" : ""}
            {ticker.changePct.toFixed(2)}%
          </span>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-7">
          {[
            ["24h High", formatPrice(ticker.high)],
            ["24h Low", formatPrice(ticker.low)],
            ["24h Volume", formatVolume(ticker.volume)],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-text-faint">
                {label}
              </span>
              <span className="font-mono text-[13.5px] font-semibold tabular-nums text-text">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[13.5px] font-bold text-text-dim">
            Price chart <span className="font-mono text-text-faint">USDT</span>
          </span>
          <div className="flex gap-1">
            {(Object.keys(TIMEFRAMES) as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-md px-2.5 py-1.5 font-mono text-[12.5px] font-bold ${
                  timeframe === tf ? "bg-accent-soft text-accent-ink" : "text-text-faint hover:text-text"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <CandleChart
          symbol={ticker.symbol}
          timeframe={timeframe}
          initialCandles={initialCandles}
        />
      </div>

      <div className="mt-4 flex gap-2 rounded-lg bg-info-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-info">
        This chart is for reference only. Vaultra does not support order placement — the firm
        manages pooled trading on your behalf. See Account for deposits, withdrawals, and your
        balance.
      </div>
    </div>
  );
}
