import { Link } from "react-router-dom";
import { compactSourceLabel } from "../utils/display";

const PAGE_LABELS = {
  dashboard: "Executive Command",
  monitoring: "Live Surveillance",
  sources: "Camera Sources",
  incidents: "Incident Response",
  anomalies: "Anomaly Intelligence",
  analytics: "Analytics Studio",
  reports: "Investigation Reports",
  evidence: "Evidence Vault",
  audit: "Audit Center",
  settings: "System Control",
  events: "Event Stream",
  exports: "Export Center",
};

function platformLabel(apiStatus) {
  return apiStatus === "online" ? "System Ready" : "Connection Lost";
}

function shortPlatformLabel(apiStatus) {
  return apiStatus === "online" ? "Ready" : "Offline";
}

function monitoringLabel(running) {
  return running ? "Monitoring Live" : "Monitoring Paused";
}

function shortMonitoringLabel(running) {
  return running ? "Live" : "Paused";
}

export default function Topbar({
  lastUpdated,
  apiStatus,
  engineStatus,
  pageKey = "dashboard",
  onOpenNavigation,
  navigationOpen = false,
}) {
  const pageLabel = PAGE_LABELS[pageKey] || "Command Center";
  const running = Boolean(engineStatus?.running);
  const sourceLabel = compactSourceLabel(
    engineStatus?.active_profile || "No Source",
    24
  );
  const mobileSourceLabel = compactSourceLabel(
    engineStatus?.active_profile || "No Source",
    18
  );

  return (
    <header className="topbar command-topbar">
      <div className="topbar-leading">
        <button
          type="button"
          className="mobile-nav-trigger"
          aria-label="Open navigation"
          aria-controls="crowdvision-navigation"
          aria-expanded={navigationOpen}
          onClick={onOpenNavigation}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <div className="mobile-command-copy" aria-label={`${pageLabel} page`}>
          <span>CrowdVision AI</span>
          <strong>{pageLabel}</strong>
        </div>

        <div className="topbar-title command-title-block">
          <p className="section-kicker">CrowdVision AI Platform</p>
          <h1>Real-Time Crowd Safety Intelligence</h1>
          <span className="topbar-context">{pageLabel}</span>
        </div>
      </div>

      <div
        className="topbar-actions command-status-rack"
        aria-label="Platform status summary"
      >
        <div
          className={`command-chip ${
            apiStatus === "online" ? "ready" : "offline"
          }`}
          title={`Connection: ${apiStatus || "checking"}`}
        >
          <span className="status-dot" />
          {platformLabel(apiStatus)}
        </div>

        <div
          className={`command-chip ${running ? "live" : "paused"}`}
          title={
            running
              ? "Monitoring engine is running"
              : "Monitoring engine is paused"
          }
        >
          <span className="status-dot" />
          {monitoringLabel(running)}
        </div>

        <div
          className="command-chip source-chip"
          title={engineStatus?.active_profile || sourceLabel}
        >
          <span className="chip-label">Source</span>
          {sourceLabel}
        </div>

        <Link
          to="/"
          className="theme-orb command-orb"
          aria-label="Open CrowdVision launch screen"
        />

        <div className="command-time" title="Last dashboard refresh time">
          <span>Last Sync</span>
          <strong>{lastUpdated || "Waiting"}</strong>
        </div>
      </div>

      <div className="mobile-status-strip" aria-label="Mobile platform status summary">
        <span className={`mobile-status-pill ${apiStatus === "online" ? "ready" : "offline"}`}>
          <i aria-hidden="true" />
          {shortPlatformLabel(apiStatus)}
        </span>

        <span className={`mobile-status-pill ${running ? "live" : "paused"}`}>
          <i aria-hidden="true" />
          {shortMonitoringLabel(running)}
        </span>

        <span className="mobile-status-pill source" title={engineStatus?.active_profile || mobileSourceLabel}>
          Source: <strong>{mobileSourceLabel}</strong>
        </span>

        <span className="mobile-status-pill sync">
          Sync: <strong>{lastUpdated || "Waiting"}</strong>
        </span>
      </div>
    </header>
  );
}