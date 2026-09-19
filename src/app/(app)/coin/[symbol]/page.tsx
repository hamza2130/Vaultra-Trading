import { notFound } from "next/navigation";
import { CoinView } from "@/components/CoinView";
import { fetchKlines, fetchTickers } from "@/lib/binance";
import type { Ticker } from "@/lib/market";

export default async function CoinPage({ params }: { params: Promise<{ symbol: string }> }) {
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();

  let tickers: Ticker[];
  try {
    tickers = await fetchTickers();
  } catch {
    return (
      <div className="mx-auto max-w-[1240px] px-6 py-10 text-[13px] text-text-dim">
        Market data is temporarily unavailable. Please try again in a moment.
      </div>
    );
  }

  const ticker = tickers.find((t) => t.symbol === symbol);
  if (!ticker) notFound();

  const candles = await fetchKlines(symbol, "1D").catch(() => []);
  return <CoinView initialTicker={ticker} initialCandles={candles} />;
}
