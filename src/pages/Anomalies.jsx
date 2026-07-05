import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import TablePanel from "../components/tables/TablePanel";
import { formatSourceLabel } from "../utils/display";

export default function AnomaliesPage({ data }) {
  const {
    anomalies = [],
    anomalySummary,
    latestAnomaly,
    fetchDashboardData,
    engineStatus = {},
  } = data;

  const monitoringRunning = Boolean(engineStatus?.running);
  const hasActiveAnomaly = Boolean(latestAnomaly);

  return (
    <>
      <section className="page-title-panel">
        <p className="section-kicker">Anomaly Center</p>
        <h1>Anomaly Detection</h1>
        <p>Track current unusual behavior separately from historical occupancy spikes, crowd surges, and zone overloads.</p>
      </section>

      <section className="cards-grid">
        <StatCard label="Total Anomalies" value={anomalySummary?.total_anomalies ?? 0} variant="danger" />
        <StatCard label="Highest Score" value={`${anomalySummary?.highest_anomaly_score ?? 0}%`} variant="cyan" />
        <StatCard label="Latest Recorded Type" value={anomalySummary?.latest_anomaly_type ?? "Normal"} variant="cyan" />
        <StatCard label="Latest Recorded Zone" value={anomalySummary?.latest_anomaly_zone ?? "None"} />
      </section>

      <section className={`panel ${hasActiveAnomaly ? "anomaly-active" : "anomaly-normal"}`}>
        <SectionHead
          kicker="Current State"
          title={hasActiveAnomaly ? "Anomaly Detected" : "No Active Anomaly"}
          action={<button type="button" onClick={fetchDashboardData}>Refresh</button>}
        />

        <div className="summary-list">
          {hasActiveAnomaly ? (
            <>
              <p><span>Type</span><strong>{latestAnomaly?.anomaly_type || "Normal"}</strong></p>
              <p><span>Score</span><strong>{latestAnomaly?.anomaly_score ?? 0}%</strong></p>
              <p><span>Severity</span><strong>{latestAnomaly?.anomaly_severity || "Normal"}</strong></p>
              <p><span>Zone</span><strong>{latestAnomaly?.anomaly_zone || "None"}</strong></p>
              <p><span>Recommendation</span><strong>{latestAnomaly?.anomaly_recommendation || "Monitor"}</strong></p>
            </>
          ) : (
            <>
              <p><span>Monitoring</span><strong>{monitoringRunning ? "Running" : "Paused"}</strong></p>
              <p><span>Current Anomaly</span><strong>None</strong></p>
              <p><span>Last Recorded Type</span><strong>{anomalySummary?.latest_anomaly_type || "None"}</strong></p>
              <p><span>Last Recorded Zone</span><strong>{anomalySummary?.latest_anomaly_zone || "None"}</strong></p>
              <p><span>Last Recorded</span><strong>{anomalySummary?.latest_recorded_at || "No anomaly history"}</strong></p>
            </>
          )}
        </div>
      </section>

      <TablePanel title="Anomaly History" kicker="Recorded Anomalies" onRefresh={fetchDashboardData}>
        <table className="v44-anomaly-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Profile</th>
              <th>Type</th>
              <th>Score</th>
              <th>Severity</th>
              <th>Zone</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.slice().reverse().slice(0, 50).map((anomaly, index) => (
              <tr key={`${anomaly.timestamp}-${index}`}>
                <td>{anomaly.timestamp}</td>
                <td>{formatSourceLabel(anomaly.camera_profile)}</td>
                <td>{anomaly.anomaly_type}</td>
                <td>{anomaly.anomaly_score}%</td>
                <td><Badge value={anomaly.anomaly_severity} type={`severity-${anomaly.anomaly_severity}`} /></td>
                <td>{anomaly.anomaly_zone}</td>
                <td>{anomaly.anomaly_recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </>
  );
}