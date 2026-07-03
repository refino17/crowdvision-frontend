import Badge from "../components/common/Badge";
import TablePanel from "../components/tables/TablePanel";
import { formatSourceLabel } from "../utils/display";

export default function EventsPage({ data }) {
  const { events, fetchDashboardData } = data;
  return (
    <TablePanel title="Recent Crowd Events" kicker="Event Stream" onRefresh={fetchDashboardData}>
      <table>
        <thead><tr><th>Time</th><th>Profile</th><th>People</th><th>Zone</th><th>Occupancy</th><th>Pred People</th><th>Pred Occupancy</th><th>Anomaly</th><th>Score</th><th>Density</th><th>Alert</th></tr></thead>
        <tbody>{events.slice().reverse().slice(0, 50).map((event, index) => (
          <tr key={`${event.timestamp}-${index}`}><td>{event.timestamp}</td><td>{formatSourceLabel(event.camera_profile)}</td><td>{event.total_people}</td><td>{event.zone_count}</td><td>{event.occupancy}</td><td>{event.predicted_people ?? 0}</td><td>{event.predicted_occupancy ?? 0}</td><td>{event.anomaly_type || "Normal"}</td><td>{event.anomaly_score ?? 0}%</td><td><Badge value={event.density_level} /></td><td>{event.alert_message}</td></tr>
        ))}</tbody>
      </table>
    </TablePanel>
  );
}
