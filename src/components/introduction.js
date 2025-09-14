import React from 'react';
import './introduction.css';

function Introduction() {
  return (
    <div className="introduction-container">
      <h1>OferWaron97%goldStrategy – Automated Trading System for Gold & Natural Gas</h1>
      <p>
        Developed by Ofer Waron since 2010, this software is a professional algorithmic solution for trading highly volatile commodities – with real and verified results by backtesting on <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer">TradingView</a> and documented in Excel (over 600 actual trades).
        <br />
        Active performance from <strong>01.01.2022 until 30.08.2025 (latest update)</strong>.
        <br />
        Officially operational for live use since <strong>01.06.2025</strong>.
        <br />
        Updates are provided quarterly if needed (operational or visual improvements).
      </p>

      <h2>📌 Overview</h2>
      <p>
        OferWaron97%goldStrategy is an automated trading system built in <strong>Pine Script v5</strong> on the TradingView platform.  
        It is designed to deliver a strong statistical advantage in commodity trading, focusing on the two most volatile and profitable assets: <strong>Gold (XAU/USD)</strong> and <strong>Natural Gas (NG)</strong>.  
        The algorithm integrates dozens of technical indicators, advanced volatility calculations, and disciplined risk management.  
        It has a proven ability to create a positive income/expense ratio over time (Excel table included).
      </p>

      <h2>⚙️ Core Operating Principles</h2>

      <h3>1. Multi-Layer Scoring System</h3>
      <p>
        At every point in time, the algorithm evaluates more than 10 technical parameters, including:
      </p>
      <ul>
        <li>MACD – momentum and trend direction</li>
        <li>RSI / RMI – trend strength and avoiding overbought/oversold zones</li>
        <li>ATR + SuperTrend – volatility assessment and smart TP/SL limits</li>
        <li>EMA 21/50/100/200 – multi-range trend filtering</li>
        <li>Stochastic, ROC, CCI – additional momentum signals</li>
        <li>Volume Profile – trade volume analysis for strong move validation</li>
      </ul>
      <p>
        Each indicator adds or subtracts points, leading to a final probability score (90–97%).  
        Only trades that meet the statistical threshold are executed.
      </p>

      <h3>2. Structured Risk Management</h3>
      <ul>
        <li>Risk/Reward ratio: <strong>1:1 (50/50)</strong> for each trade</li>
        <li>Stop-Loss Cap: strict maximum loss limits, no breaches allowed</li>
        <li>Drawdown control: tracking winning/losing streaks in real time</li>
        <li>
          Realistic fees & taxes:  
          Net profit is calculated after 25% capital gains tax + ~3% broker fees (example: Israeli broker “500 Plus”).  
          Effectively: 0.72% per trade expense and +1.03% on losses.
        </li>
        <li>Current average success rate: <strong>81%</strong></li>
      </ul>
      <p>
        Recommended starting budget: ₪20,000 yearly (₪10,000 gold + ₪10,000 gas).  
        Profits above ₪10,000 are withdrawn; trading account is always reset to ₪10,000 at year-end.  
        Gold & gas both operate with 80% capital allocation and 40% per-trade risk.
      </p>

      <h3>3. Monitoring & Transparency</h3>
      <p>
        The system produces real-time performance reports, including:
      </p>
      <ul>
        <li>Total number of trades</li>
        <li>Win/loss ratio</li>
        <li>Cumulative profit vs. loss</li>
        <li>Longest win/loss streaks</li>
        <li>Maximum drawdown from peak</li>
        <li>Visual tagging directly on the chart (WIN/LOSS markers)</li>
      </ul>

      <h3>4. Verification & Results</h3>
      <p>
        All results are based on <strong>comprehensive TradingView backtesting</strong>:
      </p>
      <ul>
        <li>Uses real historical & updated market data</li>
        <li>Includes full fee & tax calculations</li>
        <li>No external manipulation – results match TradingView reports</li>
      </ul>

      <h3>5. TradingView Integration</h3>
      <p>
        The system works seamlessly with TradingView and provides mobile alerts for:
      </p>
      <ul>
        <li>Trade entry signals</li>
        <li>Exit notifications</li>
        <li>Stop-loss or take-profit triggers</li>
      </ul>

      <h2>✅ Conclusion</h2>
      <p>
        OferWaron97%goldStrategy is not just another theoretical method – it’s a fully operational, proven, data-driven trading system.  
        It offers systematic, reliable, and transparent management of gold and natural gas trades, with strict risk control and net results that reflect the real market.  
        🔥 A professional-grade product combining advanced methodology, cutting-edge technology, and verified real-world performance.
      </p>
    </div>
  );
}

export default Introduction;
