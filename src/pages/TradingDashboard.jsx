import LiveStream from './LiveStream';
import LiveAlertsFeed from '../components/LiveAlertsFeed';

export default function TradingDashboard() {
  return (
    <LiveStream autoSelectLive pagePath="/trading">
      <LiveAlertsFeed />
    </LiveStream>
  );
}
