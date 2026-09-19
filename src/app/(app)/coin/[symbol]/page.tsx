import { notFound } from "next/navigation";
import { CoinView } from "@/components/CoinView";
import { fetchKlines, fetchTickers } from "@/lib/binance";
import { findCoin } from "@/lib/market";

export default async function CoinPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const coin = findCoin(symbol);
  if (!coin) notFound();

  const [tickers, candles] = await Promise.all([
    fetchTickers().catch(() => []),
    fetchKlines(coin.symbol, "1D").catch(() => []),
  ]);
  const ticker = tickers.find((t) => t.symbol === coin.symbol);

  if (!ticker) {
    return (
      <div className="mx-auto max-w-[1240px] px-6 py-10 text-[13px] text-text-dim">
        Market data is temporarily unavailable. Please try again in a moment.
      </div>
    );
  }

  return <CoinView initialTicker={ticker} initialCandles={candles} />;
}
