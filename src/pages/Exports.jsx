import SectionHead from "../components/common/SectionHead";
import { API_BASE_URL } from "../config/constants";

export default function ExportsPanel() {
  return (
    <section className="panel">
      <SectionHead kicker="Data Export" title="Export Analytics" />
      <div className="export-grid">
        {["events", "incidents", "anomalies", "summary"].map((item) => (
          <div className="export-card" key={item}>
            <h3>{item.charAt(0).toUpperCase() + item.slice(1)}</h3>
            <p>Download {item} data for analysis, reporting, or client review.</p>
            <div className="export-actions">
              <a href={`${API_BASE_URL}/api/export/${item}/csv`} target="_blank" rel="noreferrer">CSV</a>
              <a href={`${API_BASE_URL}/api/export/${item}/excel`} target="_blank" rel="noreferrer" className="excel-link">Excel</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
