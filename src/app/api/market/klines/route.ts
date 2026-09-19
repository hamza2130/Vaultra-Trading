import { fetchKlines, fetchTickers } from "@/lib/binance";
import { TIMEFRAMES, type Timeframe } from "@/lib/market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase();
  const tf = searchParams.get("tf") ?? "";

  if (!/^[A-Z0-9]{1,20}$/.test(symbol) || !(tf in TIMEFRAMES)) {
    return Response.json({ error: "Unknown symbol or timeframe" }, { status: 400 });
  }

  try {
    // Only symbols in our own coin list are proxied to Binance.
    const known = (await fetchTickers()).some((t) => t.symbol === symbol);
    if (!known) return Response.json({ error: "Unknown symbol" }, { status: 404 });
    return Response.json(await fetchKlines(symbol, tf as Timeframe));
  } catch {
    return Response.json({ error: "Market data unavailable" }, { status: 502 });
  }
}
