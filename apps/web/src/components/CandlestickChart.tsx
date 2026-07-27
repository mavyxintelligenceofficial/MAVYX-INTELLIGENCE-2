'use client';

import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol?: string;
}

function toTradingViewSymbol(symbol: string): string {
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

  // Fullscreen styles
  const containerStyle: React.CSSProperties = isFullscreen ? {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#000',
    width: '100vw',
    height: '100vh',
  } : {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 400,
  };

  return (
    <div style={containerStyle}>
      {/* Fullscreen toggle button */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          width: 36, height: 36, borderRadius: 6,
          background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#aaa', fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#aaa'; }}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? '✕' : '⛶'}
      </button>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
