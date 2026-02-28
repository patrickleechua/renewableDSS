import { useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Forecast() {
  const [steps, setSteps] = useState(12);
  const [loading, setLoading] = useState(false);
  const [forecastRows, setForecastRows] = useState([]); // [{date,kwh}]
  const [mode, setMode] = useState("dummy"); // "dummy" or "api"

  const cleaned = useMemo(() => {
    const raw = localStorage.getItem("energyData");
    if (!raw) return [];

    try {
      const data = JSON.parse(raw);
      return data
        .map((r) => ({
          date: r.date || r.Date || r.month || r.Month || "",
          kwh: Number(r.kwh || r.KWH || r.consumption || r.Consumption || 0),
        }))
        .filter((r) => r.date && Number.isFinite(r.kwh) && r.kwh > 0);
    } catch {
      return [];
    }
  }, []);

  const combinedForChart = useMemo(() => {
    // merge history + forecast for chart display
    const f = forecastRows.map((x) => ({ ...x, isForecast: true }));
    const h = cleaned.map((x) => ({ ...x, isForecast: false }));
    return [...h, ...f];
  }, [cleaned, forecastRows]);

  const runDummyForecast = () => {
    if (!cleaned.length) {
      alert("Upload muna ng data sa Data Upload page.");
      return;
    }
    // simple dummy forecast: last value + small increase
    const last = cleaned[cleaned.length - 1].kwh;
    const out = [];
    for (let i = 1; i <= steps; i++) {
      out.push({
        date: `Forecast +${i}`,
        kwh: Math.round(last * (1 + 0.01 * i)),
      });
    }
    setForecastRows(out);
  };

  const runApiForecast = async () => {
    // Later: connect to backend /forecast endpoint
    // For now, this is ready but needs file upload to backend.
    alert("API mode is ready. Next step natin: connect sa backend /forecast.");
  };

  const runForecast = async () => {
    setLoading(true);
    try {
      if (mode === "dummy") runDummyForecast();
      else await runApiForecast();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: "#222" }}>
      <h2 style={{ marginBottom: 8, color: "#111" }}>Forecast (SARIMAX)</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        This page generates future electricity demand forecasts (next months).  
        (UI muna ngayon; next step i-connect natin sa SARIMAX backend.)
      </p>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: "white",
          padding: 14,
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <label>
          Forecast months:{" "}
          <input
            type="number"
            min={1}
            max={36}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            style={{ width: 80, padding: 6 }}
          />
        </label>

        <label>
          Mode:{" "}
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: 6 }}>
            <option value="dummy">Dummy (UI demo)</option>
            <option value="api">SARIMAX API (next step)</option>
          </select>
        </label>

        <button
          onClick={runForecast}
          disabled={loading}
          style={{
            marginLeft: "auto",
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#0b3d2e",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Running..." : "Run Forecast"}
        </button>
      </div>

      {/* Chart */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>Historical + Forecast Trend</h3>
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
              <LineChart data={combinedForChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="kwh" stroke="#0b3d2e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
            Note: Dummy mode uses a simple growth preview. SARIMAX will replace this in API mode.
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>Forecast Output Table</h3>
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          {!forecastRows.length ? (
            <p style={{ color: "#666" }}>Click “Run Forecast” to generate outputs.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Period</th>
                    <th style={th}>Forecast kWh</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastRows.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.date}</td>
                      <td style={td}>{Number(r.kwh).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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