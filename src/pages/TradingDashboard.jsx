// ============================================
// TradingDashboard.jsx - Ofer Waron 97% Gold Strategy
// Full Pine Script → JavaScript Implementation
// ============================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/styles.css';

// ============================================
// COMPLETE INDICATOR LIBRARY
// Transpiled from Pine Script
// ============================================
const Indicators = {
  // Simple Moving Average
  SMA: (data, period, key = 'close') => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j][key];
      result.push({ time: data[i].time, value: sum / period });
    }
    return result;
  },

  // Exponential Moving Average
  EMA: (data, period, key = 'close') => {
    const result = [];
    const multiplier = 2 / (period + 1);
    let ema = data[0][key];
    
    for (let i = 0; i < data.length; i++) {
      ema = (data[i][key] - ema) * multiplier + ema;
      if (i >= period - 1) {
        result.push({ time: data[i].time, value: ema });
      }
    }
    return result;
  },

  // RMA (Pine Script's ta.rma - Wilder's smoothing)
  RMA: (values, period) => {
    const result = [];
    let rma = values[0];
    const alpha = 1 / period;
    
    for (let i = 0; i < values.length; i++) {
      rma = alpha * values[i] + (1 - alpha) * rma;
      result.push(rma);
    }
    return result;
  },

  // RSI - Relative Strength Index
  RSI: (data, period = 14) => {
    const result = [];
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGains = Indicators.RMA(gains, period);
    const avgLosses = Indicators.RMA(losses, period);
    
    for (let i = period - 1; i < gains.length; i++) {
      const rs = avgLosses[i] === 0 ? 100 : avgGains[i] / avgLosses[i];
      result.push({ time: data[i + 1].time, value: 100 - (100 / (1 + rs)) });
    }
    return result;
  },

  // MACD
  MACD: (data, fast = 12, slow = 26, signal = 9) => {
    const emaFast = Indicators.EMA(data, fast);
    const emaSlow = Indicators.EMA(data, slow);
    
    const macdLine = [];
    const startIdx = slow - fast;
    
    for (let i = 0; i < emaFast.length && i + startIdx < emaSlow.length; i++) {
      if (i + startIdx >= 0) {
        macdLine.push({
          time: emaFast[i].time,
          value: emaFast[i].value - emaSlow[i + startIdx].value
        });
      }
    }
    
    // Signal line (EMA of MACD)
    const signalData = macdLine.map(d => ({ time: d.time, close: d.value }));
    const signalLine = Indicators.EMA(signalData, signal);
    
    return { macdLine, signalLine };
  },

  // VWAP - Volume Weighted Average Price
  VWAP: (data) => {
    const result = [];
    let cumVolume = 0;
    let cumVolumePrice = 0;
    
    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      cumVolume += data[i].volume;
      cumVolumePrice += typicalPrice * data[i].volume;
      
      result.push({
        time: data[i].time,
        value: cumVolume > 0 ? cumVolumePrice / cumVolume : typicalPrice
      });
    }
    return result;
  },

  // RMI - Relative Momentum Index
  RMI: (data, period = 14) => {
    const result = [];
    const ups = [];
    const downs = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      ups.push(Math.max(change, 0));
      downs.push(Math.max(-change, 0));
    }
    
    const rmaUp = Indicators.RMA(ups, period);
    const rmaDown = Indicators.RMA(downs, period);
    
    for (let i = period - 1; i < ups.length; i++) {
      const total = rmaUp[i] + rmaDown[i];
      const rmi = total === 0 ? 50 : (rmaUp[i] / total) * 100;
      result.push({ time: data[i + 1].time, value: rmi });
    }
    return result;
  },

  // Stochastic
  Stochastic: (data, kPeriod = 14, dPeriod = 3) => {
    const kValues = [];
    const dValues = [];
    
    for (let i = kPeriod - 1; i < data.length; i++) {
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      
      for (let j = 0; j < kPeriod; j++) {
        highestHigh = Math.max(highestHigh, data[i - j].high);
        lowestLow = Math.min(lowestLow, data[i - j].low);
      }
      
      const k = highestHigh === lowestLow ? 50 : 
        ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push({ time: data[i].time, value: k });
    }
    
    // D line (SMA of K)
    for (let i = dPeriod - 1; i < kValues.length; i++) {
      let sum = 0;
      for (let j = 0; j < dPeriod; j++) sum += kValues[i - j].value;
      dValues.push({ time: kValues[i].time, value: sum / dPeriod });
    }
    
    return { k: kValues, d: dValues };
  },

  // ATR - Average True Range
  ATR: (data, period = 14) => {
    const trueRanges = [];
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      trueRanges.push(tr);
    }
    
    const atrValues = Indicators.RMA(trueRanges, period);
    
    for (let i = period - 1; i < trueRanges.length; i++) {
      result.push({ time: data[i + 1].time, value: atrValues[i] });
    }
    return result;
  },

  // OBV - On Balance Volume
  OBV: (data) => {
    const result = [];
    let obv = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (i > 0) {
        if (data[i].close > data[i - 1].close) obv += data[i].volume;
        else if (data[i].close < data[i - 1].close) obv -= data[i].volume;
      }
      result.push({ time: data[i].time, value: obv });
    }
    return result;
  },

  // Supertrend
  Supertrend: (data, factor = 3.0, period = 10) => {
    const atr = Indicators.ATR(data, period);
    const result = [];
    let direction = 1;
    let supertrend = 0;
    
    for (let i = 0; i < atr.length; i++) {
      const dataIdx = i + period;
      const hl2 = (data[dataIdx].high + data[dataIdx].low) / 2;
      const upperBand = hl2 + factor * atr[i].value;
      const lowerBand = hl2 - factor * atr[i].value;
      
      if (i === 0) {
        supertrend = data[dataIdx].close > hl2 ? lowerBand : upperBand;
        direction = data[dataIdx].close > hl2 ? -1 : 1;
      } else {
        const prevClose = data[dataIdx - 1].close;
        
        if (direction === 1) {
          supertrend = Math.min(upperBand, supertrend);
          if (data[dataIdx].close > supertrend) direction = -1;
        } else {
          supertrend = Math.max(lowerBand, supertrend);
          if (data[dataIdx].close < supertrend) direction = 1;
        }
      }
      
      result.push({ time: data[dataIdx].time, value: supertrend, direction });
    }
    return result;
  },

  // CCI - Commodity Channel Index
  CCI: (data, period = 20) => {
    const result = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const typicalPrices = [];
      for (let j = 0; j < period; j++) {
        typicalPrices.push((data[i - j].high + data[i - j].low + data[i - j].close) / 3);
      }
      
      const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
      const meanDev = typicalPrices.reduce((a, b) => a + Math.abs(b - sma), 0) / period;
      const tp = typicalPrices[0];
      
      const cci = meanDev === 0 ? 0 : (tp - sma) / (0.015 * meanDev);
      result.push({ time: data[i].time, value: cci });
    }
    return result;
  },

  // ADX - Average Directional Index
  ADX: (data, period = 14) => {
    const result = [];
    const plusDM = [];
    const minusDM = [];
    const tr = [];
    
    for (let i = 1; i < data.length; i++) {
      const highDiff = data[i].high - data[i - 1].high;
      const lowDiff = data[i - 1].low - data[i].low;
      
      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
      
      tr.push(Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      ));
    }
    
    const smoothedPlusDM = Indicators.RMA(plusDM, period);
    const smoothedMinusDM = Indicators.RMA(minusDM, period);
    const smoothedTR = Indicators.RMA(tr, period);
    
    const dx = [];
    for (let i = period - 1; i < smoothedTR.length; i++) {
      const plusDI = smoothedTR[i] === 0 ? 0 : (smoothedPlusDM[i] / smoothedTR[i]) * 100;
      const minusDI = smoothedTR[i] === 0 ? 0 : (smoothedMinusDM[i] / smoothedTR[i]) * 100;
      const sum = plusDI + minusDI;
      dx.push(sum === 0 ? 0 : Math.abs(plusDI - minusDI) / sum * 100);
    }
    
    const adxValues = Indicators.RMA(dx, period);
    
    for (let i = 0; i < adxValues.length; i++) {
      const dataIdx = i + period * 2 - 1;
      if (dataIdx < data.length) {
        result.push({ time: data[dataIdx].time, value: adxValues[i] });
      }
    }
    return result;
  },

  // Bollinger Bands
  BollingerBands: (data, period = 20, stdDev = 2) => {
    const result = { middle: [], upper: [], lower: [] };
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      const prices = [];
      for (let j = 0; j < period; j++) {
        prices.push(data[i - j].close);
        sum += data[i - j].close;
      }
      const middle = sum / period;
      
      const variance = prices.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      result.middle.push({ time: data[i].time, value: middle });
      result.upper.push({ time: data[i].time, value: middle + stdDev * std });
      result.lower.push({ time: data[i].time, value: middle - stdDev * std });
    }
    return result;
  },

  // Fibonacci Levels
  Fibonacci: (data, period = 50) => {
    if (data.length < period) return null;
    
    let highest = -Infinity;
    let lowest = Infinity;
    
    for (let i = data.length - period; i < data.length; i++) {
      highest = Math.max(highest, data[i].high);
      lowest = Math.min(lowest, data[i].low);
    }
    
    const range = highest - lowest;
    return {
      high: highest,
      low: lowest,
      fib236: lowest + 0.236 * range,
      fib382: lowest + 0.382 * range,
      fib500: lowest + 0.500 * range,
      fib618: lowest + 0.618 * range,
      fib786: lowest + 0.786 * range
    };
  },

  // Squeeze Momentum
  SqueezeMomentum: (data, period = 20) => {
    const result = [];
    const sma = Indicators.SMA(data, period);
    
    for (let i = 0; i < sma.length; i++) {
      const dataIdx = i + period - 1;
      const sqz = data[dataIdx].close - sma[i].value;
      result.push({ time: data[dataIdx].time, value: sqz });
    }
    
    // Calculate EMA difference (squeeze momentum oscillator)
    const sqzData = result.map(d => ({ time: d.time, close: d.value }));
    const ema12 = Indicators.EMA(sqzData, 12);
    const ema26 = Indicators.EMA(sqzData, 26);
    
    const momentum = [];
    const offset = 26 - 12;
    for (let i = 0; i < ema12.length && i + offset < ema26.length; i++) {
      momentum.push({
        time: ema12[i].time,
        value: ema12[i].value - ema26[i + offset].value
      });
    }
    
    return momentum;
  },

  // Candlestick Patterns
  CandlePatterns: {
    isBullishEngulfing: (data, i) => {
      if (i < 1) return false;
      const curr = data[i];
      const prev = data[i - 1];
      return curr.close > curr.open && 
             prev.open > prev.close && 
             curr.open <= prev.close && 
             curr.close >= prev.open;
    },
    
    isBearishEngulfing: (data, i) => {
      if (i < 1) return false;
      const curr = data[i];
      const prev = data[i - 1];
      return curr.close < curr.open && 
             prev.open < prev.close && 
             curr.open >= prev.close && 
             curr.close <= prev.open;
    },
    
    isDoji: (data, i) => {
      const candle = data[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const totalRange = candle.high - candle.low;
      return bodySize <= totalRange * 0.1;
    },
    
    isHammer: (data, i) => {
      const candle = data[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const totalRange = candle.high - candle.low;
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      
      return candle.close > candle.open && 
             totalRange > 2 * lowerWick && 
             upperWick < totalRange * 0.25;
    },
    
    isShootingStar: (data, i) => {
      const candle = data[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const totalRange = candle.high - candle.low;
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      
      return candle.open > candle.close && 
             totalRange > 2 * upperWick && 
             lowerWick < totalRange * 0.25;
    }
  }
};

// ============================================
// OFER WARON 97% GOLD STRATEGY
// Complete Pine Script Logic in JavaScript
// ============================================
const OferWaronStrategy = {
  calculate: (data) => {
    if (data.length < 50) {
      return { signal: 'WAIT', confidence: 0, longScore: 0, shortScore: 0, reasons: [], indicators: {} };
    }
    
    const i = data.length - 1;
    const latest = data[i];
    const prev = data[i - 1];
    
    // Calculate all indicators
    const macd = Indicators.MACD(data, 12, 26, 9);
    const macdLine = macd.macdLine[macd.macdLine.length - 1]?.value || 0;
    const signalLine = macd.signalLine[macd.signalLine.length - 1]?.value || 0;
    
    const rsiData = Indicators.RSI(data, 14);
    const rsi = rsiData[rsiData.length - 1]?.value || 50;
    
    const vwapData = Indicators.VWAP(data);
    const vwap = vwapData[vwapData.length - 1]?.value || latest.close;
    
    const rmiData = Indicators.RMI(data, 14);
    const rmi = rmiData[rmiData.length - 1]?.value || 50;
    
    const vol = latest.volume;
    const avgVolData = Indicators.SMA(data.map(d => ({ time: d.time, close: d.volume })), 20);
    const avgVol = avgVolData[avgVolData.length - 1]?.value || vol;
    const highVol = vol > avgVol;
    
    const sma20Data = Indicators.SMA(data, 20);
    const sma20 = sma20Data[sma20Data.length - 1]?.value || latest.close;
    
    const sqzMomData = Indicators.SqueezeMomentum(data, 20);
    const sqzMom = sqzMomData[sqzMomData.length - 1]?.value || 0;
    
    const stoch = Indicators.Stochastic(data, 14, 3);
    const k = stoch.k[stoch.k.length - 1]?.value || 50;
    const d = stoch.d[stoch.d.length - 1]?.value || 50;
    
    const atrData = Indicators.ATR(data, 14);
    const atr = atrData[atrData.length - 1]?.value || 0;
    const atrSmaData = Indicators.SMA(atrData.map(d => ({ time: d.time, close: d.value })), 14);
    const atrSma = atrSmaData[atrSmaData.length - 1]?.value || atr;
    
    const obvData = Indicators.OBV(data);
    const obv = obvData[obvData.length - 1]?.value || 0;
    const obvPrev = obvData[obvData.length - 2]?.value || 0;
    
    const supertrendData = Indicators.Supertrend(data, 3.0, 10);
    const supertrend = supertrendData[supertrendData.length - 1] || { direction: 0 };
    
    const fib = Indicators.Fibonacci(data, 50);
    
    const cciData = Indicators.CCI(data, 20);
    const cci = cciData[cciData.length - 1]?.value || 0;
    
    const adxData = Indicators.ADX(data, 14);
    const adx = adxData[adxData.length - 1]?.value || 0;
    
    const bb = Indicators.BollingerBands(data, 20, 2);
    const middleBB = bb.middle[bb.middle.length - 1]?.value || latest.close;
    
    // Candlestick patterns
    const isBullishEngulfing = Indicators.CandlePatterns.isBullishEngulfing(data, i);
    const isBearishEngulfing = Indicators.CandlePatterns.isBearishEngulfing(data, i);
    const isDoji = Indicators.CandlePatterns.isDoji(data, i);
    const isHammer = Indicators.CandlePatterns.isHammer(data, i);
    const isShootingStar = Indicators.CandlePatterns.isShootingStar(data, i);
    
    // Daily high/low (simulated with 24-bar lookback for hourly data)
    const dailyPeriod = Math.min(24, data.length - 1);
    let dailyHigh = -Infinity;
    let dailyLow = Infinity;
    for (let j = 1; j <= dailyPeriod; j++) {
      dailyHigh = Math.max(dailyHigh, data[i - j].high);
      dailyLow = Math.min(dailyLow, data[i - j].low);
    }
    const brokeHigh = latest.high > dailyHigh;
    const brokeLow = latest.low < dailyLow;
    
    // ============================================
    // SCORING SYSTEM (Exact Pine Script Logic)
    // ============================================
    let longScore = 0;
    let shortScore = 0;
    const longReasons = [];
    const shortReasons = [];
    
    // MACD
    if (macdLine > signalLine) { longScore += 1; longReasons.push('MACD Bullish'); }
    if (macdLine < signalLine) { shortScore += 1; shortReasons.push('MACD Bearish'); }
    
    // VWAP
    if (latest.close > vwap) { longScore += 1; longReasons.push('Above VWAP'); }
    if (latest.close < vwap) { shortScore += 1; shortReasons.push('Below VWAP'); }
    
    // RSI
    if (rsi > 55) { longScore += 1.3; longReasons.push(`RSI Strong (${rsi.toFixed(1)})`); }
    else if (rsi > 50) { longScore += 0.7; longReasons.push(`RSI Mild (${rsi.toFixed(1)})`); }
    if (rsi < 45) { shortScore += 1.3; shortReasons.push(`RSI Weak (${rsi.toFixed(1)})`); }
    else if (rsi < 50) { shortScore += 0.7; shortReasons.push(`RSI Mild (${rsi.toFixed(1)})`); }
    
    // RMI
    if (rmi > 50) { longScore += 1; longReasons.push('RMI Bullish'); }
    if (rmi < 50) { shortScore += 1; shortReasons.push('RMI Bearish'); }
    
    // Volume + Price
    if (latest.close > prev.close && highVol) { longScore += 1.2; longReasons.push('High Vol Up'); }
    else { longScore += 0.7; }
    if (latest.close < prev.close && highVol) { shortScore += 1.2; shortReasons.push('High Vol Down'); }
    else { shortScore += 0.7; }
    
    // Squeeze Momentum
    if (sqzMom > 0) { longScore += 1.2; longReasons.push('Squeeze +'); }
    else { longScore += 0.7; }
    if (sqzMom < 0) { shortScore += 1.2; shortReasons.push('Squeeze -'); }
    else { shortScore += 0.7; }
    
    // Stochastic
    if (k > d) { longScore += 1.1; longReasons.push('Stoch K>D'); }
    else { longScore += 0.6; }
    if (k < d) { shortScore += 1.1; shortReasons.push('Stoch K<D'); }
    else { shortScore += 0.6; }
    
    // ATR
    if (atr > atrSma) { longScore += 0.8; shortScore += 0.8; }
    
    // OBV
    if (obv > obvPrev) { longScore += 0.8; longReasons.push('OBV Rising'); }
    if (obv < obvPrev) { shortScore += 0.8; shortReasons.push('OBV Falling'); }
    
    // Supertrend
    if (supertrend.direction < 0) { longScore += 0.8; longReasons.push('Supertrend Up'); }
    if (supertrend.direction > 0) { shortScore += 0.8; shortReasons.push('Supertrend Down'); }
    
    // Fibonacci
    if (fib && latest.close > fib.fib382) { longScore += 0.7; longReasons.push('Above Fib38'); }
    if (fib && latest.close < fib.fib618) { shortScore += 0.7; shortReasons.push('Below Fib61'); }
    
    // CCI
    if (cci > 100) { longScore += 0.6; longReasons.push('CCI Overbought'); }
    if (cci < -100) { shortScore += 0.6; shortReasons.push('CCI Oversold'); }
    
    // ADX
    if (adx > 20) { longScore += 0.6; shortScore += 0.6; }
    
    // Bollinger Bands
    if (latest.close > middleBB) { longScore += 0.6; longReasons.push('Above BB Mid'); }
    if (latest.close < middleBB) { shortScore += 0.6; shortReasons.push('Below BB Mid'); }
    
    // Candlestick Patterns
    if (isBullishEngulfing) { longScore += 1.0; longReasons.push('🕯️ Bull Engulf'); }
    if (isHammer) { longScore += 0.8; longReasons.push('🔨 Hammer'); }
    if (isDoji) { longScore += 0.4; shortScore += 0.4; }
    if (isBearishEngulfing) { shortScore += 1.0; shortReasons.push('🕯️ Bear Engulf'); }
    if (isShootingStar) { shortScore += 0.8; shortReasons.push('⭐ Shooting Star'); }
    
    // Daily Breakout
    if (brokeHigh) { longScore += 0.9; longReasons.push('📈 Broke Daily High'); }
    if (brokeLow) { shortScore += 0.9; shortReasons.push('📉 Broke Daily Low'); }
    
    // ============================================
    // FINAL SIGNAL CALCULATION
    // ============================================
    const useLong = longScore >= shortScore;
    const direction = useLong ? 'LONG' : 'SHORT';
    const finalScore = Math.max(longScore, shortScore);
    const percentSuccess = Math.round(Math.min(97.0, finalScore * 1000 / 20.0)) / 10;
    
    return {
      signal: direction,
      confidence: percentSuccess,
      longScore: longScore.toFixed(1),
      shortScore: shortScore.toFixed(1),
      reasons: useLong ? longReasons : shortReasons,
      indicators: {
        macd: { line: macdLine.toFixed(2), signal: signalLine.toFixed(2) },
        rsi: rsi.toFixed(1),
        vwap: vwap.toFixed(2),
        rmi: rmi.toFixed(1),
        stoch: { k: k.toFixed(1), d: d.toFixed(1) },
        cci: cci.toFixed(0),
        adx: adx.toFixed(1),
        atr: atr.toFixed(2),
        sqzMom: sqzMom.toFixed(2),
        supertrend: supertrend.direction < 0 ? 'Bullish' : 'Bearish'
      },
      patterns: {
        bullishEngulfing: isBullishEngulfing,
        bearishEngulfing: isBearishEngulfing,
        doji: isDoji,
        hammer: isHammer,
        shootingStar: isShootingStar
      }
    };
  }
};

// ============================================
// GENERATE REALISTIC DEMO DATA
// ============================================
function generateDemoData() {
  const data = [];
  let price = 2350; // Current gold price range
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = 200; i >= 0; i--) {
    const trend = Math.sin(i / 30) * 0.3;
    const change = (Math.random() - 0.48 + trend) * 12;
    price = Math.max(2250, Math.min(2450, price + change));
    
    const open = price;
    const close = price + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 6;
    const low = Math.min(open, close) - Math.random() * 6;
    
    data.push({
      time: now - i * 3600,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 15000 + 5000)
    });
    price = close;
  }
  return data;
}

