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
    items: [["/audit", "Audit Center", "◎"], ["/settings", "Settings", "⚙"]],
  },
];

function platformLabel(apiStatus) {
  return apiStatus === "online" ? "Ready" : "Offline";
}

export default function Sidebar({
  apiStatus,
  engineStatus,
  collapsed = false,
  mobileOpen = false,
  isMobile = false,
  onToggleCollapse,
  onClose,
  onNavigate,
}) {
  const running = Boolean(engineStatus?.running);
  const source = compactSourceLabel(
    engineStatus?.active_profile || "No Source",
    24
  );

  const compactMode = Boolean(collapsed && !isMobile);

  return (
    <aside
      id="crowdvision-navigation"
      className={`sidebar adaptive-sidebar ${
        compactMode ? "is-collapsed" : "is-expanded"
      } ${mobileOpen ? "is-mobile-open" : ""}`}
      aria-label="CrowdVision primary navigation"
    >
      <div className="sidebar-top-row">
        <NavLink
          to="/"
          className="brand-block adaptive-brand"
          aria-label="CrowdVision AI launch page"
          title={compactMode ? "CrowdVision AI" : undefined}
          onClick={onNavigate}
        >
          <div className="brand-mark">CV</div>

          <div className="brand-copy">
            <span className="brand-kicker">CrowdVision AI Platform</span>
            <h2>CrowdVision AI</h2>
            <p>Security Command</p>
          </div>
        </NavLink>

        <button
          type="button"
          className="sidebar-mobile-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="mobile-drawer-status" aria-label="Mobile command status">
        <div>
          <span>Platform</span>
          <strong className={apiStatus === "online" ? "ok" : "bad"}>
            {platformLabel(apiStatus)}
          </strong>
        </div>
        <div>
          <span>Monitoring</span>
          <strong className={running ? "ok" : "bad"}>
            {running ? "Live" : "Paused"}
          </strong>
        </div>
        <div>
          <span>Source</span>
          <strong title={engineStatus?.active_profile || source}>{source}</strong>
        </div>
      </div>

      <nav className="side-nav adaptive-side-nav" aria-label="Main navigation">
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <span className="nav-section-label">{section.label}</span>

            {section.items.map(([to, label, icon]) => (
              <NavLink
                key={to}
                to={to}
                title={compactMode ? label : undefined}
                aria-label={label}
                data-tooltip={label}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
                onClick={onNavigate}
              >
                <span className="nav-icon" aria-hidden="true">
                  {icon}
                </span>
                <strong>{label}</strong>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div
        className="sidebar-status command-sidebar-status"
        aria-label="Operational summary"
      >
        <p>
          <span>Platform</span>
          <strong className={apiStatus === "online" ? "ok" : "bad"}>
            {platformLabel(apiStatus)}
          </strong>
        </p>

        <p>
          <span>Monitoring</span>
          <strong className={running ? "ok" : "bad"}>
            {running ? "Live" : "Paused"}
          </strong>
        </p>

        <p>
          <span>Source</span>
          <strong title={engineStatus?.active_profile || source}>{source}</strong>
        </p>
      </div>

      <div
        className="sidebar-rail-status"
        aria-label="Compact operational summary"
      >
        <span
          className={`rail-status-dot ${
            apiStatus === "online" ? "is-ready" : "is-offline"
          }`}
          title={`Platform: ${platformLabel(apiStatus)}`}
        />
        <span
          className={`rail-status-dot ${running ? "is-live" : "is-paused"}`}
          title={`Monitoring: ${running ? "Live" : "Paused"}`}
        />
        <span
          className="rail-status-source"
          title={`Source: ${engineStatus?.active_profile || source}`}
        >
          S
        </span>
      </div>

      <button
        type="button"
        className="sidebar-collapse-toggle"
        aria-label={compactMode ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!compactMode}
        onClick={onToggleCollapse}
      >
        <span aria-hidden="true">{compactMode ? "›" : "‹"}</span>
      </button>
    </aside>
  );
}