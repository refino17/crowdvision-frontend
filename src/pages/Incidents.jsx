import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import TablePanel from "../components/tables/TablePanel";
import { formatSourceLabel } from "../utils/display";

export default function IncidentsPage({ data }) {
  const { incidents, incidentSummary, latestIncident, fetchDashboardData } = data;
  return (
    <>
      <section className="page-title-panel">
        <p className="section-kicker">Incident Center</p>
        <h1>Incident Response</h1>
        <p>Monitor active incidents, response duration, danger zones, and recommended actions.</p>
      </section>

      <section className="cards-grid three-cards">
        <StatCard label="Incident Events" value={incidentSummary?.total_incident_events ?? 0} variant="warning" />
        <StatCard label="Longest Duration" value={`${incidentSummary?.longest_incident_duration ?? 0}s`} />
        <StatCard label="Latest Zone" value={incidentSummary?.latest_danger_zone ?? "None"} variant="cyan" />
      </section>

      <section className={`panel ${latestIncident ? "incident-active" : "incident-safe"}`}>
        <SectionHead kicker="Current Incident" title={latestIncident ? "Active Incident" : "No Active Incident"} action={<button type="button" onClick={fetchDashboardData}>Refresh</button>} />
        <div className="summary-list">
          <p><span>Danger Zone</span><strong>{latestIncident?.danger_zone || "None"}</strong></p>
          <p><span>Duration</span><strong>{latestIncident?.incident_duration ?? 0}s</strong></p>
          <p><span>Density</span><strong>{latestIncident?.density_level || "Normal"}</strong></p>
          <p><span>Recommendation</span><strong>{latestIncident?.recommendation || "Monitor"}</strong></p>
        </div>
      </section>

      <TablePanel title="Incident History" kicker="Incident Log" onRefresh={fetchDashboardData}>
        <table>
          <thead><tr><th>Time</th><th>Profile</th><th>People</th><th>Density</th><th>Duration</th><th>Danger Zone</th><th>Recommendation</th></tr></thead>
          <tbody>{incidents.slice().reverse().slice(0, 50).map((incident, index) => (
            <tr key={`${incident.timestamp}-${index}`}><td>{incident.timestamp}</td><td>{formatSourceLabel(incident.camera_profile)}</td><td>{incident.total_people}</td><td><Badge value={incident.density_level} /></td><td>{incident.incident_duration}s</td><td>{incident.danger_zone}</td><td>{incident.recommendation}</td></tr>
          ))}</tbody>
        </table>
      </TablePanel>
    </>
  );
}
