"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { coinColor, coinName, formatPrice, formatVolume, type Ticker } from "@/lib/market";

const POLL_MS = 5000;
const PAGE_SIZE = 50;
const HOT_COUNT = 30;

type Filter = "all" | "gainers" | "losers" | "hot";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
  { key: "hot", label: "Hot" },
];

export function MarketTable({
  initial,
  mode,
}: {
  initial: Ticker[];
  mode: "home" | "markets";
}) {
  const [tickers, setTickers] = useState(initial);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/market/tickers", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as Ticker[];
        if (!cancelled) {
          setTickers(data);
          setLive(true);
        }
      } catch {
        if (!cancelled) setLive(false);
      }
    }
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // The full list, before paging. Tickers arrive sorted by 24h volume.
  const matches = useMemo(() => {
    let list = tickers;
    if (mode === "home") {
      const q = query.trim().toLowerCase();
      if (q) {
        list = list.filter(
          (t) => t.symbol.toLowerCase().includes(q) || coinName(t.symbol).toLowerCase().includes(q),
        );
      }
    } else if (filter === "gainers") {
      list = list.filter((t) => t.changePct > 0).sort((a, b) => b.changePct - a.changePct);
    } else if (filter === "losers") {
      list = list.filter((t) => t.changePct < 0).sort((a, b) => a.changePct - b.changePct);
    } else if (filter === "hot") {
      list = [...list].sort((a, b) => b.trades - a.trades).slice(0, HOT_COUNT);
    }
    return list;
  }, [tickers, mode, filter, query]);

  const rows = matches.slice(0, limit);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {mode === "markets" ? (
          <div className="inline-flex gap-0.5 rounded-lg border border-border bg-surface-2 p-[3px]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setLimit(PAGE_SIZE);
                }}
                className={`rounded-md px-3.5 py-1.5 text-[13px] font-semibold ${
                  filter === f.key ? "bg-surface text-text shadow-sm" : "text-text-dim"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Search coin or ticker"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent sm:w-60"
          />
        )}
        <span className="flex items-center gap-3 text-[12px] font-semibold text-text-faint">
          <span>{matches.length} coins</span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-pos" : "bg-warn"}`} />
            {live ? "Live" : "Reconnecting…"}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-faint">
              <th className="px-4 py-3">Coin</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">24h change</th>
              <th className="px-4 py-3 text-right">24h volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const up = t.changePct >= 0;
              const name = coinName(t.symbol);
              return (
                <tr key={t.symbol} className="border-b border-border-soft last:border-none hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link href={`/coin/${t.symbol}`} className="flex items-center gap-2.5">
                      <span
                        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full font-display text-[10px] font-extrabold text-white"
                        style={{ background: coinColor(t.symbol) }}
                      >
                        {t.symbol.slice(0, 3)}
                      </span>
                      <span className="text-[13.5px] font-bold text-text">{name}</span>
                      {name !== t.symbol ? (
                        <span className="font-mono text-[12px] text-text-faint">{t.symbol}</span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13.5px] tabular-nums text-text">
                    {formatPrice(t.price)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-[13px] font-semibold tabular-nums ${
                      up ? "text-pos" : "text-neg"
                    }`}
                  >
                    {up ? "+" : ""}
                    {t.changePct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-text-dim">
                    {formatVolume(t.volume)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[12.5px] text-text-faint">
                  No coins match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {matches.length > limit ? (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-bold text-text hover:border-text-faint"
          >
            Show more ({matches.length - limit} remaining)
          </button>
        </div>
      ) : null}
    </div>
  );
}
