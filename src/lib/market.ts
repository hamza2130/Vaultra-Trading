// Friendly names for well-known coins. Anything not listed shows its ticker as the name.
const NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", BNB: "BNB", SOL: "Solana", XRP: "XRP", ADA: "Cardano",
  DOGE: "Dogecoin", TRX: "TRON", TON: "Toncoin", LTC: "Litecoin", LINK: "Chainlink",
  AVAX: "Avalanche", DOT: "Polkadot", POL: "Polygon", MATIC: "Polygon", SHIB: "Shiba Inu",
  BCH: "Bitcoin Cash", UNI: "Uniswap", ATOM: "Cosmos", XLM: "Stellar", ETC: "Ethereum Classic",
  FIL: "Filecoin", HBAR: "Hedera", APT: "Aptos", NEAR: "NEAR Protocol", ARB: "Arbitrum",
  OP: "Optimism", INJ: "Injective", IMX: "Immutable", VET: "VeChain", ICP: "Internet Computer",
  SUI: "Sui", SEI: "Sei", TIA: "Celestia", AAVE: "Aave", MKR: "Maker", GRT: "The Graph",
  ALGO: "Algorand", FTM: "Fantom", S: "Sonic", SAND: "The Sandbox", MANA: "Decentraland",
  AXS: "Axie Infinity", EOS: "EOS", XTZ: "Tezos", THETA: "Theta Network", RUNE: "THORChain",
  EGLD: "MultiversX", FLOW: "Flow", KAVA: "Kava", CHZ: "Chiliz", CRV: "Curve DAO",
  LDO: "Lido DAO", SNX: "Synthetix", COMP: "Compound", "1INCH": "1inch", ENJ: "Enjin Coin",
  BAT: "Basic Attention Token", ZEC: "Zcash", DASH: "Dash", NEO: "Neo", IOTA: "IOTA",
  ZIL: "Zilliqa", ONT: "Ontology", QTUM: "Qtum", KSM: "Kusama", GALA: "Gala", PEPE: "Pepe",
  FLOKI: "Floki", BONK: "Bonk", WIF: "dogwifhat", JUP: "Jupiter", PYTH: "Pyth Network",
  JTO: "Jito", STRK: "Starknet", W: "Wormhole", ENA: "Ethena", ONDO: "Ondo", PENDLE: "Pendle",
  RENDER: "Render", FET: "Fetch.ai", OCEAN: "Ocean Protocol", TAO: "Bittensor", WLD: "Worldcoin",
  ARKM: "Arkham", STX: "Stacks", ORDI: "ORDI", BLUR: "Blur", DYDX: "dYdX", GMX: "GMX",
  RPL: "Rocket Pool", SSV: "SSV Network", FXS: "Frax Share", CAKE: "PancakeSwap",
  SUSHI: "SushiSwap", YFI: "yearn.finance", ZRX: "0x", LRC: "Loopring", ANKR: "Ankr",
  CELO: "Celo", ROSE: "Oasis Network", ONE: "Harmony", IOTX: "IoTeX", KAS: "Kaspa",
  PAXG: "PAX Gold", XMR: "Monero", TRUMP: "Official Trump", PENGU: "Pudgy Penguins",
  VIRTUAL: "Virtuals Protocol", AI16Z: "ai16z", FARTCOIN: "Fartcoin", MOVE: "Movement",
  ME: "Magic Eden", PNUT: "Peanut the Squirrel", NEIRO: "Neiro", MEME: "Memecoin",
  NOT: "Notcoin", DOGS: "Dogs", HMSTR: "Hamster Kombat", CATI: "Catizen", EIGEN: "EigenLayer",
  ETHFI: "Ether.fi", ALT: "AltLayer", MANTA: "Manta Network", DYM: "Dymension", PIXEL: "Pixels",
  PORTAL: "Portal", AEVO: "Aevo", BB: "BounceBit", REZ: "Renzo", SAGA: "Saga", OM: "MANTRA",
  ACE: "Fusionist", AI: "Sleepless AI", XAI: "Xai", NFP: "NFPrompt", WBTC: "Wrapped Bitcoin",
  ENS: "Ethereum Name Service", GLM: "Golem", MASK: "Mask Network", API3: "API3",
  BAND: "Band Protocol", NKN: "NKN", CFX: "Conflux", MINA: "Mina", AR: "Arweave",
  GMT: "STEPN", APE: "ApeCoin", LUNC: "Terra Classic", USTC: "TerraClassicUSD",
  JASMY: "JasmyCoin", WOO: "WOO", HOOK: "Hooked Protocol", MAGIC: "Magic", GAS: "Gas",
  BEAMX: "Beam", ID: "SPACE ID", CYBER: "CyberConnect", ARPA: "ARPA", LPT: "Livepeer",
  QNT: "Quant", RVN: "Ravencoin", ICX: "ICON", SKL: "SKALE", CKB: "Nervos Network",
  TWT: "Trust Wallet Token", SFP: "SafePal", CHR: "Chromia", ALICE: "MyNeighborAlice",
  TLM: "Alien Worlds", VANRY: "Vanar Chain", AUDIO: "Audius", STORJ: "Storj", SUPER: "SuperVerse",
  BICO: "Biconomy", ILV: "Illuvium", YGG: "Yield Guild Games", PYR: "Vulcan Forged",
};

export function coinName(symbol: string): string {
  return NAMES[symbol] ?? symbol;
}

// Stable, readable color per coin for the round icon (no logo files needed).
export function coinColor(symbol: string): string {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  const OVERRIDES: Record<string, string> = {
    BTC: "#F7A93B", ETH: "#5B9BF6", BNB: "#E5A93B", SOL: "#8E7CF0", XRP: "#6C9BD1",
    DOGE: "#C9A23B", TRX: "#E06B6B", TON: "#22C1C3",
  };
  return OVERRIDES[symbol] ?? `hsl(${h % 360} 55% 48%)`;
}

export type Ticker = {
  symbol: string;
  price: number;
  changePct: number;
  volume: number;
  trades: number;
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

// Binance caps klines at 1000 per request; these push each timeframe as
// dense as that allows so charts don't look sparse on a wide screen.
export const TIMEFRAMES = {
  "1H": { interval: "1m", limit: 60 },
  "1D": { interval: "5m", limit: 288 },
  "1W": { interval: "15m", limit: 672 },
  "1M": { interval: "1h", limit: 720 },
  "1Y": { interval: "1d", limit: 365 },
} as const;

export type Timeframe = keyof typeof TIMEFRAMES;

// Enough decimals to show ~4 significant digits, so PEPE-sized prices stay readable.
export function priceDecimals(p: number): number {
  if (p >= 100) return 2;
  if (p >= 1) return 3;
  const lead = Math.ceil(-Math.log10(p));
  return Math.min(10, Math.max(4, lead + 3));
}

export function formatPrice(p: number): string {
  const d = priceDecimals(p);
  return "$" + p.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function formatVolume(v: number): string {
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  return "$" + Math.round(v).toLocaleString("en-US");
}
