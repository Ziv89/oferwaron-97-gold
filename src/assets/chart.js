import { createChart } from 'lightweight-charts';

export function initChart(container, type = 'line', isDark = true, data = []) {
  const chart = createChart(container, {
    width: container.clientWidth,
    height: 400,
    layout: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      textColor: isDark ? '#ffffff' : '#000000',
    },
    grid: {
      vertLines: { color: isDark ? '#444' : '#e0e0e0' },
      horzLines: { color: isDark ? '#444' : '#e0e0e0' },
    },
  });

  let series;

  switch (type) {
    case 'area':
      series = chart.addAreaSeries({
        lineColor: '#2962FF',
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
      });
      series.setData(data.map(d => ({ time: d.time, value: d.value })));
      break;
    case 'candlestick':
      series = chart.addCandlestickSeries();
      series.setData(data);
      break;
    case 'bar':
      series = chart.addBarSeries();
      series.setData(data);
      break;
    case 'histogram':
      series = chart.addHistogramSeries({ color: '#FFA500' });
      series.setData(data.map(d => ({ time: d.time, value: d.value })));
      break;
    default:
      series = chart.addLineSeries({ color: '#FFD700' });
      series.setData(data.map(d => ({ time: d.time, value: d.value })));
  }

  return chart;
}
