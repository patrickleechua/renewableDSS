import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Analysis() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("energyData");
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        setData([]);
      }
    }
  }, []);

  const cleaned = useMemo(() => {
    // Flexible column mapping (para gumana kahit Date/KWH, month/consumption)
    return data
      .map((r) => ({
        date: r.date || r.Date || r.month || r.Month || r.MONTH || "",
        kwh: Number(
          r.kwh ||
            r.KWH ||
            r.consumption ||
            r.Consumption ||
            r.usage ||
            r.Usage ||
            0
        ),
      }))
      .filter((r) => r.date && Number.isFinite(r.kwh) && r.kwh > 0);
  }, [data]);

  const summary = useMemo(() => {
    if (!cleaned.length) return null;

    const total = cleaned.reduce((s, r) => s + r.kwh, 0);
    const avg = total / cleaned.length;

    const peak = cleaned.reduce(
      (max, r) => (r.kwh > max.kwh ? r : max),
      cleaned[0]
    );

    return {
      avgMonthly: `${Math.round(avg).toLocaleString()} kWh`,
      peakMonth: String(peak.date),
      peakValue: `${Math.round(peak.kwh).toLocaleString()} kWh`,
      count: cleaned.length,
    };
  }, [cleaned]);

  const topMonths = useMemo(() => {
    return [...cleaned]
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 5)
      .map((r) => ({ month: String(r.date), kwh: r.kwh }));
  }, [cleaned]);

  return (
    <div style={{ color: "#222" }}>
      <h2 style={{ marginBottom: 8, color: "#111" }}>Consumption Analysis</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        Dito makikita ang pattern ng historical electricity usage: average, peak
        months, at trend visualization.
      </p>

      {!summary ? (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            padding: 14,
            borderRadius: 12,
            color: "#664d03",
          }}
        >
          Wala pang loaded data. Please upload muna sa <b>Data Upload</b> page.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginTop: 16,
            }}
          >
            <Card title="Avg Monthly Usage" value={summary.avgMonthly} />
            <Card title="Peak Month" value={summary.peakMonth} />
            <Card title="Peak Usage" value={summary.peakValue} />
            <Card title="Data Points" value={`${summary.count} months`} />
          </div>

          {/* Line Chart */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>
              Monthly Consumption Trend
            </h3>

            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cleaned}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="kwh"
                      stroke="#0b3d2e"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
              This chart is based on your uploaded dataset.
            </p>
          </div>

          {/* Top Months Table */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>
              Top Peak Months
            </h3>
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#222",
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>Month</th>
                    <th style={th}>kWh</th>
                  </tr>
                </thead>
                <tbody>
                  {topMonths.map((row, i) => (
                    <tr key={i}>
                      <td style={td}>{row.month}</td>
                      <td style={td}>
                        {Math.round(row.kwh).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insight Box */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                background: "#f6f7fb",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #e3e7ee",
                color: "#333",
              }}
            >
              <b>Quick Insight:</b> Ang peak months at average consumption ay
              pwedeng gamitin para mas accurate ang forecasting (SARIMAX) at para
              mas maayos ang sizing ng renewable energy options.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          marginTop: 6,
          color: "#111",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px 10px",
  borderBottom: "1px solid #eee",
  fontSize: 13,
  color: "#555",
};

const td = {
  padding: "10px 10px",
  borderBottom: "1px solid #f2f2f2",
};