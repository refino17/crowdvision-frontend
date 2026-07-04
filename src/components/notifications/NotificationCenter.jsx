import Badge from "../common/Badge";
import SectionHead from "../common/SectionHead";

function normalizeSeverity(value) {
  const severity = String(value || "normal").toLowerCase();
  if (["critical", "high", "medium", "warning", "normal", "info"].includes(severity)) {
    return severity;
  }
  return "normal";
}

function formatMeta(note) {
  const source = note?.source || note?.camera_profile || "CrowdVision AI";
  const category = note?.category || note?.type || "system";
  return `${String(category).replaceAll("_", " ")} • ${source}`;
}

export default function NotificationCenter({ notifications }) {
  const items = Array.isArray(notifications) ? notifications : [];
  const criticalCount = items.filter((item) => ["critical", "high"].includes(normalizeSeverity(item.severity))).length;

  return (
    <section className="panel notification-panel enterprise-notification-center">
      <SectionHead
        kicker="Live Notifications"
        title="Notification Center"
        badge={
          <Badge
            value={items.length ? `${criticalCount || items.length} Alerts` : "Quiet"}
            type={items.length ? "critical" : "running"}
          />
        }
      />

      <div className="notification-list">
        {items.length === 0 && (
          <div className="notification-item normal">
            <div>
              <strong>No active notifications</strong>
              <p>System is currently quiet. CrowdVision will surface incidents, camera tamper alerts, and anomaly warnings here.</p>
            </div>
            <span>Ready</span>
          </div>
        )}

        {items.slice(0, 8).map((note, index) => {
          const severity = normalizeSeverity(note.severity);

          return (
            <div
              className={`notification-item ${severity}`}
              key={note.id || `${note.title}-${note.time}-${index}`}
            >
              <div>
                <div className="notification-title-row">
                  <strong>{note.title || "CrowdVision Alert"}</strong>
                  <em>{formatMeta(note)}</em>
                </div>
                <p>{note.message || "No extra detail supplied."}</p>
                {note.action && note.action !== "Monitor" && (
                  <small>Action: {note.action}</small>
                )}
              </div>
              <span>{note.time || "Now"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}