import StatCard from "../components/common/StatCard";
import SectionHead from "../components/common/SectionHead";
import NotificationCenter from "../components/notifications/NotificationCenter";
import ChartPanel from "../components/charts/ChartPanel";
import LinePanel from "../components/charts/LinePanel";
import { VIDEO_STREAM_URL } from "../config/constants";
import { formatSourceLabel } from "../utils/display";

export default function DashboardPage({ data }) {
  const {
    summary,
    intelligence,
    prediction,
    latestEvent,
    latestIncident,
    latestAnomaly,
    anomalySummary,
    incidentSummary,
    alertDistribution,
    chartData,
    fetchDashboardData,
  } = data;

  const latestDensity = latestEvent?.density_level || "Unknown";
  const hasActiveIncident = Boolean(latestIncident);
  const hasAnomaly = Boolean(latestAnomaly);
  const riskTrend = prediction?.risk_trend || "Stable";
  const anomalySeverity = latestAnomaly?.anomaly_severity || "Normal";

  return (
    <>
      <section className="hero-panel compact-hero">
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h1>Command Dashboard</h1>
          <p className="subtitle">A focused overview of live crowd status, alerts, incidents, predictions, and risk intelligence.</p>
        </div>
      </section>

      <NotificationCenter notifications={data.notifications} />

      <section className="cards-grid">
        <StatCard label="Total Events" value={summary?.total_events ?? 0} />
        <StatCard label="Peak People" value={summary?.peak_people ?? 0} />
        <StatCard label="Peak Occupancy" value={summary?.peak_occupancy ?? 0} />
        <StatCard label="Critical Alerts" value={summary?.critical_alerts ?? 0} variant="danger" />
      </section>

      <section className="content-grid live-grid">
        <div className="panel live-panel">
          <SectionHead
            kicker="Live Feed"
            title="Camera Stream"
            action={<button type="button" onClick={fetchDashboardData}>Refresh</button>}
          />
          <img src={VIDEO_STREAM_URL} alt="CrowdVision live video stream" className="live-feed" loading="eager" decoding="async" />
        </div>

        <div className={`panel incident-panel ${hasActiveIncident ? "incident-active" : "incident-safe"}`}>
          <p className="section-kicker">Incident Response</p>
          <h2>{hasActiveIncident ? "Active Incident" : "No Active Incident"}</h2>
          <div className="incident-status"><span>Status</span><strong>{hasActiveIncident ? "ACTIVE" : "SAFE"}</strong></div>
          <div className="summary-list">
            <p><span>Danger Zone</span><strong>{latestIncident?.danger_zone || "None"}</strong></p>
            <p><span>Duration</span><strong>{latestIncident?.incident_duration ?? 0}s</strong></p>
            <p><span>Density</span><strong>{latestIncident?.density_level || "Normal"}</strong></p>
            <p><span>Recommendation</span><strong>{latestIncident?.recommendation || "Monitor"}</strong></p>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel prediction-panel">
          <p className="section-kicker">Forecast</p>
          <h2>Prediction Intelligence</h2>
          <div className="summary-list">
            <p><span>Current People</span><strong>{prediction?.current_people ?? 0}</strong></p>
            <p><span>Predicted People</span><strong>{prediction?.predicted_people ?? 0}</strong></p>
            <p><span>Current Occupancy</span><strong>{prediction?.current_occupancy ?? 0}</strong></p>
            <p><span>Predicted Occupancy</span><strong>{prediction?.predicted_occupancy ?? 0}</strong></p>
            <p><span>Risk Trend</span><strong>{riskTrend}</strong></p>
          </div>
          <div className={`forecast-box trend-${String(riskTrend).toLowerCase()}`}>{prediction?.forecast_message || "No forecast available yet."}</div>
        </div>

        <div className={`panel anomaly-panel ${hasAnomaly ? "anomaly-active" : "anomaly-normal"}`}>
          <p className="section-kicker">Anomaly Engine</p>
          <h2>{hasAnomaly ? "Anomaly Detected" : "No Anomaly Detected"}</h2>
          <div className="incident-status"><span>Status</span><strong>{hasAnomaly ? "ANOMALY" : "NORMAL"}</strong></div>
          <div className="summary-list">
            <p><span>Type</span><strong>{latestAnomaly?.anomaly_type || "Normal"}</strong></p>
            <p><span>Score</span><strong>{latestAnomaly?.anomaly_score ?? 0}%</strong></p>
            <p><span>Severity</span><strong>{latestAnomaly?.anomaly_severity || "Normal"}</strong></p>
            <p><span>Zone</span><strong>{latestAnomaly?.anomaly_zone || "None"}</strong></p>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <p className="section-kicker">Current State</p>
          <h2>Live Snapshot</h2>
          <div className="snapshot-grid">
            <div><span>Profile</span><strong>{formatSourceLabel(latestEvent?.camera_profile)}</strong></div>
            <div><span>People</span><strong>{latestEvent?.total_people ?? 0}</strong></div>
            <div><span>Occupancy</span><strong>{latestEvent?.occupancy ?? 0}</strong></div>
            <div><span>Density</span><strong className={`density ${String(latestDensity).toLowerCase()}`}>{latestDensity}</strong></div>
          </div>
          <div className="alert-box">{latestEvent?.alert_message || "No alert available yet."}</div>
        </div>

        <div className="panel">
          <p className="section-kicker">Risk Overview</p>
          <h2>Risk Intelligence</h2>
          <div className="summary-list">
            <p><span>Highest Risk Time</span><strong>{intelligence?.highest_risk_time ?? "None"}</strong></p>
            <p><span>Highest Risk Density</span><strong>{intelligence?.highest_risk_density ?? "Unknown"}</strong></p>
            <p><span>Latest Camera Profile</span><strong>{formatSourceLabel(intelligence?.latest_camera_profile)}</strong></p>
            <p><span>High Alerts</span><strong>{summary?.high_alerts ?? 0}</strong></p>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <p className="section-kicker">Incident Overview</p>
          <h2>Incident Summary</h2>
          <div className="summary-list">
            <p><span>Total Incident Events</span><strong>{incidentSummary?.total_incident_events ?? 0}</strong></p>
            <p><span>Longest Duration</span><strong>{incidentSummary?.longest_incident_duration ?? 0}s</strong></p>
            <p><span>Latest Danger Zone</span><strong>{incidentSummary?.latest_danger_zone ?? "None"}</strong></p>
            <p><span>Recommended Action</span><strong>{incidentSummary?.latest_recommendation ?? "Monitor"}</strong></p>
          </div>
        </div>

        <div className="panel">
          <p className="section-kicker">Anomaly Overview</p>
          <h2>Anomaly Summary</h2>
          <div className="summary-list">
            <p><span>Total Anomalies</span><strong>{anomalySummary?.total_anomalies ?? 0}</strong></p>
            <p><span>Highest Score</span><strong>{anomalySummary?.highest_anomaly_score ?? 0}%</strong></p>
            <p><span>Latest Type</span><strong>{anomalySummary?.latest_anomaly_type ?? "Normal"}</strong></p>
            <p><span>Latest Zone</span><strong>{anomalySummary?.latest_anomaly_zone ?? "None"}</strong></p>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <ChartPanel title="Alert Distribution" type="bar" data={alertDistribution} />
        <LinePanel title="Occupancy Trend" data={chartData} lines={["occupancy", "peak_occupancy"]} colors={["#76c80f", "#ff4d5f"]} />
      </section>
    </>
  );
}
