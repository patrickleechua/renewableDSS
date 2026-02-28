import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analysis from "./pages/Analysis";
import Forecast from "./pages/Forecast";
import Readiness from "./pages/Readiness";
import Scenarios from "./pages/Scenarios";
import Recommendation from "./pages/Recommendation";
import Reports from "./pages/Reports";

function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 20, background: "#f6f7fb" }}>
        <div
          style={{
            background: "white",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            minHeight: "calc(100vh - 40px)",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/upload" element={<Layout><Upload /></Layout>} />
        <Route path="/analysis" element={<Layout><Analysis /></Layout>} />
        <Route path="/forecast" element={<Layout><Forecast /></Layout>} />
        <Route path="/readiness" element={<Layout><Readiness /></Layout>} />
        <Route path="/scenarios" element={<Layout><Scenarios /></Layout>} />
        <Route path="/recommendation" element={<Layout><Recommendation /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}