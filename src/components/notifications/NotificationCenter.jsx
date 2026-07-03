import Badge from "../common/Badge";
import SectionHead from "../common/SectionHead";

export default function NotificationCenter({ notifications }) {
  return (
    <section className="panel notification-panel">
      <SectionHead
        kicker="Live Notifications"
        title="Notification Center"
        badge={<Badge value={`${notifications?.length || 0} Alerts`} type={notifications?.length ? "critical" : "running"} />}
      />

      <div className="notification-list">
        {(notifications || []).length === 0 && (
          <div className="notification-item normal">
            <strong>No active notifications</strong>
            <p>System is currently quiet.</p>
          </div>
        )}

        {(notifications || []).map((note, index) => (
          <div className={`notification-item ${note.severity || "normal"}`} key={`${note.title}-${index}`}>
            <div>
              <strong>{note.title}</strong>
              <p>{note.message}</p>
            </div>
            <span>{note.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
