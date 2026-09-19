import { fetchKlines } from "@/lib/binance";
import { TIMEFRAMES, findCoin, type Timeframe } from "@/lib/market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coin = findCoin(searchParams.get("symbol") ?? "");
  const tf = searchParams.get("tf") ?? "";

  if (!coin || !(tf in TIMEFRAMES)) {
    return Response.json({ error: "Unknown symbol or timeframe" }, { status: 400 });
  }

  try {
    return Response.json(await fetchKlines(coin.symbol, tf as Timeframe));
  } catch {
    return Response.json({ error: "Market data unavailable" }, { status: 502 });
  }
}
