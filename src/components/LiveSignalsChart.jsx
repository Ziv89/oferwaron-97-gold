// ============================================
// LiveSignalsChart.jsx - members-only live signal feed
//
// Data flow: TradingView alert -> tvWebhook Cloud Function -> Firestore
// signals/{id} -> this component (onSnapshot, read-gated by Firestore
// rules to active subscribers only) -> markers on a lightweight-charts
// chart, plus a plain list as a fallback that works with zero setup.
//
// TODO(owner): this chart has no live price candles yet - lightweight-charts
// needs OHLCV bars from a market-data source (TradingView's own data can't
// be resold/reused off-platform). Once you have a feed, replace loadCandles()
// below with a real fetch and call candleSeries.setData(bars). Until then the
// signal markers still work; they just have no candlestick backdrop to sit on.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const MAX_SIGNALS = 200;

const markerForSide = (side) => {
  if (side === 'buy') return { position: 'belowBar', color: '#4ade80', shape: 'arrowUp', text: 'BUY' };
  if (side === 'sell') return { position: 'aboveBar', color: '#f87171', shape: 'arrowDown', text: 'SELL' };
  return { position: 'inBar', color: '#d4af37', shape: 'circle', text: 'EXIT' };
};

// Placeholder for a real feed. Left as a stub on purpose - see TODO above.
async function loadCandles(/* symbol */) {
  return [];
}

export default function LiveSignalsChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const markersRef = useRef(null);

  const [signals, setSignals] = useState([]);
  const [error, setError] = useState('');

  // Chart setup - runs once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: { background: { color: 'transparent' }, textColor: '#d1d5db' },
      grid: {
        vertLines: { color: 'rgba(212, 175, 55, 0.08)' },
        horzLines: { color: 'rgba(212, 175, 55, 0.08)' },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#4ade80',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    markersRef.current = createSeriesMarkers(candleSeries, []);

    loadCandles().then((bars) => {
      if (bars.length) candleSeries.setData(bars);
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Live signals - Firestore rules only let this resolve for active members.
  useEffect(() => {
    const q = query(collection(db, 'signals'), orderBy('time', 'desc'), limit(MAX_SIGNALS));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setError('');
        setSignals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => setError('Could not load live signals. Your access may have expired.')
    );

    return unsub;
  }, []);

  // Push markers onto the chart whenever signals change.
  useEffect(() => {
    if (!markersRef.current) return;

    const markers = signals
      .filter((s) => s.time?.toDate)
      .map((s) => ({
        time: Math.floor(s.time.toDate().getTime() / 1000),
        ...markerForSide(s.side),
      }))
      .sort((a, b) => a.time - b.time);

    markersRef.current.setMarkers(markers);
  }, [signals]);

  return (
    <div>
      <div className="core-chart-embed" ref={containerRef} />

      {error && <p className="auth-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="core-signals-list">
        {signals.length === 0 ? (
          <p className="strategy-subtitle" style={{ marginTop: '1rem' }}>
            No signals yet. They will appear here the moment your TradingView alert fires.
          </p>
        ) : (
          signals.map((s) => (
            <div key={s.id} className={`core-signal-row core-signal-${s.side}`}>
              <span className="core-signal-side">{s.side.toUpperCase()}</span>
              <span className="core-signal-symbol">{s.symbol}</span>
              <span className="core-signal-price">{s.price}</span>
              <span className="core-signal-time">
                {s.time?.toDate ? s.time.toDate().toLocaleString() : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
