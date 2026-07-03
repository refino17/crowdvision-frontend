import Badge from "../components/common/Badge";
import SectionHead from "../components/common/SectionHead";
import { formatModeLabel, formatSourceLabel } from "../utils/display";

export default function SettingsPage({ data }) {
  const { engineStatus, performanceStatus, performanceMessage, updatePerformanceMode, startEngine, stopEngine, restartEngine, profileMessage } = data;
  return (
    <>
      <section className="page-title-panel">
        <p className="section-kicker">System Settings</p>
        <h1>Engine & Performance</h1>
        <p>Control the AI engine and choose AUTO, LOW, BALANCED, HIGH, or ULTRA performance modes.</p>
      </section>

      <section className="panel engine-control">
        <SectionHead kicker="AI Engine Control" title="Monitoring Control Center" badge={<Badge value={engineStatus.running ? "Running" : "Stopped"} type={engineStatus.running ? "running" : "stopped"} />} />
        <div className="engine-grid">
          <div className="engine-card"><span>Status</span><strong>{engineStatus.running ? "Running" : "Stopped"}</strong></div>
          <div className="engine-card"><span>Process ID</span><strong>{engineStatus.pid || "None"}</strong></div>
          <div className="engine-card"><span>Active Source</span><strong>{formatSourceLabel(engineStatus.active_profile)}</strong></div>
          <div className="engine-card"><span>Mode</span><strong>{formatModeLabel(engineStatus.mode || "low_resource_web")}</strong></div>
        </div>
        <div className="engine-actions">
          <button type="button" onClick={startEngine} disabled={engineStatus.running}>Start Monitoring</button>
          <button type="button" onClick={stopEngine} disabled={!engineStatus.running} className="stop-button">Stop Monitoring</button>
          <button type="button" onClick={restartEngine} className="restart-button">Restart Monitoring</button>
        </div>
        {profileMessage && <div className="profile-message">{profileMessage}</div>}
      </section>

      <section className="panel performance-control">
        <SectionHead kicker="System Performance" title="Auto Performance Detection" badge={<Badge value={performanceStatus?.resolved_mode || engineStatus.mode || "AUTO"} type="performance" />} />
        <div className="performance-grid">
          <div className="performance-card"><span>Selected Mode</span><strong>{performanceStatus?.selected_mode || engineStatus.selected_mode || "AUTO"}</strong></div>
          <div className="performance-card"><span>Recommended Mode</span><strong>{performanceStatus?.recommended_mode || engineStatus.recommended_mode || "LOW"}</strong></div>
          <div className="performance-card"><span>Resolved Mode</span><strong>{performanceStatus?.resolved_mode || engineStatus.mode || "LOW"}</strong></div>
          <div className="performance-card"><span>RAM</span><strong>{performanceStatus?.system?.ram_gb ?? engineStatus.system?.ram_gb ?? "?"} GB</strong></div>
          <div className="performance-card"><span>Available RAM</span><strong>{performanceStatus?.system?.available_ram_gb ?? engineStatus.system?.available_ram_gb ?? "?"} GB</strong></div>
          <div className="performance-card"><span>CPU Cores</span><strong>{performanceStatus?.system?.cpu_cores ?? engineStatus.system?.cpu_cores ?? "?"}</strong></div>
          <div className="performance-card"><span>GPU</span><strong>{performanceStatus?.system?.gpu_available ? "Detected" : "Not detected"}</strong></div>
          <div className="performance-card"><span>GPU Name</span><strong>{performanceStatus?.system?.gpu_name || "Not detected"}</strong></div>
        </div>
        <div className="performance-actions">
          {["AUTO", "LOW", "BALANCED", "HIGH", "ULTRA"].map((mode) => (
            <button type="button" key={mode} onClick={() => updatePerformanceMode(mode)} className={(performanceStatus?.selected_mode || "AUTO") === mode ? "performance-active" : ""}>{mode}</button>
          ))}
        </div>
        {performanceMessage && <div className="performance-message">{performanceMessage}</div>}
      </section>
    </>
  );
}
