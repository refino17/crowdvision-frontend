import Badge from "../common/Badge";
import SectionHead from "../common/SectionHead";
import { VIDEO_STREAM_URL } from "../../config/constants";
import { formatSourceLabel } from "../../utils/display";

function numberValue(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function compactStatus(isActive, isOnline, health) {
  if (isActive && isOnline) return health || "Online";
  if (isActive && !isOnline) return health || "Stopped";
  return health || "Standby";
}


const LEGACY_MAIN_SOURCE_KEYS = new Set(["webcam", "crowd_video"]);

function sourceSignature(camera = {}) {
  const source = String(camera?.source ?? "").trim();
  const sourceType = String(camera?.source_type || "camera").toLowerCase();

  if (/^-?\d+$/.test(source) || ["webcam", "usb_camera"].includes(sourceType)) {
    return `device:${source}`;
  }

  if (["phone_camera", "ip_camera", "rtsp_camera", "drone_stream"].includes(sourceType)) {
    return `stream:${source.replace(/\/+$/, "").toLowerCase()}`;
  }

  return `source:${source.toLowerCase()}`;
}

function operatorCameraSources(cameras = [], activeProfile = "") {
  const groups = new Map();

  (cameras || []).forEach((camera) => {
    const signature = sourceSignature(camera);
    const items = groups.get(signature) || [];
    items.push(camera);
    groups.set(signature, items);
  });

  const visible = [];

  groups.forEach((items) => {
    const sorted = [...items].sort((left, right) => {
      const leftActive = Boolean(left?.active || left?.key === activeProfile);
      const rightActive = Boolean(right?.active || right?.key === activeProfile);

      if (leftActive !== rightActive) return leftActive ? -1 : 1;

      const leftLegacy = LEGACY_MAIN_SOURCE_KEYS.has(String(left?.key || ""));
      const rightLegacy = LEGACY_MAIN_SOURCE_KEYS.has(String(right?.key || ""));

      if (leftLegacy !== rightLegacy) return leftLegacy ? 1 : -1;

      return String(left?.name || "").localeCompare(String(right?.name || ""));
    });

    const selected = sorted[0];
    const selectedActive = Boolean(selected?.active || selected?.key === activeProfile);

    if (
      LEGACY_MAIN_SOURCE_KEYS.has(String(selected?.key || "")) &&
      !selectedActive
    ) {
      return;
    }

    visible.push(selected);
  });

  return visible.sort((left, right) => {
    const leftActive = Boolean(left?.active || left?.key === activeProfile);
    const rightActive = Boolean(right?.active || right?.key === activeProfile);

    if (leftActive !== rightActive) return leftActive ? -1 : 1;

    return String(left?.name || "").localeCompare(String(right?.name || ""));
  });
}

export default function CameraHealthGrid({
  cameraHealth,
  activeCameraProfile,
  switchCameraProfile
}) {
  const cameras = cameraHealth?.cameras || [];
  const visibleCameras = operatorCameraSources(cameras, activeCameraProfile);
  const activeCamera =
    cameras.find((camera) => camera.active) ||
    cameras.find((camera) => camera.key === activeCameraProfile) ||
    null;

  const activeTracking = activeCamera?.tracking || cameraHealth?.tracking || {};
  const activeIntegrity = activeCamera?.camera_health || cameraHealth?.camera_health || {};
  const activeSource = formatSourceLabel(
    activeCamera?.name ||
    cameraHealth?.active_profile ||
    activeCameraProfile ||
    "No source"
  );

  return (
    <section className="panel camera-health-panel">
      <SectionHead
        kicker="Camera Health"
        title="Source Status Board"
        badge={
          <Badge
            value={cameraHealth?.active_online ? "Online" : "Standby"}
            type={cameraHealth?.active_online ? "running" : "stopped"}
          />
        }
      />

      <div className="camera-health-summary-row">
        <div>
          <span>Active Source</span>
          <strong>{activeSource}</strong>
        </div>
        <div>
          <span>Online Cameras</span>
          <strong>{visibleCameras.filter((camera) => camera.online).length}</strong>
        </div>
        <div>
          <span>Total Sources</span>
          <strong>{visibleCameras.length}</strong>
        </div>
        <div>
          <span>Duplicates Blocked</span>
          <strong>{numberValue(activeTracking.duplicates_prevented)}</strong>
        </div>
        <div>
          <span>Integrity</span>
          <strong>{activeIntegrity?.tamper_detected ? "Warning" : (activeIntegrity?.signal_quality || "Good")}</strong>
        </div>
      </div>

      <div className="multi-camera-grid camera-grid-compact">
        {visibleCameras.slice(0, 8).map((camera) => {
          const isActive = Boolean(camera.active || camera.key === activeCameraProfile);
          const isOnline = Boolean(camera.online);
          const hasPreview = Boolean(camera.preview_url);
          const previewSource = camera.preview_url || (isActive ? VIDEO_STREAM_URL : "");

          const tracking = camera.tracking || {};
          const uniquePeople = numberValue(tracking.session_unique_people);
          const activeTracks = numberValue(tracking.active_tracks);
          const reidentifiedPeople = numberValue(tracking.reidentified_people);
          const duplicatesPrevented = numberValue(tracking.duplicates_prevented);
          const integrity = camera.camera_health || {};
          const tamperDetected = Boolean(integrity.tamper_detected);

          return (
            <article
              className={`camera-tile source-tile ${isActive ? "active is-current" : ""} ${isOnline ? "online" : "standby"} ${tamperDetected ? "tamper-warning" : ""}`}
              key={camera.key}
            >
              <div className="camera-tile-head">
                <span>{formatSourceLabel(camera.source_type || camera.key || "camera")}</span>
                <Badge
                  value={compactStatus(isActive, isOnline, camera.health)}
                  type={isOnline ? "running" : "stopped"}
                />
              </div>

              <div className={`camera-preview-box ${isActive && !isOnline ? "preview-paused" : ""}`}>
                {previewSource || hasPreview ? (
                  <>
                    <img
                      src={previewSource}
                      alt={camera.name || "Camera source"}
                      className="camera-preview-image"
                      loading={isActive ? "eager" : "lazy"}
                      decoding="async"
                    />

                    {isActive && !isOnline && (
                      <div className="camera-preview-overlay">
                        Last Frame
                      </div>
                    )}

                    {isActive && isOnline && (
                      <div className="camera-live-ribbon">
                        Active Source
                      </div>
                    )}
                  </>
                ) : (
                  <div className="camera-placeholder">
                    {isActive ? "Waiting" : "Standby"}
                  </div>
                )}
              </div>

              <div className="camera-tile-body">
                <h3>{camera.name || "Camera Source"}</h3>
                <p>{camera.source || "No source path"}</p>

                <div className="camera-mini-metrics">
                  <span>
                    People <strong>{camera.people ?? 0}</strong>
                  </span>

                  <span>
                    Density <strong>{camera.density || "Unknown"}</strong>
                  </span>

                  <span>
                    FPS <strong>{camera.fps ?? 0}</strong>
                  </span>

                  <span>
                    Integrity <strong>{tamperDetected ? "Warning" : (integrity.signal_quality || "Good")}</strong>
                  </span>

                  <span>
                    Tamper <strong>{integrity.tamper_type || "None"}</strong>
                  </span>
                </div>

                {isActive && (
                  <div className="camera-tracking-chips">
                    <span>Unique <strong>{uniquePeople}</strong></span>
                    <span>Active <strong>{activeTracks}</strong></span>
                    <span>Re-ID <strong>{reidentifiedPeople}</strong></span>
                    <span>Blocked <strong>{duplicatesPrevented}</strong></span>
                  </div>
                )}
              </div>

              <div className="camera-tile-action-row">
                {isActive ? (
                  <span className="source-active-pill">Selected</span>
                ) : (
                  <button type="button" onClick={() => switchCameraProfile(camera.key)}>
                    Use Camera
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}