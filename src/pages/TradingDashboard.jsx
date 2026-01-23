// ============================================
// TradingDashboard.jsx - Ofer Waron 97% Gold Strategy
// Full Pine Script → JavaScript Implementation
// ============================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

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
// PRICE CHART WITH INDICATORS
// ============================================
const PriceChart = ({ data, indicators }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 450,
      layout: {
        background: { color: '#0d0d0d' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#333' },
      timeScale: { borderColor: '#333', timeVisible: true },
    });

    chartRef.current = chart;

    // Candlesticks
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });
    candleSeries.setData(data);

    // SMA 20 (Yellow)
    const sma20 = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 2 });
    sma20.setData(Indicators.SMA(data, 20));

    // VWAP (Purple)
    const vwapSeries = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2 });
    vwapSeries.setData(Indicators.VWAP(data));

    // Bollinger Bands
    const bb = Indicators.BollingerBands(data, 20, 2);
    const bbUpper = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, lineStyle: 2 });
    bbUpper.setData(bb.upper);
    const bbLower = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, lineStyle: 2 });
    bbLower.setData(bb.lower);

    // Supertrend
    const supertrendData = Indicators.Supertrend(data, 3.0, 10);
    const stUp = supertrendData.filter(d => d.direction < 0);
    const stDown = supertrendData.filter(d => d.direction > 0);
    
    if (stUp.length > 0) {
      const stUpSeries = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 2 });
      stUpSeries.setData(stUp);
    }
    if (stDown.length > 0) {
      const stDownSeries = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 2 });
      stDownSeries.setData(stDown);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} style={{ borderRadius: '8px', overflow: 'hidden' }} />;
};

// ============================================
// RSI CHART
// ============================================
const RSIChart = ({ data }) => {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 150,
      layout: {
        background: { color: '#0d0d0d' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      rightPriceScale: { borderColor: '#333' },
      timeScale: { visible: false },
    });

    const rsiSeries = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 });
    rsiSeries.setData(Indicators.RSI(data, 14));

    // Overbought/Oversold lines
    const overbought = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: 2 });
    const oversold = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: 2 });
    
    const timeRange = data.map(d => ({ time: d.time, value: 70 }));
    const timeRange30 = data.map(d => ({ time: d.time, value: 30 }));
    overbought.setData(timeRange);
    oversold.setData(timeRange30);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} style={{ borderRadius: '8px', overflow: 'hidden' }} />;
};

