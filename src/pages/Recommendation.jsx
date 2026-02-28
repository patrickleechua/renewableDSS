import { useEffect, useMemo, useState } from "react";

export default function Recommendation() {
  const [data, setData] = useState([]);
  const [ratePerKwh, setRatePerKwh] = useState(12);
  const [systemCost, setSystemCost] = useState(1500000);
  const [co2Factor, setCo2Factor] = useState(0.7);

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
    const last12 = cleaned.slice(-12);
    const sum = last12.reduce((s, x) => s + x.kwh, 0);
    return cleaned.length < 12 ? (sum / cleaned.length) * 12 : sum;
  }, [cleaned]);

  // Read readiness score from Readiness page (optional)
  const readinessScore = useMemo(() => {
    const raw = localStorage.getItem("readinessScore");
    if (!raw) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  }, []);

  const scenarios = useMemo(() => {
    const coverageOptions = [0.3, 0.5, 0.7];
    return coverageOptions.map((coverage) => {
      const kwhOffset = annualKwh * coverage;
      const savingsPerYear = kwhOffset * ratePerKwh;
      const paybackYears =
        savingsPerYear <= 0 ? null : systemCost / savingsPerYear;

      const co2ReducedKg = kwhOffset * co2Factor;
      const co2ReducedTons = co2ReducedKg / 1000;

      return {
        coverage,
        coverageLabel: `${Math.round(coverage * 100)}% Renewable`,
        kwhOffset: Math.round(kwhOffset),
        savingsPerYear: Math.round(savingsPerYear),
        paybackYears,
        co2ReducedTons,
      };
    });
  }, [annualKwh, ratePerKwh, systemCost, co2Factor]);

  const recommended = useMemo(() => {
    if (!scenarios.length) return null;

    // Simple recommendation rule:
    // - If readiness is high (>=80): choose max savings (70%)
    // - If medium (60–79): choose balanced (50%)
    // - If low (<60): choose conservative (30%)
    if (readinessScore !== null) {
      if (readinessScore >= 80) return scenarios.find((s) => s.coverage === 0.7);
      if (readinessScore >= 60) return scenarios.find((s) => s.coverage === 0.5);
      return scenarios.find((s) => s.coverage === 0.3);
    }

    // If no readiness score stored, default to 50% (balanced)
    return scenarios.find((s) => s.coverage === 0.5);
  }, [scenarios, readinessScore]);

  const reasons = useMemo(() => {
    if (!recommended) return [];
    const reasonList = [];

    reasonList.push(
      "Based on your historical electricity consumption, the system estimates annual demand and evaluates renewable coverage scenarios."
    );

    if (readinessScore === null) {
      reasonList.push(
        "Readiness score is not yet linked, so the system uses a balanced default scenario."
      );
    } else if (readinessScore >= 80) {
      reasonList.push(
        "High readiness suggests stable consumption and sufficient data, allowing a higher renewable coverage plan."
      );
    } else if (readinessScore >= 60) {
      reasonList.push(
        "Medium readiness suggests the institution can proceed with a moderate renewable coverage to minimize risk."
      );
    } else {
      reasonList.push(
        "Low readiness suggests starting conservatively while improving data consistency and performing energy audit activities."
      );
    }

    reasonList.push(
      "The recommendation includes measurable outputs (savings, payback, and CO₂ reduction) to support decision-making."
    );

    return reasonList;
  }, [recommended, readinessScore]);

  return (
    <div style={{ color: "#222" }}>
      <h2 style={{ marginBottom: 8, color: "#111" }}>Recommendation & Results</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        This page provides the system’s recommended renewable transition scenario
        and summarizes expected results.
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
            <Input label="Electricity Rate (PHP/kWh)" value={ratePerKwh} onChange={setRatePerKwh} />
            <Input label="Estimated System Cost (PHP)" value={systemCost} onChange={setSystemCost} />
            <Input label="CO₂ Factor (kg CO₂/kWh)" value={co2Factor} onChange={setCo2Factor} step="0.01" />
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
                readiness score: {readinessScore === null ? "not linked" : readinessScore}
              </div>
            </div>
          </div>

          {/* Recommendation Card */}
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                border: "1px solid rgba(11, 61, 46, 0.25)",
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>Recommended Scenario</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0b3d2e", marginTop: 6 }}>
                {recommended?.coverageLabel}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14 }}>
                <MiniCard title="kWh Offset / Year" value={recommended?.kwhOffset?.toLocaleString()} />
                <MiniCard title="Savings / Year (PHP)" value={recommended?.savingsPerYear?.toLocaleString()} />
                <MiniCard
                  title="Payback (Years)"
                  value={recommended?.paybackYears ? recommended.paybackYears.toFixed(1) : "-"}
                />
                <MiniCard
                  title="CO₂ Reduced (tons/yr)"
                  value={recommended ? recommended.co2ReducedTons.toFixed(2) : "-"}
                />
              </div>
            </div>
          </div>

          {/* Reasons */}
          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>Why this recommendation?</h3>
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {reasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scenario Table */}
          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>All Scenario Results</h3>
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Scenario</th>
                      <th style={th}>kWh Offset / Year</th>
                      <th style={th}>Savings / Year (PHP)</th>
                      <th style={th}>Payback (Years)</th>
                      <th style={th}>CO₂ Reduced (tons/yr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => (
                      <tr key={i} style={recommended?.coverage === s.coverage ? highlightRow : null}>
                        <td style={td}><b>{s.coverageLabel}</b></td>
                        <td style={td}>{s.kwhOffset.toLocaleString()}</td>
                        <td style={td}>{s.savingsPerYear.toLocaleString()}</td>
                        <td style={td}>{s.paybackYears ? s.paybackYears.toFixed(1) : "-"}</td>
                        <td style={td}>{s.co2ReducedTons.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Note */}
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
              <b>Note:</b> These are estimation-based outputs for decision support.
              In the final version, SARIMAX forecast + expert rules will refine the recommendation.
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

function MiniCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #eef0f4",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#111", marginTop: 6 }}>
        {value ?? "-"}
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

const highlightRow = {
  background: "rgba(11, 61, 46, 0.08)",
};