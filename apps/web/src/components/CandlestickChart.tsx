'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * TradingView Advanced Chart Widget
 * Real-time, live, professional candlestick chart.
 * Uses TradingView's free embeddable widget — same chart you see on tradingview.com
 *
 * Features:
 * - Real-time live price updates (no polling/refresh needed)
 * - Professional candlesticks with volume
 * - All timeframes (1m, 5m, 15m, 1h, 4h, 1D, 1W, 1M)
 * - Drawing tools, indicators, technical analysis
 * - Full TradingView charting experience
 */

interface TradingViewChartProps {
  symbol?: string;
}

// Map our Forex pairs to TradingView symbol format
function toTradingViewSymbol(symbol: string): string {
  // TradingView uses FX:EURUSD format for Forex
  const cleaned = symbol.replace('/', '').toUpperCase();
  return `FX_IDC:${cleaned}`;
}

export default function TradingViewChart({ symbol = 'EUR/USD' }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const tvSymbol = toTradingViewSymbol(symbol);
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    widgetContainer.innerHTML = `
      <div class="tradingview-widget-container__widget" style="height: calc(100% - 32px); width: 100%;"></div>
      <div class="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span class="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    `;

    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: '240',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#000000',
      gridColor: 'rgba(255, 255, 255, 0.03)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      allow_symbol_change: true,
      details: true,
      calendar: false,
    });

    widgetContainer.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol]);

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: isFullscreen ? '100vh' : '100%', minHeight: 400 }}>
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          width: 32, height: 32, borderRadius: 6,
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#888', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? '⊡' : '⛶'}
      </button>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
