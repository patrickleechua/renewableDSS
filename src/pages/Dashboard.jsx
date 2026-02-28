export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>

      {/* SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <Card title="Avg Monthly Usage" value="120,000 kWh" />
        <Card title="Peak Month" value="May" />
        <Card title="Next Month Forecast" value="128,500 kWh" />
        <Card title="Readiness Score" value="82 / 100" />
      </div>

      {/* CHART PLACEHOLDER */}
      <div style={{ marginTop: 30 }}>
        <h3>Electricity Consumption Trend</h3>
        <div
          style={{
            height: 250,
            background: "#eef2f7",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
        >
          Chart will be displayed here
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 6 }}>{value}</div>
    </div>
  );
}