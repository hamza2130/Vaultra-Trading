import "server-only";
import { COINS, TIMEFRAMES, type Candle, type Ticker, type Timeframe } from "./market";

const BASE = "https://data-api.binance.vision/api/v3";
const CACHE_TTL_MS = 2000;
const cache = new Map<string, { at: number; data: unknown }>();

// Short in-memory cache so many users polling at once cost Binance one request.
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  const data = await load();
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Binance responded ${res.status}`);
  return res.json();
}

type RawTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

export function fetchTickers(): Promise<Ticker[]> {
  return cached("tickers", async () => {
    const pairs = JSON.stringify(COINS.map((c) => `${c.symbol}USDT`));
    const raw = (await getJson(
      `${BASE}/ticker/24hr?symbols=${encodeURIComponent(pairs)}`,
    )) as RawTicker[];

    const bySymbol = new Map(raw.map((r) => [r.symbol, r]));
    return COINS.flatMap((c) => {
      const r = bySymbol.get(`${c.symbol}USDT`);
      if (!r) return [];
      return [
        {
          symbol: c.symbol,
          name: c.name,
          color: c.color,
          price: Number(r.lastPrice),
          changePct: Number(r.priceChangePercent),
          volume: Number(r.quoteVolume),
          high: Number(r.highPrice),
          low: Number(r.lowPrice),
        },
      ];
    });
  });
}

export function fetchKlines(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  const { interval, limit } = TIMEFRAMES[timeframe];
  return cached(`klines:${symbol}:${timeframe}`, async () => {
    const raw = (await getJson(
      `${BASE}/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`,
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
