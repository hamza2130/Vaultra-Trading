export const COINS = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7A93B" },
  { symbol: "ETH", name: "Ethereum", color: "#5B9BF6" },
  { symbol: "BNB", name: "BNB", color: "#E5A93B" },
  { symbol: "SOL", name: "Solana", color: "#8E7CF0" },
  { symbol: "XRP", name: "XRP", color: "#6C9BD1" },
  { symbol: "ADA", name: "Cardano", color: "#3FB6A8" },
  { symbol: "DOGE", name: "Dogecoin", color: "#C9A23B" },
  { symbol: "TRX", name: "TRON", color: "#E06B6B" },
  { symbol: "TON", name: "Toncoin", color: "#22C1C3" },
  { symbol: "LTC", name: "Litecoin", color: "#7C9CF0" },
  { symbol: "LINK", name: "Chainlink", color: "#4C7FE0" },
  { symbol: "AVAX", name: "Avalanche", color: "#E0585F" },
] as const;

export type CoinSymbol = (typeof COINS)[number]["symbol"];

export function findCoin(symbol: string) {
  return COINS.find((c) => c.symbol === symbol.toUpperCase());
}

export type Ticker = {
  symbol: CoinSymbol;
  name: string;
  color: string;
  price: number;
  changePct: number;
  volume: number;
  high: number;
  low: number;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export const TIMEFRAMES = {
  "1H": { interval: "1m", limit: 60 },
  "1D": { interval: "15m", limit: 96 },
  "1W": { interval: "1h", limit: 168 },
  "1M": { interval: "4h", limit: 180 },
  "1Y": { interval: "1d", limit: 365 },
} as const;

export type Timeframe = keyof typeof TIMEFRAMES;

export function formatPrice(p: number): string {
  const decimals = p >= 100 ? 2 : p >= 1 ? 3 : 5;
  return (
    "$" +
    p.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
}

export function formatVolume(v: number): string {
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  return "$" + Math.round(v).toLocaleString("en-US");
}
