import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import TablePanel from "../components/tables/TablePanel";
import { API_BASE_URL } from "../config/constants";
import { formatSourceLabel } from "../utils/display";

const PAGE_SIZE = 25;

export default function IncidentsPage({ data }) {
  const {
    incidentSummary,
    latestIncident,
    fetchDashboardData,
    engineStatus = {},
    cameraProfiles = [],
  } = data;

  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [densityFilter, setDensityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monitoringRunning = Boolean(engineStatus?.running);
  const hasActiveIncident = Boolean(latestIncident);

  async function fetchIncidentHistory(targetPage = page) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(targetPage),
        page_size: String(PAGE_SIZE),
        density: densityFilter,
        source: sourceFilter,
      });

      const response = await fetch(`${API_BASE_URL}/api/incidents?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`Incident history request failed: ${response.status}`);

      const payload = await response.json();
      setHistory(Array.isArray(payload?.incidents) ? payload.incidents : []);
      setPage(Number(payload?.pagination?.page || targetPage));
      setPages(Number(payload?.pagination?.pages || 1));
      setTotal(Number(payload?.pagination?.total || 0));
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to load incident history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncidentHistory(1);
  }, [densityFilter, sourceFilter]);

  async function refreshAll() {
    await Promise.all([
      fetchDashboardData?.(),
      fetchIncidentHistory(page),
    ]);
  }

  return (
    <>
      <section className="page-title-panel">
        <p className="section-kicker">Incident Center</p>
        <h1>Incident Response</h1>
        <p>Separate current incidents from historical records, review response duration, danger zones, and recommended actions.</p>
      </section>

      <section className="cards-grid three-cards">
        <StatCard label="Incident Events" value={incidentSummary?.total_incident_events ?? 0} variant="warning" />
        <StatCard label="Longest Duration" value={`${incidentSummary?.longest_incident_duration ?? 0}s`} />
        <StatCard label="Latest Recorded Zone" value={incidentSummary?.latest_danger_zone ?? "None"} variant="cyan" />
      </section>

      <section className={`panel ${hasActiveIncident ? "incident-active" : "incident-safe"}`}>
        <SectionHead
          kicker="Current State"
          title={hasActiveIncident ? "Active Incident" : "No Active Incident"}
          action={<button type="button" onClick={refreshAll}>Refresh</button>}
        />

        <div className="summary-list">
          {hasActiveIncident ? (
            <>
              <p><span>Danger Zone</span><strong>{latestIncident?.danger_zone || "None"}</strong></p>
              <p><span>Duration</span><strong>{latestIncident?.incident_duration ?? 0}s</strong></p>
              <p><span>Density</span><strong>{latestIncident?.density_level || "Normal"}</strong></p>
              <p><span>Recommendation</span><strong>{latestIncident?.recommendation || "Monitor"}</strong></p>
            </>
          ) : (
            <>
              <p><span>Monitoring</span><strong>{monitoringRunning ? "Running" : "Paused"}</strong></p>
              <p><span>Current Incident</span><strong>None</strong></p>
              <p><span>Last Recorded Zone</span><strong>{incidentSummary?.latest_danger_zone || "None"}</strong></p>
              <p><span>Last Recorded</span><strong>{incidentSummary?.latest_recorded_at || "No incident history"}</strong></p>
            </>
          )}
        </div>
      </section>

      <section className="panel v44-history-controls">
        <div>
          <p className="section-kicker">History Controls</p>
          <h2>Incident Record Filters</h2>
          <span>{total} matching records · {PAGE_SIZE} per page</span>
        </div>

        <div className="v44-history-filter-row">
          <label>
            <span>Risk Level</span>
            <select value={densityFilter} onChange={(event) => setDensityFilter(event.target.value)}>
              <option value="all">All Risk Levels</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </label>

          <label>
            <span>Camera Source</span>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="all">All Sources</option>
              {(cameraProfiles || []).map((profile) => (
                <option value={profile.key} key={profile.key}>{profile.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <TablePanel title="Incident History" kicker="Incident Log" onRefresh={refreshAll}>
        {error && <div className="v44-table-message error">{error}</div>}
        {loading ? (
          <div className="v44-table-message">Loading incident records...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Profile</th>
                <th>People</th>
                <th>Density</th>
                <th>Duration</th>
                <th>Danger Zone</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {history.map((incident, index) => (
                <tr key={`${incident.timestamp}-${index}`}>
                  <td>{incident.timestamp}</td>
                  <td>{formatSourceLabel(incident.camera_profile)}</td>
                  <td>{incident.total_people}</td>
                  <td><Badge value={incident.density_level} /></td>
                  <td>{incident.incident_duration}s</td>
                  <td>{incident.danger_zone}</td>
                  <td>{incident.recommendation}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="7">No incident records match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="v44-pagination">
          <button type="button" onClick={() => fetchIncidentHistory(page - 1)} disabled={page <= 1 || loading}>
            Previous
          </button>
          <span>Page <strong>{page}</strong> of <strong>{pages}</strong></span>
          <button type="button" onClick={() => fetchIncidentHistory(page + 1)} disabled={page >= pages || loading}>
            Next
          </button>
        </div>
      </TablePanel>
    </>
  );
}