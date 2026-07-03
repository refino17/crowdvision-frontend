import { NavLink } from "react-router-dom";
import { compactSourceLabel } from "../utils/display";

const navSections = [
  {
    label: "Command",
    items: [
      ["/dashboard", "Dashboard", "⌂"],
      ["/monitoring", "Monitoring", "●"],
    ],
  },
  {
    label: "Operations",
    items: [
      ["/sources", "Sources", "▣"],
      ["/incidents", "Incidents", "△"],
      ["/anomalies", "Anomalies", "◇"],
    ],
  },
  {
    label: "Intelligence",
    items: [
      ["/analytics", "Analytics", "▥"],
      ["/reports", "Reports", "▤"],
      ["/evidence", "Evidence", "▧"],
    ],
  },
  {
    label: "System",
    items: [["/settings", "Settings", "⚙"]],
  },
];

export default function Sidebar({ apiStatus, engineStatus }) {
  const running = Boolean(engineStatus?.running);
  const source = compactSourceLabel(engineStatus?.active_profile || "No Source", 24);

  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand-block" aria-label="CrowdVision AI launch page">
        <div className="brand-mark">CV</div>
        <div>
          <h2>CrowdVision AI</h2>
          <p>Security Command</p>
        </div>
      </NavLink>

      <nav className="side-nav" aria-label="Main navigation">
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <span className="nav-section-label">{section.label}</span>
            {section.items.map(([to, label, icon]) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="nav-icon">{icon}</span>
                <strong>{label}</strong>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-status command-sidebar-status" aria-label="Operational summary">
        <p><span>Platform</span><strong className={apiStatus === "online" ? "ok" : "bad"}>{apiStatus === "online" ? "Ready" : "Offline"}</strong></p>
        <p><span>Monitoring</span><strong className={running ? "ok" : "bad"}>{running ? "Live" : "Paused"}</strong></p>
        <p><span>Source</span><strong title={engineStatus?.active_profile || source}>{source}</strong></p>
      </div>
    </aside>
  );
}
