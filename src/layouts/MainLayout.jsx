import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const PAGE_TITLES = {
  dashboard: "Executive Command",
  monitoring: "Live Surveillance",
  sources: "Camera Sources",
  incidents: "Incident Response",
  anomalies: "Anomaly Intelligence",
  analytics: "Analytics Studio",
  reports: "Investigation Reports",
  evidence: "Evidence Vault",
  settings: "System Control",
  events: "Event Stream",
  exports: "Export Center",
};

function getPageKey(pathname) {
  const clean = pathname.replace(/^\//, "") || "dashboard";
  return clean.split("/")[0] || "dashboard";
}

export default function MainLayout({ apiStatus, engineStatus, lastUpdated, children }) {
  const location = useLocation();
  const pageKey = getPageKey(location.pathname);
  const pageTitle = PAGE_TITLES[pageKey] || "Command Center";

  useEffect(() => {
    document.title = `CrowdVision AI | ${pageTitle}`;
  }, [pageTitle]);

  return (
    <div className={`app-shell page-${pageKey}`}>
      <Sidebar apiStatus={apiStatus} engineStatus={engineStatus} />
      <div className="main-shell">
        <Topbar
          apiStatus={apiStatus}
          engineStatus={engineStatus}
          lastUpdated={lastUpdated}
          pageKey={pageKey}
        />
        <main className="dashboard">
          {children}
        </main>
      </div>
    </div>
  );
}
