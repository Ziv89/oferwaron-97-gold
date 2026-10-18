import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// This is the data.json your GitHub Action generates and publishes.
// Your React marketing site (on Vercel) fetches it cross-origin — GitHub
// Pages allows that, so no CORS setup is needed on your side.
const DATA_URL = "https://ziv89.github.io/gold-dashboard/data.json";

export default function GoldWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <div style={styles.card}>Gold price unavailable right now.</div>;
  }
  if (!data) {
    return <div style={styles.card}>Loading gold price…</div>;
  }

  const up = data.change >= 0;
  const accent = up ? "#1f9d55" : "#d64550";

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.label}>Gold · XAUUSD</span>
        <span style={styles.updated}>updated {data.updated}</span>
      </div>

      <div style={styles.priceRow}>
        <span style={styles.price}>${data.price.toLocaleString()}</span>
        <span style={{ ...styles.change, color: accent }}>
          {up ? "▲" : "▼"} {data.change > 0 ? "+" : ""}
          {data.change} ({data.pct > 0 ? "+" : ""}
          {data.pct}%)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data.history}>
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            formatter={(v) => [`$${v}`, "Gold"]}
            labelFormatter={(l) => l}
          />
          <Line
            type="monotone"
            dataKey="close"
            dot={false}
            stroke={accent}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={styles.foot}>Last 90 days · not financial advice</div>
    </div>
  );
}

// Inline styles just so this works when you paste it. Replace with your own
// CSS / Tailwind classes to match the marketing site.
const styles = {
  card: {
    maxWidth: 360,
    padding: 18,
    borderRadius: 14,
    border: "1px solid #e5e5e5",
    background: "#fff",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 2px 10px rgba(0,0,0,.05)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontWeight: 600, fontSize: 13, letterSpacing: ".03em", color: "#333" },
  updated: { fontSize: 11, color: "#999" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 10, margin: "10px 0 4px" },
  price: { fontSize: 28, fontWeight: 700, color: "#1a1a1a" },
  change: { fontSize: 14, fontWeight: 600 },
  foot: { fontSize: 11, color: "#aaa", marginTop: 6 },
};
