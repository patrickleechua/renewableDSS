import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: "white",
  background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
});

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        background: "#0b3d2e",
        color: "white",
        padding: 16,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>RenewableDSS</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          Institutional Energy Analytics
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <NavLink to="/" style={linkStyle} end>Dashboard</NavLink>
        <NavLink to="/upload" style={linkStyle}>Data Upload</NavLink>
        <NavLink to="/analysis" style={linkStyle}>Consumption Analysis</NavLink>
        <NavLink to="/forecast" style={linkStyle}>Forecast (SARIMAX)</NavLink>
        <NavLink to="/readiness" style={linkStyle}>Readiness Score</NavLink>
        <NavLink to="/scenarios" style={linkStyle}>Scenario Simulator</NavLink>
        <NavLink to="/recommendation" style={linkStyle}>Recommendation & Results</NavLink>
        <NavLink to="/reports" style={linkStyle}>Reports / Export</NavLink>
      </nav>

      <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.8 }}>
        v0.1 (UI Prototype)
      </div>
    </aside>
  );
}