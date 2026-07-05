import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
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
  if (!worker?.metadata?.detect_enabled) return "Standard";
  return worker?.online ? "Active" : "Enabled";
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
  const peopleLabel = online ? "People Detected" : "Last Detected";
  const crowdLabel = online ? "Crowd Level" : "Last Crowd Level";
  const signalLabel = online ? "Camera Signal" : "Last Camera Signal";

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
        <EdgeMetric label={peopleLabel} value={camera?.people ?? camera?.total_people ?? 0} tone="green" />
        <EdgeMetric label={crowdLabel} value={camera?.density || "Unknown"} tone={densityTone} />
        <EdgeMetric label="Camera Status" value={connectionLabel(camera)} tone={online ? "green" : processRunning ? "yellow" : "default"} />
        <EdgeMetric label="AI Analysis" value={analysisStatus(camera)} tone={camera?.metadata?.detect_enabled ? "purple" : "default"} />
      </div>

      <div className="edge-worker-integrity">
        <div>
          <span>{signalLabel}</span>
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
              <EdgeMetric label={activeSelectedCamera?.online ? "People Detected" : "Last Detected"} value={activeSelectedCamera?.people ?? 0} tone="green" />
              <EdgeMetric label={activeSelectedCamera?.online ? "Crowd Level" : "Last Crowd Level"} value={activeSelectedCamera?.density || "Unknown"} tone={String(activeSelectedCamera?.density || "unknown").toLowerCase()} />
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


