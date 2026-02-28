import { useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const navigate = useNavigate();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [notes, setNotes] = useState([]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setRows([]);
    setColumns([]);
    setNotes([]);

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (!json.length) {
      setNotes(["Walang nabasang rows sa file. Check format."]);
      return;
    }

    const cols = Object.keys(json[0]);

    // ✅ Save FULL dataset for other pages
    localStorage.setItem("energyData", JSON.stringify(json));
    localStorage.setItem("energyColumns", JSON.stringify(cols));

    setColumns(cols);
    setRows(json.slice(0, 10)); // preview first 10

    // --- Helpers (case-insensitive column match)
    const lowerCols = cols.map((c) => String(c).toLowerCase());
    const hasDate = lowerCols.includes("date") || lowerCols.includes("month");
    const hasKwh =
      lowerCols.includes("kwh") ||
      lowerCols.includes("kw h") ||
      lowerCols.includes("consumption") ||
      lowerCols.includes("usage");

    // --- Find the actual column names to check missing values
    const dateKey =
      cols[lowerCols.indexOf("date")] ||
      cols[lowerCols.indexOf("month")] ||
      null;

    const kwhKey =
      cols[lowerCols.indexOf("kwh")] ||
      cols[lowerCols.indexOf("consumption")] ||
      cols[lowerCols.indexOf("usage")] ||
      null;

    // simple validation notes
    const n = [];

    if (!hasDate) n.push("Missing required column: 'date' (or 'Date'/'month').");
    if (!hasKwh) n.push("Missing required column: 'kwh' (or 'KWH'/'consumption'/'usage').");

    if (kwhKey) {
      const missingKwh = json.filter((r) => r[kwhKey] === "" || r[kwhKey] === null || r[kwhKey] === undefined).length;
      if (missingKwh > 0) n.push(`May ${missingKwh} rows na walang kWh value.`);
    }

    if (dateKey) {
      const missingDate = json.filter((r) => r[dateKey] === "" || r[dateKey] === null || r[dateKey] === undefined).length;
      if (missingDate > 0) n.push(`May ${missingDate} rows na walang date value.`);
    }

    if (n.length === 0) n.push("✅ File looks good. Ready for analysis.");
    setNotes(n);
  };

  const hasMissingRequired = notes.some((x) => x.toLowerCase().startsWith("missing required column"));

  return (
    <div style={{ color: "#222" }}>
      <h2 style={{ marginBottom: 10, color: "#111" }}>Data Upload</h2>
      <p style={{ marginTop: 0, color: "#555" }}>
        Upload ng CSV/Excel na may columns: <b>date</b>, <b>kwh</b> (monthly).
        <br />
        <span style={{ fontSize: 13, color: "#777" }}>
          (Accepted din: Date/KWH, month/consumption/usage)
        </span>
      </p>

      <div
        style={{
          background: "#f6f7fb",
          borderRadius: 12,
          padding: 16,
          border: "1px dashed #b8c2cc",
          marginBottom: 16,
        }}
      >
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
        {fileName && (
          <p style={{ margin: "10px 0 0 0" }}>
            <b>Selected:</b> {fileName}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Notes */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#111" }}>Validation Notes</h3>

          {notes.length === 0 ? (
            <p style={{ color: "#666", marginTop: 0 }}>Wala pang file. Upload muna.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {notes.map((x, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {x}
                </li>
              ))}
            </ul>
          )}

          <button
            disabled={!fileName || hasMissingRequired}
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: !fileName || hasMissingRequired ? "not-allowed" : "pointer",
              opacity: !fileName || hasMissingRequired ? 0.5 : 1,
              background: "#0b3d2e",
              color: "white",
              fontWeight: 700,
            }}
            onClick={() => navigate("/analysis")}
          >
            Proceed to Analysis
          </button>
        </div>

        {/* Preview Table */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#111" }}>Preview (first 10 rows)</h3>

          {!rows.length ? (
            <p style={{ color: "#666" }}>Wala pang file. Upload muna.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#222" }}>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          borderBottom: "1px solid #eee",
                          fontSize: 13,
                          color: "#555",
                        }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx}>
                      {columns.map((c) => (
                        <td key={c} style={{ padding: "8px 10px", borderBottom: "1px solid #f2f2f2" }}>
                          {String(r[c] ?? "")}
                        </td>
                      ))}
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