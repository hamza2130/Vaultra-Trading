import { fetchTickers } from "@/lib/binance";

export async function GET() {
  try {
    return Response.json(await fetchTickers());
  } catch {
    return Response.json({ error: "Market data unavailable" }, { status: 502 });
  }
}