export default function SourcesPage({ data = {} }) {
  const {
    cameraProfiles = [],
    activeCameraProfile,
    profileMessage,
    sourceMessage,
    newSourceType,
    setNewSourceType,
    newSourceName,
    setNewSourceName,
    deviceIndex,
    setDeviceIndex,
    streamUrl,
    setStreamUrl,
    setVideoFile,
    switchCameraProfile,
    createDeviceSource,
    createStreamSource,
    uploadVideoSource,
    deleteSource,
    fetchDashboardData,
  } = data;

  function updateSourceType(value) {
    setNewSourceType?.(value);

    const defaultNames = {
      webcam: "Laptop Webcam",
      usb_camera: "USB Camera",
      uploaded_video: "Uploaded Video",
      phone_camera: "Phone Camera",
      ip_camera: "IP Camera",
      rtsp_camera: "CCTV / RTSP Camera",
      drone_stream: "Drone Stream",
    };

    setNewSourceName?.(defaultNames[value] || "Camera Source");
  }

  const activeSourceLabel = formatSourceLabel(activeCameraProfile || "No source");

  return (
    <>
      <section className="page-title-panel camera-network-page-title">
        <p className="section-kicker">Camera Operations</p>
        <h1>Camera Network</h1>
        <p>
          Choose the main camera for full CrowdVision analysis and manage optional remote cameras
          that can report to the command center at the same time.
        </p>
      </section>

      <section className="camera-architecture-guide">
        <article className="camera-architecture-card primary">
          <span>01</span>
          <div>
            <p className="section-kicker">Primary Analysis</p>
            <h2>Main Monitoring Source</h2>
            <p>
              One selected camera receives the complete CrowdVision intelligence pipeline:
              advanced detection, tracking, zones, incidents, anomalies, evidence, and reports.
            </p>
          </div>
        </article>

        <article className="camera-architecture-card remote">
          <span>02</span>
          <div>
            <p className="section-kicker">Connected Monitoring</p>
            <h2>Remote Camera Network</h2>
            <p>
              Additional cameras can operate simultaneously and send live status, people counts,
              crowd level, camera health, and preview images to the command center.
            </p>
          </div>
        </article>
      </section>

      <section className="panel source-manager camera-source-manager-primary">
        <SectionHead
          kicker="Primary Monitoring"
          title="Main Camera Source"
          badge={<Badge value={activeSourceLabel} type="source" />}
        />

        <p className="camera-source-manager-copy">
          The source selected here is the camera used by the main Monitoring page. Only one main source
          is analyzed at a time, but you can switch between saved cameras whenever needed.
        </p>

        <div className="source-help-grid">
          <div><strong>Phone Camera</strong><p>Use a phone camera app and paste its approved video URL.</p></div>
          <div><strong>USB Camera</strong><p>Use device index 1 or 2. The laptop webcam is usually index 0.</p></div>
          <div><strong>CCTV / Drone</strong><p>Use an RTSP or stream URL from the camera, recorder, or controller.</p></div>
          <div><strong>Video File</strong><p>Upload a supported video and select it for full CrowdVision analysis.</p></div>
        </div>

        <div className="source-builder">
          <div className="source-field">
            <label>Source Type</label>
            <select value={newSourceType || "webcam"} onChange={(event) => updateSourceType(event.target.value)}>
              <option value="webcam">Laptop Webcam</option>
              <option value="usb_camera">USB Camera</option>
              <option value="uploaded_video">Uploaded Video File</option>
              <option value="phone_camera">Phone Camera URL</option>
              <option value="ip_camera">IP Camera URL</option>
              <option value="rtsp_camera">CCTV / RTSP Camera</option>
              <option value="drone_stream">Drone Stream</option>
            </select>
          </div>

          <div className="source-field">
            <label>Camera Name</label>
            <input
              type="text"
              value={newSourceName || ""}
              onChange={(event) => setNewSourceName?.(event.target.value)}
              placeholder="Example: Front Entrance Camera"
            />
          </div>

          {(newSourceType === "webcam" || newSourceType === "usb_camera") && (
            <div className="source-field">
              <label>Device Index</label>
              <input
                type="number"
                value={deviceIndex ?? 0}
                onChange={(event) => setDeviceIndex?.(event.target.value)}
                placeholder="0 for laptop webcam, 1 for USB camera"
              />
            </div>
          )}

          {["phone_camera", "ip_camera", "rtsp_camera", "drone_stream"].includes(newSourceType) && (
            <div className="source-field source-wide">
              <label>Camera Stream URL</label>
              <input
                type="text"
                value={streamUrl || ""}
                onChange={(event) => setStreamUrl?.(event.target.value)}
                placeholder="http://camera-address/video or rtsp://camera-address/stream"
              />
            </div>
          )}

          {newSourceType === "uploaded_video" && (
            <div className="source-field source-wide">
              <label>Video File</label>
              <input
                type="file"
                accept="video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,video/webm"
                onChange={(event) => setVideoFile?.(event.target.files?.[0] || null)}
              />
            </div>
          )}
        </div>

        <div className="source-actions">
          {(newSourceType === "webcam" || newSourceType === "usb_camera") && (
            <button type="button" onClick={createDeviceSource}>Add Camera Device</button>
          )}
          {["phone_camera", "ip_camera", "rtsp_camera", "drone_stream"].includes(newSourceType) && (
            <button type="button" onClick={createStreamSource}>Add Camera Stream</button>
          )}
          {newSourceType === "uploaded_video" && (
            <button type="button" onClick={uploadVideoSource}>Upload & Select Video</button>
          )}
        </div>

        {sourceMessage && <div className="source-message">{sourceMessage}</div>}
        {profileMessage && <div className="profile-message">{profileMessage}</div>}

        <div className="source-list">
          {(cameraProfiles || []).map((profile) => (
            <article className={`source-card ${profile.active ? "active" : ""}`} key={profile.key}>
              <div>
                <span>{formatSourceLabel(profile.source_type || "camera")}</span>
                <h3>{profile.name}</h3>
                <p>{profile.source}</p>
                <p>Monitoring zones: {profile.zones}</p>
              </div>

              <div className="source-card-actions">
                <button
                  type="button"
                  onClick={() => switchCameraProfile?.(profile.key)}
                  disabled={profile.active}
                >
                  {profile.active ? "Main Source" : "Use as Main Source"}
                </button>

                {! ["webcam", "crowd_video"].includes(profile.key) && (
                  <button
                    type="button"
                    className="delete-source-button"
                    onClick={() => deleteSource?.(profile.key)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <RemoteCameraNetwork fetchDashboardData={fetchDashboardData} />
    </>
  );
}