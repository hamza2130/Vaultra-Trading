import "server-only";
import { TIMEFRAMES, type Candle, type Ticker, type Timeframe } from "./market";

const BASE = "https://data-api.binance.vision/api/v3";

// Drop dead pairs so the list (and Gainers/Losers) isn't full of noise.
const MIN_DAILY_VOLUME_USDT = 50_000;

// Stablecoins and fiat pairs aren't "coins" a user wants in a price list.
const NON_COINS = new Set([
  "USDC", "TUSD", "PAX", "BUSD", "DAI", "UST", "FDUSD", "EUR", "EURI", "AEUR", "GBP", "AUD",
  "TRY", "BRL", "RUB", "UAH", "NGN", "ARS", "PLN", "RON", "CZK", "ZAR", "JPY", "MXN", "COP",
]);

function isCoin(base: string): boolean {
  return !NON_COINS.has(base) && !base.startsWith("USD");
}

const TICKER_TTL_MS = 4000;
const KLINE_TTL_MS = 2000;
const cache = new Map<string, { at: number; data: unknown }>();

// Short in-memory cache so many users polling at once cost Binance one request.
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = await load();
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 400) {
    for (const [k, v] of cache) if (Date.now() - v.at > 60_000) cache.delete(k);
  }
  return data;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Binance responded ${res.status}`);
  return res.json();
}

type RawMini = {
  symbol: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  lastPrice: string;
  quoteVolume: string;
  count: number;
};

// Every USDT-quoted coin on Binance spot, most-traded first.
export function fetchTickers(): Promise<Ticker[]> {
  return cached("tickers", TICKER_TTL_MS, async () => {
    const raw = (await getJson(`${BASE}/ticker/24hr?type=MINI`)) as RawMini[];

    const out: Ticker[] = [];
    for (const r of raw) {
      if (!r.symbol.endsWith("USDT")) continue;
      const base = r.symbol.slice(0, -4);
      if (!base || !isCoin(base)) continue;

      const volume = Number(r.quoteVolume);
      const price = Number(r.lastPrice);
      const open = Number(r.openPrice);
      if (!(volume >= MIN_DAILY_VOLUME_USDT) || !(price > 0) || !(open > 0)) continue;

      out.push({
        symbol: base,
        price,
        changePct: ((price - open) / open) * 100,
        volume,
        trades: r.count,
        high: Number(r.highPrice),
        low: Number(r.lowPrice),
      });
    }
    return out.sort((a, b) => b.volume - a.volume);
  });
}

// `symbol` must already be validated against fetchTickers().
export function fetchKlines(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  const { interval, limit } = TIMEFRAMES[timeframe];
  return cached(`klines:${symbol}:${timeframe}`, KLINE_TTL_MS, async () => {
    const raw = (await getJson(
      `${BASE}/klines?symbol=${encodeURIComponent(symbol)}USDT&interval=${interval}&limit=${limit}`,
    )) as (string | number)[][];
    return raw.map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
    }));
  });
}
