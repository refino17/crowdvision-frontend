import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import StatCard from "../components/common/StatCard";
import SectionHead from "../components/common/SectionHead";
import NotificationCenter from "../components/notifications/NotificationCenter";
import ChartPanel from "../components/charts/ChartPanel";
import LinePanel from "../components/charts/LinePanel";
import { VIDEO_STREAM_URL } from "../config/constants";
import { formatSourceLabel } from "../utils/display";
import "../styles/edge-workers-v40.css";

const API_BASE_URL = VIDEO_STREAM_URL.replace("/api/video-feed", "");
const CAMERA_REFRESH_MS = 5000;
const CAMERA_PREVIEW_REFRESH_MS = 1000;

function numberValue(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatAge(seconds) {
  const value = numberValue(seconds, 0);

  if (value < 1) return "Just now";
  if (value < 60) return `${Math.round(value)}s ago`;
  if (value < 3600) return `${Math.round(value / 60)}m ago`;

  return `${Math.round(value / 3600)}h ago`;
}

function buildCameraPreviewUrl(previewUrl, previewTick) {
  if (!previewUrl) return "";

  const absoluteUrl = previewUrl.startsWith("http")
    ? previewUrl
    : `${API_BASE_URL}${previewUrl}`;

  const separator = absoluteUrl.includes("?") ? "&" : "?";
  return `${absoluteUrl}${separator}v=${previewTick}`;
}

function operatorCameraLabel(worker) {
  const location = String(worker?.location || "").trim();

  if (location && location.toLowerCase() !== "unassigned") {
    return location;
  }

  return "Remote Camera";
}

function connectionLabel(worker) {
  if (worker?.online) return "Connected";
  if (worker?.process_running) return "Connecting";
  return "Offline";
}

function connectionTone(worker) {
  return worker?.online || worker?.process_running ? "online" : "offline";
}

function analysisLabel(worker) {
  return worker?.metadata?.detect_enabled ? "AI Analysis" : "Status Only";
}

function analysisStatus(worker) {
  return worker?.metadata?.detect_enabled ? "Active" : "Standard";
}

function privacyLabel() {
  return "Anonymous Monitoring";
}

function operatorCameraMessage(camera) {
  let text = String(
    camera?.message ||
    camera?.camera_health?.message ||
    "Waiting for camera status."
  );

  const replacements = [
    ["Edge worker process", "Camera connection"],
    ["edge worker process", "camera connection"],
    ["Managed edge worker", "Camera"],
    ["managed edge worker", "camera"],
    ["Edge worker", "Remote camera"],
    ["edge worker", "remote camera"],
    ["Edge telemetry", "Camera status"],
    ["edge telemetry", "camera status"],
    ["Edge source", "Camera source"],
    ["edge source", "camera source"]
  ];

  replacements.forEach(([oldText, newText]) => {
    text = text.replaceAll(oldText, newText);
  });

  return text;
}

function isInternalTestCamera(worker) {
  const id = String(worker?.edge_id || "").toLowerCase();
  const name = String(worker?.name || "").toLowerCase();
  const source = String(worker?.source || "").toLowerCase();

  return id === "manual_test" || name === "manual test" || source === "test";
}

function EdgeBadge({ value, tone = "default" }) {
  return <span className={`edge-badge tone-${tone}`}>{value}</span>;
}

function EdgeMetric({ label, value, tone = "default" }) {
  return (
    <div className={`edge-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RemoteCameraCard({ camera, busyAction = "", onStopCamera, onOpenPreview, previewTick }) {
  const online = Boolean(camera?.online);
  const processRunning = Boolean(camera?.process_running);
  const managedByDashboard = Boolean(camera?.managed_by_api);
  const cameraHealth = camera?.camera_health || {};
  const tamperDetected = Boolean(cameraHealth?.tamper_detected);
  const densityTone = String(camera?.density || "unknown").toLowerCase();
  const cameraId = camera?.edge_id || "remote_camera";
  const stopBusy = busyAction === `stop:${cameraId}`;
  const previewSrc = buildCameraPreviewUrl(camera?.preview_url, previewTick);
  const previewLive = Boolean(camera?.preview_live && online);
  const cameraSignal = tamperDetected && online
    ? cameraHealth?.tamper_type || "Warning"
    : cameraHealth?.signal_quality || camera?.health || "Waiting";

  return (
    <article className={`edge-worker-card ${online ? "online" : "offline"} ${processRunning ? "process-running" : ""} ${tamperDetected && online ? "tamper" : ""}`}>
      <div className="edge-worker-card-head">
        <div>
          <p>{operatorCameraLabel(camera)}</p>
          <h3>{camera?.name || "Remote Camera"}</h3>
        </div>

        <div className="edge-worker-badges">
          <EdgeBadge value={connectionLabel(camera)} tone={connectionTone(camera)} />
          <EdgeBadge value={analysisLabel(camera)} tone={camera?.metadata?.detect_enabled ? "ai" : "default"} />
        </div>
      </div>

      <button
        type="button"
        className={`edge-preview-shell ${previewLive ? "is-live" : "is-last-frame"}`}
        onClick={() => previewSrc && onOpenPreview(camera)}
        disabled={!previewSrc}
        title={previewSrc ? "Open larger camera view" : "Waiting for camera preview"}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={`${camera?.name || "Remote camera"} preview`}
            className="edge-preview-image"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="edge-preview-placeholder">
            <strong>{processRunning ? "Connecting Camera" : "No Live View Available"}</strong>
            <span>{processRunning ? "The live view should appear in a few seconds." : "Start this camera to receive live images."}</span>
          </div>
        )}

        <div className="edge-preview-status">
          <span className={previewLive ? "edge-preview-dot live" : "edge-preview-dot"} />
          <strong>{previewLive ? "Live Camera" : previewSrc ? "Last Camera Image" : "Waiting for Camera"}</strong>
        </div>

        {previewSrc && <span className="edge-preview-open-label">View</span>}
      </button>

      <div className="edge-worker-source-row">
        <span>Camera Source</span>
        <strong>{formatSourceLabel(camera?.source_type || camera?.source || "Remote Camera")}</strong>
      </div>

      <div className="edge-worker-grid">
        <EdgeMetric label="People Detected" value={camera?.people ?? camera?.total_people ?? 0} tone="green" />
        <EdgeMetric label="Crowd Level" value={camera?.density || "Unknown"} tone={densityTone} />
        <EdgeMetric label="Camera Status" value={connectionLabel(camera)} tone={online ? "green" : processRunning ? "yellow" : "default"} />
        <EdgeMetric label="AI Analysis" value={analysisStatus(camera)} tone={camera?.metadata?.detect_enabled ? "purple" : "default"} />
      </div>

      <div className="edge-worker-integrity">
        <div>
          <span>Camera Signal</span>
          <strong>{cameraSignal}</strong>
        </div>
        <div>
          <span>Last Update</span>
          <strong>{formatAge(camera?.age_seconds)}</strong>
        </div>
      </div>

      <div className="edge-worker-message">
        {operatorCameraMessage(camera)}
      </div>

      <div className="edge-worker-footer">
        <span>Live View: <strong>{camera?.preview_available ? (previewLive ? "Available" : "Last Image") : "Waiting"}</strong></span>
        <span>Privacy: <strong>{privacyLabel()}</strong></span>
      </div>

      <div className="edge-worker-control-row">
        <button
          type="button"
          className="edge-danger-button"
          onClick={() => onStopCamera(cameraId)}
          disabled={stopBusy || !managedByDashboard || !processRunning}
          title={!managedByDashboard ? "This camera is managed from its connected device" : "Stop this camera connection"}
        >
          {stopBusy
            ? "Stopping..."
            : managedByDashboard
              ? processRunning
                ? "Stop Camera"
                : "Camera Offline"
              : "Managed Remotely"}
        </button>
      </div>
    </article>
  );
}

function RemoteCameraNetwork({ fetchDashboardData }) {
  const [cameraStatus, setCameraStatus] = useState({
    enabled: true,
    workers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastCameraUpdate, setLastCameraUpdate] = useState("");
  const [operationMessage, setOperationMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [previewTick, setPreviewTick] = useState(Date.now());
  const [selectedCamera, setSelectedCamera] = useState(null);

  async function fetchCameraStatus() {
    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/edge/status`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Camera status request failed: ${response.status}`);
      }

      const data = await response.json();
      setCameraStatus({
        enabled: Boolean(data?.enabled ?? true),
        workers: Array.isArray(data?.workers) ? data.workers : []
      });
      setLastCameraUpdate(new Date().toLocaleTimeString());
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || "Unable to load remote cameras.");
    } finally {
      setLoading(false);
    }
  }

  async function postCameraCommand(endpoint, label, body = {}) {
    setBusyAction(label);
    setOperationMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.detail || result?.message || "Camera command failed");
      }

      setOperationMessage(result?.message || "Camera command completed successfully.");

      setTimeout(fetchCameraStatus, 1200);

      if (typeof fetchDashboardData === "function") {
        setTimeout(fetchDashboardData, 1500);
      }
    } catch (commandError) {
      console.error(commandError);
      setError(commandError.message || "Camera command failed.");
    } finally {
      setBusyAction("");
    }
  }

  function startDemoCamera() {
    postCameraCommand("/api/edge/workers/start-demo", "start-demo", {
      detect: true,
      model: "yolov8n.pt",
      timeout: 15,
      interval: 10,
      process_every: 10,
      preview: true,
      preview_interval: 1,
      preview_width: 640,
      preview_quality: 68
    });
  }

  function startLaptopCamera() {
    postCameraCommand("/api/edge/workers/start-webcam", "start-webcam", {
      detect: true,
      model: "yolov8n.pt",
      timeout: 15,
      interval: 5,
      process_every: 10,
      preview: true,
      preview_interval: 1,
      preview_width: 640,
      preview_quality: 68
    });
  }

  function stopAllCameras() {
    postCameraCommand("/api/edge/workers/stop-all", "stop-all");
  }

  function stopCamera(cameraId) {
    postCameraCommand(`/api/edge/workers/${cameraId}/stop`, `stop:${cameraId}`);
  }

  useEffect(() => {
    fetchCameraStatus();

    const interval = setInterval(fetchCameraStatus, CAMERA_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const previewInterval = setInterval(() => {
      setPreviewTick(Date.now());
    }, CAMERA_PREVIEW_REFRESH_MS);

    return () => clearInterval(previewInterval);
  }, []);

  useEffect(() => {
    if (!selectedCamera) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedCamera(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedCamera]);

  const cameras = useMemo(() => {
    return (cameraStatus.workers || []).filter((camera) => !isInternalTestCamera(camera));
  }, [cameraStatus.workers]);

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter((camera) => Boolean(camera?.online)).length;
  const offlineCameras = totalCameras - onlineCameras;
  const activeCameraSessions = cameras.filter((camera) => Boolean(camera?.process_running)).length;
  const aiEnabledCameras = cameras.filter((camera) => Boolean(camera?.metadata?.detect_enabled)).length;
  const activeCameraAlerts = cameras.filter((camera) => Boolean(camera?.online && camera?.camera_health?.tamper_detected)).length;

  const activeSelectedCamera = selectedCamera
    ? cameras.find((camera) => camera?.edge_id === selectedCamera?.edge_id) || selectedCamera
    : null;

  return (
    <section className="edge-workers-section">
      <div className="panel edge-command-panel">
        <SectionHead
          kicker="Connected Monitoring"
          title="Remote Camera Network"
          badge={<EdgeBadge value={cameraStatus.enabled ? "Network Ready" : "Unavailable"} tone={cameraStatus.enabled ? "online" : "offline"} />}
          action={
            <div className="edge-action-row">
              <button
                type="button"
                className="edge-primary-button"
                onClick={startDemoCamera}
                disabled={Boolean(busyAction)}
              >
                {busyAction === "start-demo" ? "Starting Demo Camera..." : "Start Demo Camera"}
              </button>
              <button
                type="button"
                className="edge-secondary-button"
                onClick={startLaptopCamera}
                disabled={Boolean(busyAction)}
              >
                {busyAction === "start-webcam" ? "Starting Laptop Camera..." : "Start Laptop Camera"}
              </button>
              <button
                type="button"
                className="edge-danger-button"
                onClick={stopAllCameras}
                disabled={Boolean(busyAction)}
              >
                {busyAction === "stop-all" ? "Stopping Cameras..." : "Stop All Cameras"}
              </button>
              <button type="button" onClick={fetchCameraStatus} disabled={Boolean(busyAction)}>
                Refresh Cameras
              </button>
              <button type="button" onClick={fetchDashboardData}>
                Refresh Dashboard
              </button>
            </div>
          }
        />

        <p className="edge-command-copy">
          Connect approved cameras to the command center and view live crowd status, camera health, and AI safety information from one place.
          Use the controls here to start local demonstration cameras or monitor approved connected devices.
        </p>

        <div className="edge-how-it-works">
          <div>
            <span>1</span>
            <p><strong>Start a camera</strong> using the demo source or your laptop camera.</p>
          </div>
          <div>
            <span>2</span>
            <p><strong>Wait for connection</strong> while the camera prepares its live view and safety status.</p>
          </div>
          <div>
            <span>3</span>
            <p><strong>Watch live activity</strong> inside the camera card and open it for a larger view.</p>
          </div>
          <div>
            <span>!</span>
            <p><strong>One camera, one session.</strong> Do not use the laptop camera here and in Main Monitoring at the same time.</p>
          </div>
        </div>

        <div className="edge-summary-grid">
          <EdgeMetric label="Total Cameras" value={totalCameras} tone="cyan" />
          <EdgeMetric label="Online Cameras" value={onlineCameras} tone="green" />
          <EdgeMetric label="Offline Cameras" value={offlineCameras} tone="yellow" />
          <EdgeMetric label="Active Camera Sessions" value={activeCameraSessions} tone="green" />
          <EdgeMetric label="AI-Enabled Cameras" value={aiEnabledCameras} tone="purple" />
          <EdgeMetric label="Active Camera Alerts" value={activeCameraAlerts} tone={activeCameraAlerts ? "critical" : "green"} />
          <EdgeMetric label="Last Camera Update" value={lastCameraUpdate || "Waiting"} tone="default" />
        </div>

        {operationMessage && <div className="edge-status-box">{operationMessage}</div>}
        {error && <div className="edge-error-box">{error}</div>}
        {loading && !cameras.length && <div className="edge-empty-state">Loading connected cameras...</div>}

        {!loading && cameras.length === 0 && (
          <div className="edge-empty-state">
            <h3>No remote cameras connected yet</h3>
            <p>Click <strong>Start Demo Camera</strong> to see how a connected camera appears in the command center.</p>
          </div>
        )}

        {cameras.length > 0 && (
          <div className="edge-workers-grid">
            {cameras.map((camera) => (
              <RemoteCameraCard
                camera={camera}
                busyAction={busyAction}
                onStopCamera={stopCamera}
                onOpenPreview={setSelectedCamera}
                previewTick={previewTick}
                key={camera.edge_id || camera.name}
              />
            ))}
          </div>
        )}
      </div>

      {activeSelectedCamera && createPortal(
        <div
          className="edge-preview-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeSelectedCamera?.name || "Remote camera"} live view`}
          onClick={() => setSelectedCamera(null)}
        >
          <div className="edge-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="edge-preview-modal-head">
              <div>
                <p>{operatorCameraLabel(activeSelectedCamera)}</p>
                <h2>{activeSelectedCamera?.name || "Remote Camera"}</h2>
              </div>
              <button type="button" className="edge-danger-button" onClick={() => setSelectedCamera(null)}>
                Close
              </button>
            </div>

            <div className="edge-preview-modal-stage">
              <img
                src={buildCameraPreviewUrl(activeSelectedCamera?.preview_url, previewTick)}
                alt={`${activeSelectedCamera?.name || "Remote camera"} large view`}
              />
              <div className="edge-preview-modal-live">
                <span className={activeSelectedCamera?.online ? "edge-preview-dot live" : "edge-preview-dot"} />
                {activeSelectedCamera?.online ? "Live Camera" : "Last Saved Camera Image"}
              </div>
            </div>

            <div className="edge-preview-modal-metrics">
              <EdgeMetric label="People Detected" value={activeSelectedCamera?.people ?? 0} tone="green" />
              <EdgeMetric label="Crowd Level" value={activeSelectedCamera?.density || "Unknown"} tone={String(activeSelectedCamera?.density || "unknown").toLowerCase()} />
              <EdgeMetric label="Camera Signal" value={activeSelectedCamera?.camera_health?.signal_quality || "Waiting"} tone="cyan" />
              <EdgeMetric label="Last Update" value={formatAge(activeSelectedCamera?.age_seconds)} tone="default" />
            </div>
          </div>
        </div>,
        document.body
      )}
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
          <p className="subtitle">A focused overview of live crowd status, alerts, incidents, predictions, and connected camera operations.</p>
        </div>
      </section>

      <NotificationCenter notifications={data.notifications} />

      <section className="cards-grid">
        <StatCard label="Total Events" value={summary?.total_events ?? 0} />
        <StatCard label="Peak People" value={summary?.peak_people ?? 0} />
        <StatCard label="Peak Occupancy" value={summary?.peak_occupancy ?? 0} />
        <StatCard label="Critical Alerts" value={summary?.critical_alerts ?? 0} variant="danger" />
      </section>

      <RemoteCameraNetwork fetchDashboardData={fetchDashboardData} />

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