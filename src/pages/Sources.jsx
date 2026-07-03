import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import { formatSourceLabel } from "../utils/display";

export default function SourcesPage({ data }) {
  const {
    cameraProfiles,
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
  } = data;

  function updateSourceType(value) {
    setNewSourceType(value);
    if (value === "webcam") setNewSourceName("Laptop Webcam");
    if (value === "usb_camera") setNewSourceName("USB Camera");
    if (value === "uploaded_video") setNewSourceName("Uploaded Video");
    if (value === "phone_camera") setNewSourceName("Phone Camera");
    if (value === "ip_camera") setNewSourceName("IP Camera");
    if (value === "rtsp_camera") setNewSourceName("CCTV / RTSP Camera");
    if (value === "drone_stream") setNewSourceName("Drone Stream");
  }

  return (
    <>
      <section className="page-title-panel">
        <p className="section-kicker">Camera Sources</p>
        <h1>Source Manager</h1>
        <p>Add webcam, USB camera, phone camera, CCTV/RTSP, drone stream, or uploaded video sources.</p>
      </section>

      <section className="panel source-manager">
        <SectionHead kicker="Source Manager" title="Video Upload & Camera Source Selection" badge={<Badge value={formatSourceLabel(activeCameraProfile)} type="source" />} />

        <div className="source-help-grid">
          <div><strong>Phone Camera</strong><p>Install IP Webcam or DroidCam, start server, then paste the phone video URL.</p></div>
          <div><strong>USB Camera</strong><p>Use device index 1 or 2. Laptop webcam is usually index 0.</p></div>
          <div><strong>CCTV / Drone</strong><p>Use RTSP/stream URL from the camera, DVR, NVR, or drone controller.</p></div>
          <div><strong>Video File</strong><p>Upload MP4/AVI/MOV/WEBM and start monitoring to analyze it.</p></div>
        </div>

        <div className="source-builder">
          <div className="source-field">
            <label>Source Type</label>
            <select value={newSourceType} onChange={(event) => updateSourceType(event.target.value)}>
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
            <label>Source Name</label>
            <input type="text" value={newSourceName} onChange={(event) => setNewSourceName(event.target.value)} placeholder="Example: Front Entrance Camera" />
          </div>

          {(newSourceType === "webcam" || newSourceType === "usb_camera") && (
            <div className="source-field">
              <label>Device Index</label>
              <input type="number" value={deviceIndex} onChange={(event) => setDeviceIndex(event.target.value)} placeholder="0 for laptop webcam, 1 for USB camera" />
            </div>
          )}

          {["phone_camera", "ip_camera", "rtsp_camera", "drone_stream"].includes(newSourceType) && (
            <div className="source-field source-wide">
              <label>Stream URL</label>
              <input type="text" value={streamUrl} onChange={(event) => setStreamUrl(event.target.value)} placeholder="http://192.168.1.10:8080/video or rtsp://user:pass@ip:554/stream" />
            </div>
          )}

          {newSourceType === "uploaded_video" && (
            <div className="source-field source-wide">
              <label>Video File</label>
              <input type="file" accept="video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,video/webm" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
            </div>
          )}
        </div>

        <div className="source-actions">
          {(newSourceType === "webcam" || newSourceType === "usb_camera") && <button type="button" onClick={createDeviceSource}>Add Camera Device</button>}
          {["phone_camera", "ip_camera", "rtsp_camera", "drone_stream"].includes(newSourceType) && <button type="button" onClick={createStreamSource}>Add Stream Source</button>}
          {newSourceType === "uploaded_video" && <button type="button" onClick={uploadVideoSource}>Upload & Use Video</button>}
        </div>

        {sourceMessage && <div className="source-message">{sourceMessage}</div>}
        {profileMessage && <div className="profile-message">{profileMessage}</div>}

        <div className="source-list">
          {cameraProfiles.map((profile) => (
            <article className={`source-card ${profile.active ? "active" : ""}`} key={profile.key}>
              <div>
                <span>{formatSourceLabel(profile.source_type || profile.key || "camera")}</span>
                <h3>{profile.name}</h3>
                <p>{profile.source}</p>
                <p>Zones: {profile.zones}</p>
              </div>
              <div className="source-card-actions">
                <button type="button" onClick={() => switchCameraProfile(profile.key)} disabled={profile.active}>{profile.active ? "Active" : "Use Source"}</button>
                {! ["webcam", "crowd_video"].includes(profile.key) && <button type="button" className="delete-source-button" onClick={() => deleteSource(profile.key)}>Delete</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
