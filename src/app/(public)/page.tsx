import Link from "next/link";
import { HomeChart } from "@/components/HomeChart";
import { HomeTicker } from "@/components/HomeTicker";
import { fetchKlines, fetchTickers } from "@/lib/binance";
import type { Ticker } from "@/lib/market";

const FEATURES = [
  {
    title: "Managed, not self-directed",
    body: "Deposits are pooled and traded by Vaultra's team. There's no order placement on this platform — you're not trying to time the market yourself.",
  },
  {
    title: "KYC-verified accounts",
    body: "Every account is identity-checked before it's approved, and every deposit or withdrawal is reviewed by a person, not auto-approved.",
  },
  {
    title: "Transparent record-keeping",
    body: "Balance changes and day-by-day performance are logged and visible on your account — nothing is adjusted without a record of who did it and when.",
  },
  {
    title: "Your funds, your control",
    body: "Withdraw to any address you've saved, whenever you like, subject to admin review. Nothing is locked into a fixed term.",
  },
];

export default async function HomePage() {
  const tickers = await fetchTickers().catch(() => [] as Ticker[]);
  const btc = tickers.find((t) => t.symbol === "BTC");
  const candles = btc ? await fetchKlines("BTC", "1D").catch(() => []) : [];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-raised">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-bold text-accent-ink">
              Managed crypto trading
            </span>
            <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.15] text-text sm:text-[42px]">
              Your capital, professionally traded.
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-text-dim">
              Vaultra pools client deposits into strategies run by our trading team. You deposit,
              track your account, and withdraw whenever you like — no charts to babysit, no orders
              to place yourself.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-accent px-5 py-3 text-[14px] font-bold text-[#04140F] hover:bg-accent-ink"
              >
                Create an account
              </Link>
              <Link
                href="/markets"
                className="rounded-lg border border-border px-5 py-3 text-[14px] font-bold text-text hover:border-text-faint"
              >
                View live markets
              </Link>
            </div>
            <p className="mt-5 text-[11.5px] leading-relaxed text-text-faint">
              Trading involves risk. Performance is posted per account by the Vaultra team and is
              never guaranteed or fixed in advance.
            </p>
          </div>
          {btc ? (
            <HomeChart initialTicker={btc} initialCandles={candles} />
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-2xl border border-border bg-surface text-[13px] text-text-faint">
              Market data is temporarily unavailable.
            </div>
          )}
        </div>
      </section>

      {/* Live ticker strip */}
      <section className="mx-auto max-w-[1240px] px-6 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-extrabold text-text">Live market prices</h2>
          <Link href="/markets" className="text-[12.5px] font-bold text-accent-ink hover:underline">
            See all coins →
          </Link>
        </div>
        <HomeTicker initial={tickers} />
      </section>

      {/* Features */}
      <section className="border-t border-border bg-raised">
        <div className="mx-auto max-w-[1240px] px-6 py-12">
          <h2 className="font-display text-[20px] font-extrabold text-text">How Vaultra works</h2>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-text-dim">
            A managed account, run with the same discipline as the rest of the platform.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-1.5 text-[13.5px] font-bold text-text">{f.title}</h3>
                <p className="text-[12.5px] leading-relaxed text-text-dim">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-6 py-14 text-center">
        <h2 className="font-display text-[22px] font-extrabold text-text">Ready to get started?</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-text-dim">
          Registration takes a few minutes. Your account is reviewed before you can deposit.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex rounded-lg bg-accent px-6 py-3 text-[14px] font-bold text-[#04140F] hover:bg-accent-ink"
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}
