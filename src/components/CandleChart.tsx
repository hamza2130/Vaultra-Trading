"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import type { Candle, Timeframe } from "@/lib/market";

const POLL_MS = 5000;

function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    text: v("--text-dim"),
    grid: v("--border-soft"),
    border: v("--border"),
    up: v("--pos"),
    down: v("--neg"),
  };
}

function precisionFor(price: number) {
  return price >= 10 ? 2 : 4;
}

function toBar(c: Candle) {
  return { ...c, time: c.time as UTCTimestamp };
}

export function CandleChart({
  symbol,
  timeframe,
  initialCandles,
}: {
  symbol: string;
  timeframe: Timeframe;
  initialCandles: Candle[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastTimeRef = useRef(0);
  const [failed, setFailed] = useState(false);

  // Create the chart once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const c = themeColors();
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: c.text,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderColor: c.border },
      timeScale: { borderColor: c.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: c.up,
      downColor: c.down,
      borderUpColor: c.up,
      borderDownColor: c.down,
      wickUpColor: c.up,
      wickDownColor: c.down,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => {
      const t = themeColors();
      chart.applyOptions({
        layout: { textColor: t.text },
        grid: { vertLines: { color: t.grid }, horzLines: { color: t.grid } },
        rightPriceScale: { borderColor: t.border },
        timeScale: { borderColor: t.border },
      });
      series.applyOptions({
        upColor: t.up,
        downColor: t.down,
        borderUpColor: t.up,
        borderDownColor: t.down,
        wickUpColor: t.up,
        wickDownColor: t.down,
      });
    };
    media.addEventListener("change", onTheme);

    return () => {
      media.removeEventListener("change", onTheme);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load candles for the selected timeframe, then keep the latest candle live.
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    let cancelled = false;

    function apply(candles: Candle[]) {
      if (!series || !chart || candles.length === 0) return;
      const last = candles[candles.length - 1];
      const precision = precisionFor(last.close);
      series.applyOptions({
        priceFormat: { type: "price", precision, minMove: 1 / 10 ** precision },
      });
      chart.applyOptions({ timeScale: { timeVisible: timeframe !== "1Y" } });
      series.setData(candles.map(toBar));
      lastTimeRef.current = last.time;
      chart.timeScale().fitContent();
    }

    async function fetchCandles(): Promise<Candle[]> {
      const res = await fetch(`/api/market/klines?symbol=${symbol}&tf=${timeframe}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("bad status");
      return (await res.json()) as Candle[];
    }

    async function load() {
      try {
        apply(await fetchCandles());
        if (!cancelled) setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    async function tick() {
      try {
        const candles = await fetchCandles();
        if (cancelled || !series) return;
        for (const c of candles) {
          if (c.time >= lastTimeRef.current) {
            series.update(toBar(c));
            lastTimeRef.current = c.time;
          }
        }
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    // The server already sent 1D candles for first paint; other timeframes fetch.
    if (timeframe === "1D" && initialCandles.length > 0) apply(initialCandles);
    else void load();

    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, timeframe, initialCandles]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[420px] w-full" />
      {failed ? (
        <div className="absolute inset-x-0 top-2 mx-auto w-fit rounded-md bg-warn-soft px-3 py-1 text-[12px] font-semibold text-warn">
          Reconnecting to market data…
        </div>
      ) : null}
    </div>
  );
}
