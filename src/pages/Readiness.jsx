import { useEffect, useMemo, useState } from "react";

export default function Readiness() {
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

  const metrics = useMemo(() => {
    if (!cleaned.length) return null;

    const values = cleaned.map((x) => x.kwh);
    const n = values.length;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const peak = Math.max(...values);
    const min = Math.min(...values);

    // stdev
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdev = Math.sqrt(variance);

    // coefficient of variation (stability)
    const cv = mean === 0 ? 999 : stdev / mean; // lower = more stable

    // simple trend (first vs last)
    const first = values[0];
    const last = values[n - 1];
    const growthRate = first === 0 ? 0 : (last - first) / first; // e.g., 0.10 = +10%

    // peakiness ratio
    const peakRatio = mean === 0 ? 0 : peak / mean;

    return { mean, peak, min, stdev, cv, growthRate, peakRatio, n };
  }, [cleaned]);

  const scorePack = useMemo(() => {
    if (!metrics) return null;

    // Convert metrics to sub-scores (0–100)
    // 1) Stability (lower CV is better)
    const stabilityScore = clamp(100 - metrics.cv * 200, 0, 100);

    // 2) Predictability (lower peak ratio is better)
    const predictabilityScore = clamp(130 - metrics.peakRatio * 40, 0, 100);

    // 3) Data sufficiency (more months = better, cap at 36)
    const dataScore = clamp((metrics.n / 36) * 100, 0, 100);

    // 4) Growth pressure (lower growth is easier to plan)
    // if growthRate is high, score decreases
    const growthScore = clamp(100 - Math.abs(metrics.growthRate) * 120, 0, 100);

    // Weighted final score
    const finalScore = Math.round(
      stabilityScore * 0.35 +
        predictabilityScore * 0.25 +
        dataScore * 0.20 +
        growthScore * 0.20
    );

    const level =
      finalScore >= 80 ? "HIGH" : finalScore >= 60 ? "MEDIUM" : "LOW";

    const interpretation =
      level === "HIGH"
        ? "Handa na ang institution for renewable transition planning. Stable ang consumption at may enough data para mag-plan nang maayos."
        : level === "MEDIUM"
        ? "Moderately ready. May ilang variability o kulang sa data, pero kaya na mag-start ng planning with caution."
        : "Low readiness. High variability o kulang ang data, kaya kailangan muna ng data improvement/energy audit bago mag-commit.";

    return {
      finalScore,
      level,
      interpretation,
      breakdown: [
        { name: "Stability (CV)", value: Math.round(stabilityScore) },
        { name: "Predictability (Peak)", value: Math.round(predictabilityScore) },
        { name: "Data Sufficiency", value: Math.round(dataScore) },
        { name: "Growth Pressure", value: Math.round(growthScore) },
      ],
    };
  }, [metrics]);

  return (
    <div style={{ color: "#222" }}>
      <h2 style={{ marginBottom: 8, color: "#111" }}>Readiness Score</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        This page estimates how ready the institution is for renewable energy
        transition planning based on consumption stability, peaks, data
        sufficiency, and trend.
      </p>

      {!scorePack ? (
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
          {/* Score Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 13, color: "#666" }}>Overall Readiness</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: "#0b3d2e" }}>
                  {scorePack.finalScore}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  / 100 ({scorePack.level})
                </div>
              </div>

              <Progress value={scorePack.finalScore} />

              <p style={{ marginTop: 12, color: "#333" }}>
                {scorePack.interpretation}
              </p>
            </div>

            {/* Metrics quick view */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#111" }}>Quick Metrics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MiniCard title="Avg Monthly kWh" value={fmt(metrics.mean)} />
                <MiniCard title="Peak kWh" value={fmt(metrics.peak)} />
                <MiniCard title="Std Dev" value={fmt(metrics.stdev)} />
                <MiniCard title="Months" value={metrics.n} />
              </div>

              <div
                style={{
                  marginTop: 12,
                  background: "#f6f7fb",
                  border: "1px solid #e3e7ee",
                  borderRadius: 12,
                  padding: 12,
                  color: "#333",
                }}
              >
                <b>Note:</b> Readiness score is a decision-support indicator.
                Next module will use this score to justify recommendations.
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#111" }}>
              Score Breakdown
            </h3>

            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              {scorePack.breakdown.map((b) => (
                <div key={b.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div style={{ color: "#555" }}>{b.value}/100</div>
                  </div>
                  <Progress value={b.value} small />
                </div>
              ))}
            </div>
          </div>

          {/* Simple action suggestion */}
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
              <b>Suggested Next Action:</b>{" "}
              {scorePack.level === "HIGH"
                ? "Proceed to Scenario Simulator and Recommendation modules."
                : scorePack.level === "MEDIUM"
                ? "Proceed, but review peak months and consider energy efficiency measures."
                : "Improve data collection and perform an energy audit before transition planning."}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Progress({ value, small }) {
  return (
    <div
      style={{
        height: small ? 10 : 14,
        width: "100%",
        background: "#eef2f7",
        borderRadius: 999,
        overflow: "hidden",
        marginTop: 10,
        border: "1px solid #e3e7ee",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${clamp(value, 0, 100)}%`,
          background: "#0b3d2e",
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
      <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function fmt(num) {
  if (!Number.isFinite(num)) return "-";
  return Math.round(num).toLocaleString();
}