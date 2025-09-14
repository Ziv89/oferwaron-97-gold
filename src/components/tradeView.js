import React, { useEffect, useRef, useState } from 'react';
import './tradeView.css';
import { initChart } from '../assets/chart';
import Coins from './coins';

const chartTypes = ['line', 'area', 'candlestick', 'bar', 'histogram'];

function TradeView({ data, onBalancesLoaded, onSelectAsset }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartType, setChartType] = useState('line');
  const [isDark, setIsDark] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('');

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.remove();
    }

    chartInstance.current = initChart(chartRef.current, chartType, isDark, data);

    return () => {
      chartInstance.current?.remove();
    };
  }, [chartType, isDark, data]);

  const handleChartDataLoaded = (chartData) => {
    // this will overwrite data if Coins loads new chart data from API
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    if (onSelectAsset) onSelectAsset(asset);
  };

  return (
    <div className={`app-container ${isDark ? 'dark' : 'light'}`}>
      <Coins
        chartData={data}
        onBalancesLoaded={onBalancesLoaded}
        onSelectAsset={handleSelectAsset}
        onChartDataLoaded={handleChartDataLoaded}
      />

      <h2>Chart Type: {chartType}</h2>

      <div className="controls">
        <label>
          Chart Type:
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            {chartTypes.map((type) => (
              <option key={type} value={type}>
                {type[0].toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <button onClick={() => setIsDark(!isDark)}>
          Toggle {isDark ? 'White' : 'Dark'} Mode
        </button>
      </div>

      <div ref={chartRef} className="chart-container" />
    </div>
  );
}

export default TradeView;
