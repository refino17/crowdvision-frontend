import { useEffect, useMemo, useState } from "react";
import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import { API_BASE_URL } from "../config/constants";

const CATEGORY_LABELS = {
  all: "All Categories",
  engine: "Engine",
  camera_source: "Camera Source",
  camera_network: "Camera Network",
  security: "Security",
  telegram: "Telegram",
  reports: "Reports",
  system: "System",
};

const STATUS_LABELS = {
  all: "All Statuses",
  Info: "Info",
  Started: "Started",
  Stopped: "Stopped",
  Updated: "Updated",
  Created: "Created",
  Deleted: "Deleted",
  Connected: "Connected",
  Disconnected: "Disconnected",
  Sent: "Sent",
  Failed: "Failed",
  Rejected: "Rejected",
  Viewed: "Viewed",
};

function prettyCategory(value) {
  return CATEGORY_LABELS[value] || String(value || "System").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(status, severity) {
  const statusText = String(status || "").toLowerCase();
  const severityText = String(severity || "").toLowerCase();

  if (["rejected", "failed", "blocked"].includes(statusText) || ["critical", "danger"].includes(severityText)) {
    return "critical";
  }

  if (["warning", "high"].includes(severityText)) {
    return "warning";
  }

  if (["started", "connected", "created", "sent", "updated", "viewed"].includes(statusText)) {
    return "running";
  }

  return "normal";
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [security, setSecurity] = useState(null);
  const [telegram, setTelegram] = useState(null);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function fetchAuditData(nextCategory = category, nextStatus = status) {
    try {
      setLoading(true);
      setMessage("");

      const [logsRes, securityRes, telegramRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/audit/logs?limit=250&category=${encodeURIComponent(nextCategory)}&status=${encodeURIComponent(nextStatus)}`),
        fetch(`${API_BASE_URL}/api/security/status`),
        fetch(`${API_BASE_URL}/api/telegram/status`),
      ]);

      if (!logsRes.ok) throw new Error(`Audit request failed: ${logsRes.status}`);

      const logsData = await logsRes.json();
      const securityData = securityRes.ok ? await securityRes.json() : null;
      const telegramData = telegramRes.ok ? await telegramRes.json() : null;

      setLogs(logsData.logs || []);
      setSummary(logsData.summary || null);
      setSecurity(securityData || null);
      setTelegram(telegramData || securityData?.telegram || null);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load audit information.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTelegramTest() {
    try {
      setMessage("Sending Telegram test alert...");
      const response = await fetch(`${API_BASE_URL}/api/telegram/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "CrowdVision Telegram Test",
          message: "Telegram alert delivery has been verified from the Audit Center.",
          severity: "warning",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.message || `Telegram test failed: ${response.status}`);

      setMessage("Telegram test alert sent successfully.");
      fetchAuditData();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to send Telegram test alert.");
      fetchAuditData();
    }
  }

  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(() => fetchAuditData(), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateCategory(value) {
    setCategory(value);
    fetchAuditData(value, status);
  }

  function updateStatus(value) {
    setStatus(value);
    fetchAuditData(category, value);
  }

  const categoryOptions = useMemo(() => {
    const dynamic = new Set(["all", "engine", "camera_source", "camera_network", "security", "telegram", "reports", "system"]);
    logs.forEach((item) => dynamic.add(item.category));
    return Array.from(dynamic).filter(Boolean);
  }, [logs]);

  const statusOptions = useMemo(() => {
    const dynamic = new Set(["all", "Info", "Started", "Stopped", "Updated", "Created", "Deleted", "Connected", "Disconnected", "Sent", "Failed", "Rejected", "Viewed"]);
    logs.forEach((item) => dynamic.add(item.status));
    return Array.from(dynamic).filter(Boolean);
  }, [logs]);

  const totalRecords = safeNumber(summary?.total_records || logs.length);
  const warningCount = safeNumber(summary?.warnings);
  const rejectionCount = safeNumber(summary?.rejections);
  const latestAction = summary?.latest_action || "None";

  return (
    <>
      <section className="page-title-panel audit-hero-panel">
        <p className="section-kicker">Security Governance</p>
        <h1>Audit Center</h1>
        <p>Track operator actions, security events, remote camera access, Telegram alert delivery, and system changes from one professional activity log.</p>
      </section>

      <section className="cards-grid audit-summary-grid">
        <div className="card"><span>Audit Records</span><strong>{totalRecords}</strong></div>
        <div className="card warning"><span>Warnings</span><strong>{warningCount}</strong></div>
        <div className="card danger"><span>Rejected / Failed</span><strong>{rejectionCount}</strong></div>
        <div className="card"><span>Latest Action</span><strong>{latestAction}</strong></div>
      </section>

      <section className="audit-security-grid">
        <article className="panel audit-security-card">
          <SectionHead
            kicker="Remote Camera Security"
            title="Access Key Protection"
            badge={<Badge value={security?.edge_api_key_enabled ? "Protected" : "Demo Mode"} type={security?.edge_api_key_enabled ? "running" : "warning"} />}
          />
          <div className="audit-detail-list">
            <p><span>Remote Camera Key</span><strong>{security?.edge_api_key_enabled ? "Enabled" : "Not configured"}</strong></p>
            <p><span>Header</span><strong>{security?.edge_security_header || "X-CrowdVision-Edge-Key"}</strong></p>
            <p><span>Stored Value</span><strong>{security?.edge_api_key || "Not configured"}</strong></p>
            <p><span>Storage Mode</span><strong>{security?.storage_mode || "File-based now"}</strong></p>
          </div>
          <div className="audit-note-box">
            {security?.edge_api_key_enabled
              ? "Remote camera workers must send the correct security key before telemetry or previews are accepted."
              : "Remote camera security is currently in demo mode. Add CROWDVISION_EDGE_API_KEY to .env to protect remote camera access."}
          </div>
        </article>

        <article className="panel audit-security-card">
          <SectionHead
            kicker="Telegram Alerts"
            title="Notification Delivery"
            badge={<Badge value={telegram?.configured ? "Configured" : "Not Configured"} type={telegram?.configured ? "running" : "stopped"} />}
          />
          <div className="audit-detail-list">
            <p><span>Alerts</span><strong>{telegram?.enabled ? "Enabled" : "Disabled"}</strong></p>
            <p><span>Bot Token</span><strong>{telegram?.bot_token || "Not configured"}</strong></p>
            <p><span>Chat ID</span><strong>{telegram?.chat_id || "Not configured"}</strong></p>
            <p><span>Minimum Severity</span><strong>{telegram?.min_severity || "warning"}</strong></p>
          </div>
          <div className="audit-actions-row">
            <button type="button" onClick={sendTelegramTest} disabled={!telegram?.configured}>Send Test Alert</button>
            <button type="button" className="btn-secondary" onClick={() => fetchAuditData()}>Refresh Audit</button>
          </div>
          {!telegram?.configured && <div className="audit-note-box warning">Set TELEGRAM_ALERTS_ENABLED, TELEGRAM_BOT_TOKEN, and TELEGRAM_CHAT_ID inside your .env file before sending alerts.</div>}
        </article>
      </section>

      <section className="panel audit-log-panel">
        <SectionHead
          kicker="Operator Activity"
          title="Security Audit Log"
          badge={<Badge value={loading ? "Loading" : `${logs.length} Records`} type="running" />}
        />

        <div className="audit-filter-bar">
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => updateCategory(event.target.value)}>
              {categoryOptions.map((option) => <option key={option} value={option}>{prettyCategory(option)}</option>)}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => updateStatus(event.target.value)}>
              {statusOptions.map((option) => <option key={option} value={option}>{STATUS_LABELS[option] || option}</option>)}
            </select>
          </label>

          <button type="button" className="btn-secondary" onClick={() => fetchAuditData()}>Refresh</button>
        </div>

        {message && <div className="audit-message">{message}</div>}

        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Category</th>
                <th>Source</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan="7" className="audit-empty">No audit records found for this filter.</td>
                </tr>
              )}

              {logs.map((item) => (
                <tr key={item.id}>
                  <td>{item.time}</td>
                  <td>{item.actor}</td>
                  <td><strong>{item.action}</strong></td>
                  <td>{prettyCategory(item.category)}</td>
                  <td>{item.source}</td>
                  <td><Badge value={item.status} type={statusTone(item.status, item.severity)} /></td>
                  <td>{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}