import { MarketTable } from "@/components/MarketTable";
import { fetchTickers } from "@/lib/binance";

export default async function MarketsPage() {
  const initial = await fetchTickers().catch(() => []);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      <h1 className="font-display text-[22px] font-extrabold text-text">Markets</h1>
      <p className="mb-5 mt-1 text-[13px] text-text-dim">
        Browse the full reference list by movement and activity.
      </p>
      <MarketTable initial={initial} mode="markets" />
    </div>
  );
}
