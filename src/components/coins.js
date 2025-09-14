import React, { useEffect, useState, useRef } from 'react';
import './coins.css';

function Coins({ chartData, onBalancesLoaded, onSelectAsset, onChartDataLoaded }) {
  const [balances, setBalances] = useState([]);
  const [prices, setPrices] = useState({});
  const [selectedAsset, setSelectedAsset] = useState('');
  const hasUserSelected = useRef(false); 

  const sendChartDataToServer = async (data) => {
    const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';
    try {
      const res = await fetch(`${apiBase}/api/chart-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        console.log('✅ Chart data pushed to server');
      } else {
        console.error('❌ Failed to push chart data to server');
      }
    } catch (err) {
      console.error('❌ Error sending chart data:', err);
    }
  };

  useEffect(() => {
    if (chartData?.length > 0 && !hasUserSelected.current) {
      const mockAssets = ['BTC', 'ETH', 'USDT', 'ADA', 'XRP']; // expand if needed

      const mappedBalances = chartData.slice(0, mockAssets.length).map((data, index) => ({
        asset: mockAssets[index] || `ASSET${index + 1}`,
        free: (data.value / 10000).toFixed(8), // mock logic for free balance
        locked: '0.00000000',
      }));

      // console.log('🧮 Mapped balances from chartData:', mappedBalances);

      setBalances(mappedBalances);
      onBalancesLoaded(mappedBalances);

      const firstAsset = mappedBalances[0]?.asset;
      if (firstAsset) {
        setSelectedAsset(firstAsset);
        onSelectAsset(firstAsset);
        onChartDataLoaded(chartData);
      }
    }
  }, [chartData]);

  useEffect(() => {
    const fetchBalancesAndPrices = async () => {
      try {
        const apiBase = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : '';

        const res = await fetch(`${apiBase}/api/balances`);
        const text = await res.text();
        // console.log('🪵 Raw /api/balances response:', text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('❌ Failed to parse /api/balances as JSON');
          return;
        }

        if (Array.isArray(data)) {
          const nonZero = data.filter(b => parseFloat(b.free) > 0);
          setBalances(nonZero);
          onBalancesLoaded(nonZero);

          const firstAsset = nonZero[0]?.asset;
          if (firstAsset && !hasUserSelected.current) {
            setSelectedAsset(firstAsset);
            onSelectAsset(firstAsset);

            if (!chartData || chartData.length === 0) {
              const chartRes = await fetch(`${apiBase}/api/chart-data/${firstAsset}`);
              const chartDataFromAPI = await chartRes.json();
              onChartDataLoaded(chartDataFromAPI);
            } else {
              onChartDataLoaded(chartData);
            }
          } else {
            console.warn('⚠️ No assets with non-zero balances found or user already selected.');
          }

          const priceRes = await fetch(`${apiBase}/api/prices`);
          const priceData = await priceRes.json();
          const priceMap = {};
          priceData.forEach(p => {
            priceMap[p.symbol] = parseFloat(p.price);
          });
          setPrices(priceMap);
        }
      } catch (err) {
        console.error('❌ Network error:', err);
      }
    };

    fetchBalancesAndPrices();
  }, []);

  const getUSDTValue = (asset, amount) => {
    const symbol = asset === 'USDT' ? 'USDTUSDT' : asset + 'USDT';
    const price = prices[symbol];
    return price ? (parseFloat(amount) * price).toFixed(2) : '-';
  };

  const handleChange = async (e) => {
    const asset = e.target.value;
    hasUserSelected.current = true; 
    setSelectedAsset(asset);
    onSelectAsset(asset);

    const apiBase = window.location.hostname === 'localhost'
      ? 'http://localhost:4000'
      : '';

    const chartRes = await fetch(`${apiBase}/api/chart-data/${asset}`);
    const chartData = await chartRes.json();
    onChartDataLoaded(chartData);
  };

  return (
    <div className="coin-list">
      <h3>Wallet Balances</h3>

      {balances.length === 0 ? (
        <p>⚠️ No balances found. Try depositing funds or check API permissions.</p>
      ) : (
        <select value={selectedAsset} onChange={handleChange}>
          {balances.map(b => (
            <option key={b.asset} value={b.asset}>
              {b.asset} — {parseFloat(b.free).toFixed(6)} — {getUSDTValue(b.asset, b.free)} USDT
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default Coins;
