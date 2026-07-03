import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { compactSourceLabel } from "../utils/display";

function StatusItem({ label, value, tone = "neutral" }) {
  return (
    <div className={`launch-status-item ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function LaunchPage({ data }) {
  const running = Boolean(data?.engineStatus?.running);
  const source = compactSourceLabel(data?.engineStatus?.active_profile || data?.activeCameraProfile || "No Source", 28);
  const totalEvents = data?.summary?.total_events ?? "—";
  const criticalAlerts = data?.summary?.critical_alerts ?? "—";
  const peakPeople = data?.summary?.peak_people ?? "—";

  return (
    <main className="launch-page">
      <section className="launch-hero">
        <img src={heroImage} alt="CrowdVision AI security command center" className="launch-hero-image" />
        <div className="launch-shade" />

        <div className="launch-content">
          <div className="launch-brand-row">
            <div className="launch-logo">CV</div>
            <div>
              <span>CrowdVision AI Platform</span>
              <strong>Security Command Intelligence</strong>
            </div>
          </div>

          <p className="launch-kicker">Enterprise Crowd Safety System</p>
          <h1>Real-Time Crowd Safety Intelligence</h1>
          <p className="launch-copy">
            Monitor live camera sources, detect density risks, capture evidence snapshots,
            and generate operational reports from one premium command center.
          </p>

          <div className="launch-actions">
            <Link to="/dashboard" className="launch-primary">Enter Command Center</Link>
            <Link to="/monitoring" className="launch-secondary">Open Live Monitoring</Link>
          </div>

          <div className="launch-status-grid" aria-label="CrowdVision system summary">
            <StatusItem label="System" value={data?.apiStatus === "online" ? "Ready" : "Checking"} tone="success" />
            <StatusItem label="Monitoring" value={running ? "Live" : "Paused"} tone={running ? "success" : "warning"} />
            <StatusItem label="Source" value={source} />
            <StatusItem label="Last Sync" value={data?.lastUpdated || "Waiting"} />
          </div>
        </div>

        <div className="launch-metric-strip">
          <div><span>Total Events</span><strong>{totalEvents}</strong></div>
          <div><span>Peak People</span><strong>{peakPeople}</strong></div>
          <div><span>Critical Alerts</span><strong>{criticalAlerts}</strong></div>
        </div>
      </section>
    </main>
  );
}
