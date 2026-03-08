'use client';

import { useEffect, useRef } from 'react';
import { ColorType, createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { Candle } from '@/lib/types';

type Props = { candles: Candle[] };

export default function CandleChart({ candles }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#0b1220' }, textColor: '#CBD5E1' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      width: ref.current.clientWidth,
      height: 520,
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true }
    });
    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => chart.applyOptions({ width: ref.current?.clientWidth || 900 });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const formatted: CandlestickData[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));
    seriesRef.current.setData(formatted);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div className="panel p-2" ref={ref} />;
}
