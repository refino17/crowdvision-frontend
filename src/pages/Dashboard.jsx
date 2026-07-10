import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/common/StatCard";
import SectionHead from "../components/common/SectionHead";
import NotificationCenter from "../components/notifications/NotificationCenter";
import ChartPanel from "../components/charts/ChartPanel";
import LinePanel from "../components/charts/LinePanel";
import { VIDEO_STREAM_URL } from "../config/constants";
import { formatSourceLabel } from "../utils/display";
import "../styles/edge-workers-v40.css";

const API_BASE_URL = VIDEO_STREAM_URL.replace("/api/video-feed", "");
const CAMERA_NETWORK_REFRESH_MS = 10000;

function isInternalTestCamera(camera) {
  const id = String(camera?.edge_id || "").toLowerCase();
  const name = String(camera?.name || "").toLowerCase();
  const source = String(camera?.source || "").toLowerCase();
  return id === "manual_test" || name === "manual test" || source === "test";
}

function CameraNetworkMetric({ label, value, tone = "default" }) {
  return (
    <div className={`camera-network-summary-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CameraNetworkSummary() {
  const [network, setNetwork] = useState({ enabled: true, workers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchNetworkStatus() {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/edge/status`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Camera network request failed: ${response.status}`);
      const payload = await response.json();
      setNetwork({
        enabled: Boolean(payload?.enabled ?? true),
        workers: Array.isArray(payload?.workers) ? payload.workers : [],
      });
    } catch (requestError) {
      console.error(requestError);
      setError("Camera network status is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNetworkStatus();
    const interval = setInterval(fetchNetworkStatus, CAMERA_NETWORK_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const cameras = useMemo(
    () => (network.workers || []).filter((camera) => !isInternalTestCamera(camera)),
    [network.workers]
  );

  const totalCameras = cameras.length;
  const connectedCameras = cameras.filter((camera) => Boolean(camera?.online)).length;
  const activeWarnings = cameras.filter(
    (camera) => Boolean(camera?.online && camera?.camera_health?.tamper_detected)
  ).length;
  const activeSessions = cameras.filter((camera) => Boolean(camera?.process_running)).length;

  const networkState = error
    ? "Unavailable"
    : activeWarnings > 0
      ? "Attention Required"
      : connectedCameras > 0
        ? "Connected"
        : totalCameras > 0
          ? "Standby"
          : "Ready";

  return (
    <section className="camera-network-summary panel">
      <div className="camera-network-summary-copy">
        <p className="section-kicker">Connected Monitoring</p>
        <h2>Camera Network</h2>
        <p>
          A compact executive view of connected camera operations. Detailed controls,
          previews, and camera management remain in Camera Network.
        </p>
      </div>

      <div className="camera-network-summary-metrics">
        <CameraNetworkMetric label="Registered Cameras" value={loading ? "…" : totalCameras} tone="cyan" />
        <CameraNetworkMetric label="Connected Now" value={loading ? "…" : connectedCameras} tone="green" />
        <CameraNetworkMetric label="Active Sessions" value={loading ? "…" : activeSessions} tone="purple" />
        <CameraNetworkMetric label="Camera Warnings" value={loading ? "…" : activeWarnings} tone={activeWarnings ? "critical" : "green"} />
      </div>

      <div className="camera-network-summary-actions">
        <span className={`camera-network-state ${activeWarnings ? "warning" : connectedCameras ? "online" : "standby"}`}>
          {networkState}
        </span>
        <Link className="camera-network-manage-link" to="/sources">
          Manage Camera Network
        </Link>
      </div>

      {error && <div className="camera-network-summary-error">{error}</div>}
    </section>
  );
}

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
    engineStatus = {},
  } = data;

  const monitoringRunning = Boolean(engineStatus?.running);
  const latestDensity = latestEvent?.density_level || "Unknown";
  const hasActiveIncident = monitoringRunning && Boolean(latestIncident);
  const hasActiveAnomaly = monitoringRunning && Boolean(latestAnomaly);
  const hasIncidentHistory = Number(incidentSummary?.total_incident_events || 0) > 0;
  const hasAnomalyHistory = Number(anomalySummary?.total_anomalies || 0) > 0;
  const riskTrend = prediction?.risk_trend || "Stable";

  return (
    <>
      <section className="hero-panel compact-hero">
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h1>Command Dashboard</h1>
          <p className="subtitle">
            A focused overview of current crowd safety, active alerts, incident status,
            predictions, and connected camera operations.
          </p>
        </div>
      </section>

      <NotificationCenter notifications={data.notifications} />

      <section className="cards-grid">
        <StatCard label="Total Events" value={summary?.total_events ?? 0} />
        <StatCard label="Peak People" value={summary?.peak_people ?? 0} />
        <StatCard label="Peak Occupancy" value={summary?.peak_occupancy ?? 0} />
        <StatCard label="Critical Alerts" value={summary?.critical_alerts ?? 0} variant="danger" />
      </section>

      <CameraNetworkSummary />

      <section className="content-grid live-grid">
        <div className="panel live-panel">
          <SectionHead
            kicker={monitoringRunning ? "Live Feed" : "Last Camera Frame"}
            title="Camera Stream"
            action={<button type="button" onClick={fetchDashboardData}>Refresh</button>}
          />
          <img
            src={VIDEO_STREAM_URL}
            alt="CrowdVision camera stream"
            className={`live-feed ${monitoringRunning ? "" : "historical-frame"}`}
            loading="eager"
            decoding="async"
          />
        </div>

        <div className={`panel incident-panel ${hasActiveIncident ? "incident-active" : "incident-safe"}`}>
          <p className="section-kicker">Incident Response</p>
          <h2>{hasActiveIncident ? "Active Incident" : "No Active Incident"}</h2>
          <div className="incident-status">
            <span>Status</span>
            <strong>{hasActiveIncident ? "ACTIVE" : monitoringRunning ? "CLEAR" : "PAUSED"}</strong>
          </div>
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
                <p><span>Current State</span><strong>{monitoringRunning ? "No current incident" : "Monitoring is paused"}</strong></p>
                <p><span>Last Recorded Zone</span><strong>{hasIncidentHistory ? incidentSummary?.latest_danger_zone || "None" : "None"}</strong></p>
                <p><span>Last Recorded</span><strong>{incidentSummary?.latest_recorded_at || "No incident history"}</strong></p>
                <p><span>Response</span><strong>{monitoringRunning ? "Continue monitoring" : "Start monitoring when ready"}</strong></p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel prediction-panel">
          <p className="section-kicker">{monitoringRunning ? "Forecast" : "Last Forecast"}</p>
          <h2>Prediction Intelligence</h2>
          <div className="summary-list">
            <p><span>Current People</span><strong>{prediction?.current_people ?? 0}</strong></p>
            <p><span>Predicted People</span><strong>{prediction?.predicted_people ?? 0}</strong></p>
            <p><span>Current Occupancy</span><strong>{prediction?.current_occupancy ?? 0}</strong></p>
            <p><span>Predicted Occupancy</span><strong>{prediction?.predicted_occupancy ?? 0}</strong></p>
            <p><span>Risk Trend</span><strong>{riskTrend}</strong></p>
          </div>
          <div className={`forecast-box trend-${String(riskTrend).toLowerCase()}`}>
            {monitoringRunning
              ? prediction?.forecast_message || "No forecast available yet."
              : "Monitoring is paused. Values shown are from the last recorded monitoring session."}
          </div>
        </div>

        <div className={`panel anomaly-panel ${hasActiveAnomaly ? "anomaly-active" : "anomaly-normal"}`}>
          <p className="section-kicker">Anomaly Engine</p>
          <h2>{hasActiveAnomaly ? "Anomaly Detected" : "No Active Anomaly"}</h2>
          <div className="incident-status">
            <span>Status</span>
            <strong>{hasActiveAnomaly ? "ANOMALY" : monitoringRunning ? "NORMAL" : "PAUSED"}</strong>
          </div>
          <div className="summary-list">
            {hasActiveAnomaly ? (
              <>
                <p><span>Type</span><strong>{latestAnomaly?.anomaly_type || "Normal"}</strong></p>
                <p><span>Score</span><strong>{latestAnomaly?.anomaly_score ?? 0}%</strong></p>
                <p><span>Severity</span><strong>{latestAnomaly?.anomaly_severity || "Normal"}</strong></p>
                <p><span>Zone</span><strong>{latestAnomaly?.anomaly_zone || "None"}</strong></p>
              </>
            ) : (
              <>
                <p><span>Current State</span><strong>No anomaly is active now</strong></p>
                <p><span>Last Recorded Type</span><strong>{hasAnomalyHistory ? anomalySummary?.latest_anomaly_type || "Normal" : "None"}</strong></p>
                <p><span>Last Recorded Zone</span><strong>{hasAnomalyHistory ? anomalySummary?.latest_anomaly_zone || "None" : "None"}</strong></p>
                <p><span>Last Recorded</span><strong>{anomalySummary?.latest_recorded_at || "No anomaly history"}</strong></p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <p className="section-kicker">{monitoringRunning ? "Current State" : "Last Recorded State"}</p>
          <h2>{monitoringRunning ? "Live Snapshot" : "Session Snapshot"}</h2>
          <div className="snapshot-grid">
            <div><span>Profile</span><strong>{formatSourceLabel(latestEvent?.camera_profile)}</strong></div>
            <div><span>People</span><strong>{latestEvent?.total_people ?? 0}</strong></div>
            <div><span>Occupancy</span><strong>{latestEvent?.occupancy ?? 0}</strong></div>
            <div><span>Density</span><strong className={`density ${String(latestDensity).toLowerCase()}`}>{latestDensity}</strong></div>
          </div>
          <div className="alert-box">
            {monitoringRunning
              ? latestEvent?.alert_message || "No alert available yet."
              : "Monitoring is paused. This panel shows the last recorded operational snapshot."}
          </div>
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
          <h2>Incident History Summary</h2>
          <div className="summary-list">
            <p><span>Total Incident Events</span><strong>{incidentSummary?.total_incident_events ?? 0}</strong></p>
            <p><span>Longest Duration</span><strong>{incidentSummary?.longest_incident_duration ?? 0}s</strong></p>
            <p><span>Latest Recorded Zone</span><strong>{incidentSummary?.latest_danger_zone ?? "None"}</strong></p>
            <p><span>Latest Recorded</span><strong>{incidentSummary?.latest_recorded_at ?? "None"}</strong></p>
          </div>
        </div>

        <div className="panel">
          <p className="section-kicker">Anomaly Overview</p>
          <h2>Anomaly History Summary</h2>
          <div className="summary-list">
            <p><span>Total Anomalies</span><strong>{anomalySummary?.total_anomalies ?? 0}</strong></p>
            <p><span>Highest Score</span><strong>{anomalySummary?.highest_anomaly_score ?? 0}%</strong></p>
            <p><span>Latest Recorded Type</span><strong>{anomalySummary?.latest_anomaly_type ?? "Normal"}</strong></p>
            <p><span>Latest Recorded</span><strong>{anomalySummary?.latest_recorded_at ?? "None"}</strong></p>
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