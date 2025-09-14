import React, { Component } from "react";
import { FaWhatsapp, FaPhoneAlt, FaEnvelope, FaFileDownload, FaFileAlt } from "react-icons/fa";
import "./directCTA.css";

class DirectCTA extends Component {
  render() {
return (
    <div className="directCTA-container">
      <h1>Ofer Waron97%gold Trading Algorithm</h1>
      <p>
        Ofer Waron97%gold is a proprietary, high-performance trading algorithm designed for short-term gold trading (XAU/USD) on the 1-minute chart.
        Built with precision, backed by data since 2009, and enhanced with AI-powered filters, it delivers consistent, high-probability entries and smart exit management.
      </p>

      <h2>💡 Key Features</h2>
      <ul>
        <li><strong>97% Trade Success Rate</strong> – based on strict real-time validation and historical backtesting</li>
        <li><strong>Multi-Layered Entry Filters</strong> – combines MACD (15min), bullish reversal candles, RSI momentum, ATR flatness, volume spikes, VWAP distance, EMA trend support, and more</li>
        <li><strong>Smart Exit Engine</strong> – adaptive trailing exits using ATR, with profit locks and minimal drawdown strategy</li>
        <li><strong>Live Performance Dashboard</strong> – includes real-time ROI stats, win/loss breakdowns, and heatmap by time</li>
        <li><strong>Risk Control</strong> – dynamic SL/TP based on volatility, always preserving capital</li>
        <li><strong>Auto Alerts</strong> – precise buy/sell signals delivered in real-time via TradingView alerts</li>
      </ul>

      <h2>🔐 Invite-Only Access</h2>
      <p>
        This strategy is not publicly available and is protected as an Invite-Only Script on TradingView. Only approved users can access and use it.
        Ideal for professional traders or signal service providers.
      </p>

      <h2>📊 Performance Since 2009</h2>
      <ul>
        <li>Tested on thousands of trades with verified metrics</li>
        <li>Maximum drawdown control with &lt;5 point loss per trade</li>
        <li>Target profit up to 200 points per signal</li>
        <li>Supports both automated trading bots and manual execution</li>
      </ul>

      <h2>📦 Available As</h2>
      <ul>
        <li>TradingView Invite-Only Indicator</li>
        <li>Cloud-based Auto-Bot with API (Capital.com support)</li>
        <li>SaaS Dashboard for daily ROI tracking and client management (coming soon)</li>
      </ul>

      <h2>⚠️ Legal Notice</h2>
      <p>
        This script is protected under intellectual property laws. Unauthorized use, distribution, or reverse engineering is strictly prohibited.
        <br />
        © Ofer Waron & Luciana Goldman | All rights reserved.
      </p>
    </div>
  );
  }}

export default DirectCTA