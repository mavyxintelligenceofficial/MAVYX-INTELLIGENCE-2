'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

/**
 * Live Candlestick Chart
 * Per MEIDS §5.9: Professional institutional chart
 * - Auto-refreshes every 30 seconds
 * - Muted green/red candles
 * - Subtle grid
 * - Gold crosshair
 */

interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartProps {
  candles: Candle[];
  onRefresh?: () => void;
}

export default function CandlestickChart({ candles, onRefresh }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#08080C' },
        textColor: '#686878',
        fontSize: 11,
        fontFamily: 'Inter, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(201, 168, 76, 0.4)', width: 1, style: 2, labelBackgroundColor: '#14141E' },
        horzLine: { color: 'rgba(201, 168, 76, 0.4)', width: 1, style: 2, labelBackgroundColor: '#14141E' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34C759',
      downColor: '#FF3B30',
      borderUpColor: '#34C759',
      borderDownColor: '#FF3B30',
      wickUpColor: '#34C759',
      wickDownColor: '#FF3B30',
    });

    seriesRef.current = candleSeries;

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (!seriesRef.current || !candles || candles.length === 0) return;

    const chartData = candles
      .map(c => ({
        time: (new Date(c.timestamp).getTime() / 1000) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Remove duplicates
    const seen = new Set();
    const unique = chartData.filter(d => {
      if (seen.has(d.time)) return false;
      seen.add(d.time);
      return true;
    });

    seriesRef.current.setData(unique);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Auto-refresh every 30 seconds for live feel
  useEffect(() => {
    if (!onRefresh) return;

    intervalRef.current = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onRefresh]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
