'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

/**
 * Professional Candlestick Chart
 * Per MEIDS §5.9: "Institutional Chart"
 * - Muted green for bullish candles
 * - Muted red for bearish candles
 * - Thin borders
 * - Extremely subtle grid
 * - Price must remain the most visible element
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
  overlays?: any[];
}

export default function CandlestickChart({ candles }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#08080C' },
        textColor: '#686878',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(201, 168, 76, 0.3)', width: 1, style: 2, labelBackgroundColor: '#14141E' },
        horzLine: { color: 'rgba(201, 168, 76, 0.3)', width: 1, style: 2, labelBackgroundColor: '#14141E' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
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

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34C759',
      downColor: '#FF3B30',
      borderUpColor: '#34C759',
      borderDownColor: '#FF3B30',
      wickUpColor: '#34C759',
      wickDownColor: '#FF3B30',
    });

    // Convert candles to chart format
    if (candles && candles.length > 0) {
      const chartData = candles.map(c => ({
        time: (new Date(c.timestamp).getTime() / 1000) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      // Sort by time
      chartData.sort((a, b) => (a.time as number) - (b.time as number));

      candleSeries.setData(chartData);
      chart.timeScale().fitContent();
    }

    // Handle resize
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
    };
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
