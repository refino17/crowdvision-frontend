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

export default function CameraHealthGrid({
  cameraHealth,
  activeCameraProfile,
  switchCameraProfile
}) {
  const cameras = cameraHealth?.cameras || [];
  const activeCamera =
    cameras.find((camera) => camera.active) ||
    cameras.find((camera) => camera.key === activeCameraProfile) ||
    null;

  const activeTracking = activeCamera?.tracking || cameraHealth?.tracking || {};
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
          <strong>{cameras.filter((camera) => camera.online).length}</strong>
        </div>
        <div>
          <span>Total Sources</span>
          <strong>{cameras.length}</strong>
        </div>
        <div>
          <span>Duplicates Blocked</span>
          <strong>{numberValue(activeTracking.duplicates_prevented)}</strong>
        </div>
      </div>

      <div className="multi-camera-grid camera-grid-compact">
        {cameras.slice(0, 8).map((camera) => {
          const isActive = Boolean(camera.active || camera.key === activeCameraProfile);
          const isOnline = Boolean(camera.online);
          const hasPreview = Boolean(camera.preview_url);
          const previewSource = camera.preview_url || (isActive ? VIDEO_STREAM_URL : "");

          const tracking = camera.tracking || {};
          const uniquePeople = numberValue(tracking.session_unique_people);
          const activeTracks = numberValue(tracking.active_tracks);
          const reidentifiedPeople = numberValue(tracking.reidentified_people);
          const duplicatesPrevented = numberValue(tracking.duplicates_prevented);

          return (
            <article
              className={`camera-tile source-tile ${isActive ? "active is-current" : ""} ${isOnline ? "online" : "standby"}`}
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