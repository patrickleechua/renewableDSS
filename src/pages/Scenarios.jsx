import { useEffect, useMemo, useState } from "react";

export default function Scenarios() {
  const [data, setData] = useState([]);
  const [ratePerKwh, setRatePerKwh] = useState(12); // PHP/kWh (editable)
  const [systemCost, setSystemCost] = useState(1500000); // PHP (editable)
  const [co2Factor, setCo2Factor] = useState(0.7); // kg CO2 per kWh (estimate)

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
    return data
      .map((r) => ({
        date: r.date || r.Date || r.month || r.Month || "",
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

  const annualKwh = useMemo(() => {
    if (!cleaned.length) return 0;

    // If dataset is monthly: use last 12 months if available
    const last12 = cleaned.slice(-12);
    const sum = last12.reduce((s, x) => s + x.kwh, 0);

    // If less than 12, estimate annual by scaling
    const scaled = cleaned.length < 12 ? (sum / cleaned.length) * 12 : sum;
    return scaled;
  }, [cleaned]);

  const scenarios = useMemo(() => {
    const coverageOptions = [0.3, 0.5, 0.7]; // 30%, 50%, 70%

    return coverageOptions.map((coverage) => {
      const kwhOffset = annualKwh * coverage; // kWh replaced by renewable
      const savingsPerYear = kwhOffset * ratePerKwh; // PHP saved annually

      // Simple payback estimation
      const paybackYears =
        savingsPerYear <= 0 ? "-" : (systemCost / savingsPerYear).toFixed(1);

      // CO2 reduction estimate (kg → convert to tons)
      const co2ReducedKg = kwhOffset * co2Factor;
      const co2ReducedTons = (co2ReducedKg / 1000).toFixed(2);

      return {
        coverageLabel: `${Math.round(coverage * 100)}% Renewable`,
        kwhOffset: Math.round(kwhOffset),
        savingsPerYear: Math.round(savingsPerYear),
        paybackYears,
        co2ReducedTons,
      };
    });
  }, [annualKwh, ratePerKwh, systemCost, co2Factor]);

  const bestScenario = useMemo(() => {
    if (!scenarios.length) return null;
    // Best = highest savings; you can change logic later
    return scenarios.reduce((best, s) =>
      s.savingsPerYear > best.savingsPerYear ? s : best
    , scenarios[0]);
  }, [scenarios]);

  return (
    <div style={{ color: "#222" }}>
      <h2 style={{ marginBottom: 8, color: "#111" }}>Scenario Simulator</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        Compare renewable transition scenarios (30%, 50%, 70%) and view estimated
        savings, payback period, and CO₂ reduction.
      </p>

      {annualKwh === 0 ? (
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
          {/* Inputs */}
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            <Input
              label="Electricity Rate (PHP/kWh)"
              value={ratePerKwh}
              onChange={setRatePerKwh}
            />
            <Input
              label="Estimated System Cost (PHP)"
              value={systemCost}
              onChange={setSystemCost}
            />
            <Input
              label="CO₂ Factor (kg CO₂/kWh)"
              value={co2Factor}
              onChange={setCo2Factor}
              step="0.01"
            />
            <div
              style={{
                background: "#f6f7fb",
                border: "1px solid #e3e7ee",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>Estimated Annual kWh</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6, color: "#111" }}>
                {Math.round(annualKwh).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                (based on last 12 months / scaled)
              </div>
            </div>
          </div>

          {/* Scenario Table */}
          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>
              Scenario Comparison
            </h3>
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#222" }}>
                  <thead>
                    <tr>
                      <th style={th}>Scenario</th>
                      <th style={th}>kWh Offset / Year</th>
                      <th style={th}>Estimated Savings / Year (PHP)</th>
                      <th style={th}>Payback (Years)</th>
                      <th style={th}>CO₂ Reduced (tons/yr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => (
                      <tr key={i} style={bestScenario?.coverageLabel === s.coverageLabel ? highlightRow : null}>
                        <td style={td}><b>{s.coverageLabel}</b></td>
                        <td style={td}>{s.kwhOffset.toLocaleString()}</td>
                        <td style={td}>{s.savingsPerYear.toLocaleString()}</td>
                        <td style={td}>{s.paybackYears}</td>
                        <td style={td}>{s.co2ReducedTons}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bestScenario && (
                <div
                  style={{
                    marginTop: 14,
                    background: "#f6f7fb",
                    border: "1px solid #e3e7ee",
                    borderRadius: 12,
                    padding: 12,
                    color: "#333",
                  }}
                >
                  <b>Best Scenario (by savings):</b> {bestScenario.coverageLabel} — approx.{" "}
                  <b>₱{bestScenario.savingsPerYear.toLocaleString()}</b> savings per year.
                </div>
              )}
            </div>
          </div>

          {/* Note for defense */}
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                background: "#f6f7fb",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #e3e7ee",
                color: "#333",
              }}
            >
              <b>Note:</b> These outputs are estimation-based for decision support.
              In the final system, the backend will refine sizing, costs, and CO₂ factors
              using actual institution parameters and expert inputs.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Input({ label, value, onChange, step }) {
  return (
    <div
      style={{
        border: "1px solid #eef0f4",
        borderRadius: 12,
        padding: 12,
        background: "white",
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <input
        type="number"
        value={value}
        step={step || 1}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          marginTop: 6,
          width: "100%",
          padding: 8,
          borderRadius: 10,
          border: "1px solid #d9dee6",
          outline: "none",
        }}
      />
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

const highlightRow = {
  background: "rgba(11, 61, 46, 0.08)",
};