// ============================================
// INDICATOR PANEL COMPONENT
// ============================================
const IndicatorPanel = ({ indicators }) => {
  const items = [
    { label: 'RSI', value: indicators.rsi, color: parseFloat(indicators.rsi) > 50 ? 'var(--green)' : 'var(--red)' },
    { label: 'RMI', value: indicators.rmi, color: parseFloat(indicators.rmi) > 50 ? 'var(--green)' : 'var(--red)' },
    { label: 'MACD', value: indicators.macd.line, color: parseFloat(indicators.macd.line) > parseFloat(indicators.macd.signal) ? 'var(--green)' : 'var(--red)' },
    { label: 'Stoch K', value: indicators.stoch.k, color: parseFloat(indicators.stoch.k) > parseFloat(indicators.stoch.d) ? 'var(--green)' : 'var(--red)' },
    { label: 'CCI', value: indicators.cci, color: parseFloat(indicators.cci) > 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'ADX', value: indicators.adx, color: parseFloat(indicators.adx) > 20 ? 'var(--gold)' : 'var(--text-muted)' },
    { label: 'ATR', value: indicators.atr, color: 'var(--gold)' },
    { label: 'VWAP', value: indicators.vwap, color: 'var(--purple)' },
    { label: 'Supertrend', value: indicators.supertrend, color: indicators.supertrend === 'Bullish' ? 'var(--green)' : 'var(--red)' },
  ];

  return (
    <div className="indicator-panel">
      {items.map((item, i) => (
        <div key={i} className="indicator-item">
          <span className="indicator-label">{item.label}</span>
          <span className="indicator-value" style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// COMING SOON CHART PLACEHOLDER - TradingView Style with Zoom
// ============================================
const ComingSoonChart = () => {
  return (
    <div className="coming-soon-chart tradingview-style">
      <div className="coming-soon-content">
        <div className="coming-soon-logos">
          <div className="zoom-logo-container">
            <svg className="zoom-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#2D8CFF"/>
              <path d="M12 17C12 15.3431 13.3431 14 15 14H25C26.6569 14 28 15.3431 28 17V31C28 32.6569 26.6569 34 25 34H15C13.3431 34 12 32.6569 12 31V17Z" fill="white"/>
              <path d="M30 20L36 16V32L30 28V20Z" fill="white"/>
            </svg>
          </div>
          <span className="connection-indicator">⟷</span>
          <div className="tradingview-logo-container">
            <svg className="tradingview-logo" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#131722"/>
              <path d="M8 32L16 18L22 26L30 14L40 28" stroke="#2962FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="40" cy="28" r="3" fill="#2962FF"/>
            </svg>
          </div>
        </div>
        <h3 className="coming-soon-title coming-soon-title-emphasized">
          🔴 LIVE DEMO COMING SOON
        </h3>
        <p className="coming-soon-text coming-soon-text-emphasized">
          Real-time TradingView chart demonstration via Zoom
        </p>
        <div className="coming-soon-features">
          <span className="feature-tag feature-tag-primary">📺 Live TradingView Charts</span>
          <span className="feature-tag feature-tag-primary">🎥 Zoom Screen Share</span>
          <span className="feature-tag feature-tag-primary">📊 Real-time Analysis</span>
        </div>
        <div className="coming-soon-subtext">
          <p>Join live sessions to see the strategy in action</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD
// ============================================
export default function TradingDashboard() {
  const [data, setData] = useState(() => generateDemoData());
  const [signal, setSignal] = useState(() => OferWaronStrategy.calculate(generateDemoData()));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        const change = (Math.random() - 0.5) * 4;
        const newClose = last.close + change;

        newData[newData.length - 1] = {
          ...last,
          close: parseFloat(newClose.toFixed(2)),
          high: parseFloat(Math.max(last.high, newClose).toFixed(2)),
          low: parseFloat(Math.min(last.low, newClose).toFixed(2))
        };

        setSignal(OferWaronStrategy.calculate(newData));
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const latestPrice = data[data.length - 1]?.close || 0;

  return (
    <div className="trading-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            🏆 Ofer Waron Gold Strategy
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>
      </header>

      {/* Main Signal Panel */}
      {signal && (
        <div className={`signal-panel ${signal.signal === 'LONG' ? 'signal-long' : 'signal-short'}`}>
          <div className="signal-content">
            {/* <div className="signal-main">
              <span className={`signal-direction ${signal.signal === 'LONG' ? 'text-green' : 'text-red'}`}>
                {signal.signal === 'LONG' ? '📈' : '📉'} {signal.signal}
              </span>
              <div className={`confidence-badge ${signal.confidence >= 97 ? (signal.signal === 'LONG' ? 'confidence-high-long' : 'confidence-high-short') : ''}`}>
                {signal.confidence}%
              </div>
            </div> */}
            
            {/* <div className="signal-price">
              <div className="price-value">${latestPrice.toFixed(2)}</div>
              <div className="score-display">
                Long: {signal.longScore} | Short: {signal.shortScore}
              </div>
            </div> */}
          </div>

          {/* Signal Reasons */}
          {/* <div className="signal-reasons">
            {signal.reasons.slice(0, 8).map((reason, i) => (
              <span key={i} className="reason-tag">{reason}</span>
            ))}
          </div> */}
        </div>
      )}

      {/* Indicator Panel */}
      {/* {signal?.indicators && (
        <div className="indicators-section">
          <h3 className="section-label">📊 Live Indicator Values</h3>
          <IndicatorPanel indicators={signal.indicators} />
        </div>
      )} */}

      {/* Chart Section - Coming Soon */}
      <div className="chart-section">
        <ComingSoonChart />
      </div>

      {/* Pattern Detection */}
      {/* {signal?.patterns && ( */}
        {/* // <div className="patterns-section"> */}
          {/* <h3 className="section-label">🕯️ Candlestick Pattern Detection</h3> */}
          {/* <div className="patterns-grid">
            {[
              { name: 'Bullish Engulfing', active: signal.patterns.bullishEngulfing, type: 'bull' },
              { name: 'Bearish Engulfing', active: signal.patterns.bearishEngulfing, type: 'bear' },
              { name: 'Doji', active: signal.patterns.doji, type: 'neutral' },
              { name: 'Hammer', active: signal.patterns.hammer, type: 'bull' },
              { name: 'Shooting Star', active: signal.patterns.shootingStar, type: 'bear' },
            ].map((pattern, i) => (
              <div key={i} className={`pattern-item ${pattern.active ? `pattern-active pattern-${pattern.type}` : ''}`}>
                {pattern.active ? '✓ ' : ''}{pattern.name}
              </div>
            ))}
          </div>
        </div> */}
        {/* )} */}
      

      {/* Disclaimer */}
      {/* <footer className="dashboard-footer">
        ⚠️ Educational purposes only. This is a JavaScript implementation of the Pine Script strategy.
        <br />Always do your own research. Past performance ≠ future results.
      </footer> */}
    </div>
  );
}
