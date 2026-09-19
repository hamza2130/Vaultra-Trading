import { MarketTable } from "@/components/MarketTable";
import { fetchTickers } from "@/lib/binance";

export default async function HomePage() {
  const initial = await fetchTickers().catch(() => []);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      <h1 className="font-display text-[22px] font-extrabold text-text">Market overview</h1>
      <p className="mb-5 mt-1 text-[13px] text-text-dim">
        Live reference prices — view only, no order placement on this platform.
      </p>
      <MarketTable initial={initial} mode="home" />
    </div>
  );
}
