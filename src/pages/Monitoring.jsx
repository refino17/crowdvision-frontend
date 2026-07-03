import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/monitoring-v40.css";

import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import CameraHealthGrid from "../components/camera/CameraHealthGrid";
import { VIDEO_STREAM_URL } from "../config/constants";
import { formatSourceLabel } from "../utils/display";

function metricValue(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function safeText(value, fallback = "None") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function displayNumber(value, decimals = 1) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return value ?? 0;
  return Number.isInteger(numberValue) ? numberValue : numberValue.toFixed(decimals);
}

function TrackingMetric({ label, value, tone = "default" }) {
  return (
    <div className={`tracking-metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusItem({ label, value, tone = "default" }) {
  return (
    <div className={`operator-status-item tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PresentationMetric({ label, value, tone = "default" }) {
  return (
    <div className={`presentation-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function MonitoringPage({ data = {} }) {
  const [presentationOpen, setPresentationOpen] = useState(false);

  const {
    engineStatus = {},
    startEngine,
    stopEngine,
    restartEngine,
    latestEvent,
    latestIncident,
    latestAnomaly,
    prediction,
    fetchDashboardData
  } = data;

  const cameraHealth = data.cameraHealth || {};
  const cameras = cameraHealth?.cameras || [];
  const activeCamera =
    cameras.find((camera) => camera.active) ||
    cameras.find((camera) => camera.key === data.activeCameraProfile) ||
    null;

  const tracking =
    activeCamera?.tracking ||
    cameraHealth?.tracking ||
    latestEvent?.tracking ||
    {};

  const engineRunning = Boolean(engineStatus?.running);
  const streamLive = Boolean(engineRunning && cameraHealth?.active_online);

  const activeProfile =
    latestEvent?.camera_profile ||
    cameraHealth?.active_profile ||
    activeCamera?.name ||
    data.activeCameraProfile ||
    "No source";

  const latestDensity =
    latestEvent?.density_level ||
    activeCamera?.density ||
    cameraHealth?.density ||
    "Unknown";

  const peopleCount =
    latestEvent?.total_people ??
    activeCamera?.people ??
    cameraHealth?.people ??
    0;

  const occupancy =
    latestEvent?.occupancy ??
    activeCamera?.occupancy ??
    cameraHealth?.occupancy ??
    0;

  const fps = metricValue(activeCamera?.fps ?? cameraHealth?.fps, 0);
  const aiFps = metricValue(cameraHealth?.ai_fps ?? activeCamera?.ai_fps, 0);

  const sessionUniquePeople = metricValue(tracking?.session_unique_people);
  const activeTracks = metricValue(tracking?.active_tracks);
  const memoryTracks = metricValue(tracking?.memory_tracks);
  const reidentifiedPeople = metricValue(tracking?.reidentified_people);
  const duplicatesPrevented = metricValue(tracking?.duplicates_prevented);
  const rawContinuity = metricValue(tracking?.raw_tracker_continuity);
  const trackingQuality = safeText(tracking?.tracking_quality, "Waiting");
  const privacyMode = safeText(tracking?.privacy_mode, "Anonymous body tracking");

  const incidentActive = Boolean(latestIncident);
  const anomalyActive = Boolean(latestAnomaly);

  async function openPresentationMode() {
    setPresentationOpen(true);

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("Browser fullscreen was blocked, but CrowdVision video-only presentation mode is still open.", error);
    }
  }

  async function closePresentationMode() {
    setPresentationOpen(false);

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Could not exit fullscreen cleanly.", error);
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setPresentationOpen(false);
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!presentationOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setPresentationOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [presentationOpen]);

  useEffect(() => {
    if (!presentationOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [presentationOpen]);

  const densityTone = String(latestDensity).toLowerCase();
  const alertMessage = latestEvent?.alert_message || cameraHealth?.alert || "No active alert";

  return (
    <>
      <section className="page-title-panel monitoring-title-panel">
        <p className="section-kicker">Operator View</p>
        <h1>Monitoring Center</h1>
        <p>
          Live surveillance, AI engine controls, incident response, anomaly intelligence,
          and anonymous person tracking in one command desk.
        </p>
      </section>

      <section className="monitoring-command-deck">
        <div className="panel live-panel monitoring-feed monitoring-feed-hero">
          <SectionHead
            kicker="Live Monitoring"
            title="Camera Stream"
            badge={
              <Badge
                value={streamLive ? "Live" : "Paused"}
                type={streamLive ? "running" : "stopped"}
              />
            }
            action={
              <div className="monitoring-head-actions">
                <button type="button" className="presentation-button" onClick={openPresentationMode}>
                  Full Screen
                </button>
                <button type="button" onClick={fetchDashboardData}>
                  Refresh
                </button>
              </div>
            }
          />

          <div className={`live-frame-shell ${streamLive ? "is-live" : "is-paused"}`}>
            <img
              src={VIDEO_STREAM_URL}
              alt="CrowdVision live video stream"
              className="live-feed monitor-feed monitoring-stream-img"
              loading="eager"
              decoding="async"
            />

            <div className="live-frame-watermark">
              <span>{streamLive ? "Live AI Feed" : "Last Saved Frame"}</span>
            </div>

            {!streamLive && (
              <div className="stream-state-overlay">
                <div className="stream-state-card">
                  <p className="section-kicker">Monitoring Paused</p>
                  <h2>{engineRunning ? "Waiting For Fresh Camera Frames" : "Engine Is Not Running"}</h2>
                  <p>
                    The image may be the last saved frame. Start monitoring to resume
                    live camera analysis and anonymous tracking.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="operator-status-strip">
            <StatusItem label="Source" value={formatSourceLabel(activeProfile)} tone="cyan" />
            <StatusItem label="People" value={peopleCount} tone="green" />
            <StatusItem label="Occupancy" value={occupancy} tone="yellow" />
            <StatusItem label="Density" value={latestDensity} tone={densityTone} />
            <StatusItem label="FPS" value={displayNumber(fps, 1)} />
            <StatusItem label="AI FPS" value={displayNumber(aiFps, 2)} />
          </div>
        </div>

        <aside className="monitor-command-sidebar">
          <div className="panel mini-panel command-control-panel">
            <SectionHead
              kicker="AI Engine"
              title="Control Center"
              badge={
                <Badge
                  value={engineRunning ? "Running" : "Stopped"}
                  type={engineRunning ? "running" : "stopped"}
                />
              }
            />

            <div className="control-action-stack">
              <button
                type="button"
                onClick={startEngine}
                disabled={engineRunning}
              >
                Start Monitoring
              </button>

              <button
                type="button"
                onClick={stopEngine}
                disabled={!engineRunning}
                className="stop-button"
              >
                Stop Monitoring
              </button>

              <button
                type="button"
                onClick={restartEngine}
                className="restart-button"
              >
                Restart Monitoring
              </button>
            </div>
          </div>

          <div className="panel mini-panel snapshot-panel">
            <p className="section-kicker">Live Metrics</p>
            <h2>Current Snapshot</h2>

            <div className="summary-list">
              <p>
                <span>Profile</span>
                <strong>{formatSourceLabel(activeProfile)}</strong>
              </p>

              <p>
                <span>People</span>
                <strong>{peopleCount}</strong>
              </p>

              <p>
                <span>Occupancy</span>
                <strong>{occupancy}</strong>
              </p>

              <p>
                <span>Density</span>
                <strong className={`density ${densityTone}`}>
                  {latestDensity}
                </strong>
              </p>

              <p>
                <span>Alert</span>
                <strong>{alertMessage}</strong>
              </p>
            </div>
          </div>

          <div className="panel mini-panel tracking-panel">
            <p className="section-kicker">Anonymous Tracking</p>
            <h2>Person Intelligence</h2>

            <div className="tracking-metric-grid">
              <TrackingMetric label="Unique Seen" value={sessionUniquePeople} tone="green" />
              <TrackingMetric label="Active Now" value={activeTracks} tone="cyan" />
              <TrackingMetric label="Memory" value={memoryTracks} />
              <TrackingMetric label="Re-ID" value={reidentifiedPeople} tone="yellow" />
              <TrackingMetric label="Duplicates Blocked" value={duplicatesPrevented} tone="yellow" />
              <TrackingMetric label="Continuity" value={rawContinuity} />
            </div>

            <div className="tracking-status-row">
              <p>
                <span>Status</span>
                <strong>{trackingQuality}</strong>
              </p>
              <p>
                <span>Privacy</span>
                <strong>{privacyMode}</strong>
              </p>
            </div>

            <div className="privacy-note">
              This does not identify faces. It uses anonymous body tracking to reduce double-counting.
            </div>
          </div>

          <div className={`panel mini-panel incident-card ${incidentActive ? "incident-active" : "incident-safe"}`}>
            <p className="section-kicker">Incident</p>
            <h2>{incidentActive ? "Active Incident" : "No Incident"}</h2>

            <div className="summary-list">
              <p>
                <span>Zone</span>
                <strong>{latestIncident?.danger_zone || "None"}</strong>
              </p>

              <p>
                <span>Duration</span>
                <strong>{latestIncident?.incident_duration ?? 0}s</strong>
              </p>

              <p>
                <span>Action</span>
                <strong>{latestIncident?.recommendation || "Monitor"}</strong>
              </p>
            </div>
          </div>

          <div className={`panel mini-panel anomaly-card ${anomalyActive ? "anomaly-active" : "anomaly-normal"}`}>
            <p className="section-kicker">Anomaly</p>
            <h2>{anomalyActive ? "Detected" : "Normal"}</h2>

            <div className="summary-list">
              <p>
                <span>Type</span>
                <strong>{latestAnomaly?.anomaly_type || "Normal"}</strong>
              </p>

              <p>
                <span>Score</span>
                <strong>{latestAnomaly?.anomaly_score ?? 0}%</strong>
              </p>

              <p>
                <span>Prediction</span>
                <strong>{prediction?.forecast_message || "No forecast"}</strong>
              </p>
            </div>
          </div>
        </aside>
      </section>

      <CameraHealthGrid
        cameraHealth={data.cameraHealth}
        activeCameraProfile={data.activeCameraProfile}
        switchCameraProfile={data.switchCameraProfile}
      />

      {presentationOpen &&
        createPortal(
          <div
            className={`monitoring-presentation-overlay video-only-presentation ${streamLive ? "is-live" : "is-paused"}`}
            role="dialog"
            aria-modal="true"
            aria-label="CrowdVision full screen video monitoring"
          >
            <img
              src={VIDEO_STREAM_URL}
              alt="CrowdVision full screen live monitoring"
              className="presentation-video-only-feed"
              loading="eager"
              decoding="async"
            />

            <div className="video-only-hud video-only-hud-left">
              <span className={streamLive ? "hud-dot live" : "hud-dot paused"} />
              <strong>{streamLive ? "LIVE MONITORING" : "MONITORING PAUSED"}</strong>
              <small>{formatSourceLabel(activeProfile)}</small>
            </div>

            <div className="video-only-hud video-only-hud-bottom">
              <p>
                <span>People</span>
                <strong>{peopleCount}</strong>
              </p>
              <p>
                <span>Occupancy</span>
                <strong>{occupancy}</strong>
              </p>
              <p>
                <span>Density</span>
                <strong className={`density-${densityTone}`}>{latestDensity}</strong>
              </p>
              <p>
                <span>Unique Seen</span>
                <strong>{sessionUniquePeople}</strong>
              </p>
              <p>
                <span>Duplicates Blocked</span>
                <strong>{duplicatesPrevented}</strong>
              </p>
            </div>

            {!streamLive && (
              <div className="video-only-paused-card">
                <p>Monitoring Paused</p>
                <h2>{engineRunning ? "Waiting for fresh frames" : "Engine is not running"}</h2>
                <span>Start monitoring for a clean live demonstration view.</span>
              </div>
            )}

            <button type="button" className="video-only-exit" onClick={closePresentationMode}>
              Exit
            </button>
          </div>,
          document.body
        )}
    </>
  );
}