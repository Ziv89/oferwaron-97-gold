import React, { useState, useRef } from 'react';
import Coins from './coins';
import TradeView from './tradeView';
import ErrorBoundary from './ErrorBoundary';
import { PineTSRunner } from '../pineTS/PineTS.class.ts';

function Dashboard() {
  const [balances, setBalances] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [pineScriptText, setPineScriptText] = useState('');
  const [convertedContext, setConvertedContext] = useState(null);
  const fileInputRef = useRef(null);

  const chartData = [
    { time: '2021-01-01', value: 100, open: 95, high: 105, low: 90, close: 100 },
    { time: '2022-01-02', value: 102, open: 100, high: 108, low: 98, close: 104 },
    { time: '2023-01-10', value: 99, open: 104, high: 106, low: 97, close: 98 },
  ];

  // ✅ Provide real chart data instead of empty array
  const chartDatatoSent = [
    {
      open: 95,
      high: 105,
      low: 90,
      close: 100,
      volume: 123,
      openTime: 12345678,
      closeTime: 12345699,
    },
  ];

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
 reader.onload = async (e) => {
  const fileContent = e.target.result;
  setPineScriptText(fileContent);

  try {
    const resultObj = await PineTSRunner(fileContent, chartDatatoSent);

    console.log('✅ Real result after run:', resultObj.result);
    setConvertedContext(resultObj.result);
  } catch (err) {
    console.error('❌ PineTSRunner failed:', err);
  }
};

    reader.readAsText(file);
  };

  const handleBalancesLoaded = (data) => {
    setBalances(data);
    setSelectedAsset(data.length > 0 ? data[0].asset : 'BTC');
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
  };

  return (
    <div className="dashboard">
      <button onClick={handleClick}>Upload PineScript File</button>
      <input
        type="file"
        accept=".pine,.txt"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {convertedContext && (
        <pre style={{ backgroundColor: '#f9f9f9', padding: '10px' }}>
          {JSON.stringify(convertedContext, null, 2)}
        </pre>
      )}

      <ErrorBoundary>
        <TradeView
          selectedAsset={selectedAsset}
          data={chartData}
          onBalancesLoaded={handleBalancesLoaded}
          onSelectAsset={handleSelectAsset}
        />
      </ErrorBoundary>
    </div>
  );
}

export default Dashboard;