import { useEffect, useState } from "react";
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
  audit: "Audit Center",
  settings: "System Control",
  events: "Event Stream",
  exports: "Export Center",
};

const SIDEBAR_PREFERENCE_KEY = "crowdvision.sidebar.collapsed.v45";
const MOBILE_NAV_QUERY = "(max-width: 900px)";
const COMPACT_DESKTOP_QUERY = "(min-width: 901px) and (max-width: 1240px)";

function getPageKey(pathname) {
  const clean = pathname.replace(/^\//, "") || "dashboard";
  return clean.split("/")[0] || "dashboard";
}

function readInitialSidebarPreference() {
  if (typeof window === "undefined") return false;

  try {
    const saved = window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY);

    if (saved === "true") return true;
    if (saved === "false") return false;
  } catch (error) {
    console.warn("Unable to read the saved navigation preference.", error);
  }

  return window.matchMedia(COMPACT_DESKTOP_QUERY).matches;
}

function readInitialMobileState() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_NAV_QUERY).matches;
}

export default function MainLayout({
  apiStatus,
  engineStatus,
  lastUpdated,
  children,
}) {
  const location = useLocation();
  const pageKey = getPageKey(location.pathname);
  const pageTitle = PAGE_TITLES[pageKey] || "Command Center";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    readInitialSidebarPreference
  );
  const [mobileNavigation, setMobileNavigation] = useState(
    readInitialMobileState
  );
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    document.title = `CrowdVision AI | ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAV_QUERY);

    function handleViewportChange(event) {
      setMobileNavigation(event.matches);

      if (!event.matches) {
        setMobileNavigationOpen(false);
      }
    }

    handleViewportChange(mediaQuery);
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (mobileNavigation) return;

    try {
      window.localStorage.setItem(
        SIDEBAR_PREFERENCE_KEY,
        String(sidebarCollapsed)
      );
    } catch (error) {
      console.warn("Unable to save the navigation preference.", error);
    }
  }, [sidebarCollapsed, mobileNavigation]);

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavigationOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileNavigationOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavigationOpen]);

  function toggleSidebar() {
    if (mobileNavigation) {
      setMobileNavigationOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
  }

  function closeMobileNavigation() {
    setMobileNavigationOpen(false);
  }

  const shellClasses = [
    "app-shell",
    `page-${pageKey}`,
    sidebarCollapsed ? "nav-collapsed" : "nav-expanded",
    mobileNavigation ? "nav-mobile" : "nav-desktop",
    mobileNavigationOpen ? "nav-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClasses}>
      <button
        type="button"
        className="navigation-backdrop"
        aria-label="Close navigation"
        aria-hidden={!mobileNavigationOpen}
        tabIndex={mobileNavigationOpen ? 0 : -1}
        onClick={closeMobileNavigation}
      />

      <Sidebar
        apiStatus={apiStatus}
        engineStatus={engineStatus}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileNavigationOpen}
        isMobile={mobileNavigation}
        onToggleCollapse={toggleSidebar}
        onClose={closeMobileNavigation}
        onNavigate={closeMobileNavigation}
      />

      <div className="main-shell">
        <Topbar
          apiStatus={apiStatus}
          engineStatus={engineStatus}
          lastUpdated={lastUpdated}
          pageKey={pageKey}
          onOpenNavigation={() => setMobileNavigationOpen(true)}
          navigationOpen={mobileNavigationOpen}
        />

        <main className="dashboard">{children}</main>
      </div>
    </div>
  );
}