// ============================================
// INDICATOR PANEL
// ============================================
const IndicatorPanel = ({ indicators }) => {
  if (!indicators) return null;

  const items = [
    { label: 'MACD', value: `${indicators.macd.line} / ${indicators.macd.signal}`, color: parseFloat(indicators.macd.line) > parseFloat(indicators.macd.signal) ? '#22c55e' : '#ef4444' },
    { label: 'RSI', value: indicators.rsi, color: parseFloat(indicators.rsi) > 55 ? '#22c55e' : parseFloat(indicators.rsi) < 45 ? '#ef4444' : '#fbbf24' },
    { label: 'RMI', value: indicators.rmi, color: parseFloat(indicators.rmi) > 50 ? '#22c55e' : '#ef4444' },
    { label: 'Stoch K/D', value: `${indicators.stoch.k} / ${indicators.stoch.d}`, color: parseFloat(indicators.stoch.k) > parseFloat(indicators.stoch.d) ? '#22c55e' : '#ef4444' },
    { label: 'CCI', value: indicators.cci, color: parseFloat(indicators.cci) > 100 ? '#22c55e' : parseFloat(indicators.cci) < -100 ? '#ef4444' : '#9ca3af' },
    { label: 'ADX', value: indicators.adx, color: parseFloat(indicators.adx) > 20 ? '#22c55e' : '#9ca3af' },
    { label: 'ATR', value: indicators.atr, color: '#a855f7' },
    { label: 'Squeeze', value: indicators.sqzMom, color: parseFloat(indicators.sqzMom) > 0 ? '#22c55e' : '#ef4444' },
    { label: 'Supertrend', value: indicators.supertrend, color: indicators.supertrend === 'Bullish' ? '#22c55e' : '#ef4444' },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
      gap: '0.75rem',
      padding: '1rem',
      background: '#111',
      borderRadius: '8px'
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{item.label}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: item.color }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN DASHBOARD
// ============================================
function TradingDashboard() {
  const [data, setData] = useState([]);
  const [signal, setSignal] = useState(null);
  const [chartType, setChartType] = useState('custom');

  useEffect(() => {
    const marketData = generateDemoData();
    setData(marketData);
    setSignal(OferWaronStrategy.calculate(marketData));

    // Live updates every 3 seconds
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
      color: '#fff',
      padding: '1.5rem'
    }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700',
          background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🏆 Ofer Waron Gold Strategy
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Full Pine Script Implementation • Live Demo • XAUUSD
        </p>
      </header>

      {/* Main Signal Panel */}
      {signal && (
        <div style={{
          background: signal.signal === 'LONG' 
            ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
          border: `2px solid ${signal.signal === 'LONG' ? '#22c55e' : '#ef4444'}`,
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: signal.signal === 'LONG' ? '#22c55e' : '#ef4444'
              }}>
                {signal.signal === 'LONG' ? '📈' : '📉'} {signal.signal}
              </span>
              <div style={{
                background: signal.confidence >= 97 ? (signal.signal === 'LONG' ? '#22c55e' : '#ef4444') : '#333',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                {signal.confidence}%
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fbbf24', fontSize: '2rem', fontWeight: '700' }}>
                ${latestPrice.toFixed(2)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                Long: {signal.longScore} | Short: {signal.shortScore}
              </div>
            </div>
          </div>

          {/* Signal Reasons */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem', 
            marginTop: '1rem' 
          }}>
            {signal.reasons.slice(0, 8).map((reason, i) => (
              <span key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#d1d5db'
              }}>
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Indicator Panel */}
      {signal?.indicators && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            📊 Live Indicator Values
          </h3>
          <IndicatorPanel indicators={signal.indicators} />
        </div>
      )}

      {/* Chart Type Toggle */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setChartType('custom')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            background: chartType === 'custom' ? '#fbbf24' : '#333',
            color: chartType === 'custom' ? '#000' : '#fff'
          }}
        >
          📊 Strategy Chart
        </button>
        <button
          onClick={() => setChartType('tradingview')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            background: chartType === 'tradingview' ? '#fbbf24' : '#333',
            color: chartType === 'tradingview' ? '#000' : '#fff'
          }}
        >
          📺 TradingView Widget
        </button>
      </div>

      {/* Charts */}
      <div style={{ 
        background: '#0d0d0d', 
        borderRadius: '12px', 
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        {chartType === 'custom' ? (
          <>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#fbbf24', marginRight: '1rem' }}>━ SMA20</span>
              <span style={{ color: '#a855f7', marginRight: '1rem' }}>━ VWAP</span>
              <span style={{ color: '#3b82f6', marginRight: '1rem' }}>┅ BB</span>
              <span style={{ color: '#22c55e' }}>━ Supertrend</span>
            </div>
            <PriceChart data={data} />
            <div style={{ marginTop: '1rem' }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.5rem' }}>RSI (14)</div>
              <RSIChart data={data} />
            </div>
          </>
        ) : (
          <div style={{ height: '500px' }}>
            <iframe
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              src="https://s.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=60&theme=dark&style=1&timezone=Asia%2FJerusalem&studies=MASimple%4040&studies=RSI%4014"
              title="TradingView"
            />
          </div>
        )}
      </div>

      {/* Pattern Detection */}
      {signal?.patterns && (
        <div style={{ 
          background: '#111', 
          borderRadius: '12px', 
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            🕯️ Candlestick Pattern Detection
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {[
              { name: 'Bullish Engulfing', active: signal.patterns.bullishEngulfing, type: 'bull' },
              { name: 'Bearish Engulfing', active: signal.patterns.bearishEngulfing, type: 'bear' },
              { name: 'Doji', active: signal.patterns.doji, type: 'neutral' },
              { name: 'Hammer', active: signal.patterns.hammer, type: 'bull' },
              { name: 'Shooting Star', active: signal.patterns.shootingStar, type: 'bear' },
            ].map((pattern, i) => (
              <div key={i} style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: pattern.active ? (
                  pattern.type === 'bull' ? 'rgba(34,197,94,0.2)' :
                  pattern.type === 'bear' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'
                ) : '#1a1a1a',
                border: `1px solid ${pattern.active ? (
                  pattern.type === 'bull' ? '#22c55e' :
                  pattern.type === 'bear' ? '#ef4444' : '#fbbf24'
                ) : '#333'}`,
                color: pattern.active ? '#fff' : '#6b7280',
                fontSize: '0.85rem'
              }}>
                {pattern.active ? '✓ ' : ''}{pattern.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <footer style={{ 
        textAlign: 'center', 
        color: '#6b7280', 
        fontSize: '0.8rem',
        padding: '1rem',
        borderTop: '1px solid #222'
      }}>
        ⚠️ Educational purposes only. This is a JavaScript implementation of the Pine Script strategy.
        <br />Always do your own research. Past performance ≠ future results.
      </footer>
    </div>
  );
}

export default TradingDashboard;
