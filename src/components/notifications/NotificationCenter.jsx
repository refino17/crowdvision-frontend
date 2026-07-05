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

function NotificationItem({ note, index }) {
  const severity = normalizeSeverity(note?.severity);

  return (
    <div
      className={`notification-item ${severity}`}
      key={note?.id || `${note?.title}-${note?.time}-${index}`}
    >
      <div>
        <div className="notification-title-row">
          <strong>{note?.title || "CrowdVision Alert"}</strong>
          <em>{formatMeta(note)}</em>
        </div>
        <p>{note?.message || "No extra detail supplied."}</p>
        {note?.action && note.action !== "Monitor" && (
          <small>Action: {note.action}</small>
        )}
      </div>
      <span>{note?.time || "Now"}</span>
    </div>
  );
}

export default function NotificationCenter({ notifications }) {
  const items = Array.isArray(notifications) ? notifications : [];
  const activeItems = items.filter((item) => item?.is_active === true);
  const recentItems = items.filter((item) => item?.is_active !== true).slice(0, 4);

  return (
    <section className="panel notification-panel enterprise-notification-center v44-notification-center">
      <SectionHead
        kicker="Operational Awareness"
        title="Alerts & Recent Activity"
        badge={
          <Badge
            value={activeItems.length ? `${activeItems.length} Active` : "No Active Alerts"}
            type={activeItems.length ? "critical" : "running"}
          />
        }
      />

      <div className="v44-notification-columns">
        <section className="v44-notification-group active-group">
          <div className="v44-notification-group-head">
            <span>Active Alerts</span>
            <strong>{activeItems.length}</strong>
          </div>

          <div className="notification-list compact-list">
            {activeItems.length === 0 ? (
              <div className="notification-item normal quiet-state">
                <div>
                  <strong>No active alerts</strong>
                  <p>There is no current incident, anomaly, camera fault, or high-risk crowd condition.</p>
                </div>
                <span>Live</span>
              </div>
            ) : (
              activeItems.map((note, index) => (
                <NotificationItem note={note} index={index} key={note.id || index} />
              ))
            )}
          </div>
        </section>

        <section className="v44-notification-group recent-group">
          <div className="v44-notification-group-head">
            <span>Recent Activity</span>
            <strong>{recentItems.length}</strong>
          </div>

          <div className="notification-list compact-list">
            {recentItems.length === 0 ? (
              <div className="notification-item normal quiet-state">
                <div>
                  <strong>No recent activity</strong>
                  <p>New monitoring, camera, and safety events will appear here.</p>
                </div>
                <span>History</span>
              </div>
            ) : (
              recentItems.map((note, index) => (
                <NotificationItem note={note} index={index} key={note.id || index} />
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}