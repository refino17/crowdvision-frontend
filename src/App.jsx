import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./styles/index.css";
import "./styles/v44-system-cleanup.css";

import { API_BASE_URL, DASHBOARD_REFRESH_MS } from "./config/constants";
import MainLayout from "./layouts/MainLayout";

import DashboardPage from "./pages/Dashboard";
import MonitoringPage from "./pages/Monitoring";
import SourcesPage from "./pages/Sources";
import IncidentsPage from "./pages/Incidents";
import AnomaliesPage from "./pages/Anomalies";
import AnalyticsPage from "./pages/Analytics";
import ReportsPage from "./pages/Reports";
import LaunchPage from "./pages/Launch";
import EvidencePage from "./pages/Evidence";
import SettingsPage from "./pages/Settings";
import EventsPage from "./pages/Events";
import ExportsPanel from "./pages/Exports";

function AppShell() {
  const [summary, setSummary] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [latestEvent, setLatestEvent] = useState(null);
  const [latestIncident, setLatestIncident] = useState(null);
  const [incidentSummary, setIncidentSummary] = useState(null);
  const [latestAnomaly, setLatestAnomaly] = useState(null);
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [alertDistribution, setAlertDistribution] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportContent, setSelectedReportContent] = useState("");
  const [cameraProfiles, setCameraProfiles] = useState([]);
  const [activeCameraProfile, setActiveCameraProfile] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [engineStatus, setEngineStatus] = useState({ running: false, pid: null, active_profile: "", mode: "", selected_mode: "", recommended_mode: "" });
  const [performanceStatus, setPerformanceStatus] = useState(null);
  const [performanceMessage, setPerformanceMessage] = useState("");
  const [sourceMessage, setSourceMessage] = useState("");
  const [newSourceType, setNewSourceType] = useState("webcam");
  const [newSourceName, setNewSourceName] = useState("Laptop Webcam");
  const [deviceIndex, setDeviceIndex] = useState("0");
  const [streamUrl, setStreamUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [cameraHealth, setCameraHealth] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [evidence, setEvidence] = useState([]);

  async function openReport(filename) {
    setSelectedReport(filename);
    setSelectedReportContent("Loading report...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error(`Report request failed: ${response.status}`);
      setSelectedReportContent(await response.text());
    } catch (error) {
      console.error("Report preview error:", error);
      setSelectedReportContent(`Unable to load report.\n\n${error.message}`);
    }
  }

  async function switchCameraProfile(profileKey) {
    try {
      setProfileMessage("Updating camera profile...");
      const response = await fetch(`${API_BASE_URL}/api/camera-profiles/${profileKey}/activate`, { method: "POST" });
      if (!response.ok) throw new Error(`Profile update failed: ${response.status}`);
      const data = await response.json();
      setActiveCameraProfile(data.active_profile);
      setProfileMessage(engineStatus.running ? "Camera profile updated. Restart monitoring for the AI engine to use it." : "Camera profile updated. Start monitoring when ready.");
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setProfileMessage("Unable to update camera profile.");
    }
  }

  async function startEngine() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/engine/start`, { method: "POST" });
      const data = await response.json();
      setEngineStatus({ running: data.running, pid: data.pid || null, active_profile: data.active_profile || activeCameraProfile, mode: data.mode || engineStatus.mode, selected_mode: data.selected_mode || engineStatus.selected_mode, recommended_mode: data.recommended_mode || engineStatus.recommended_mode });
      setProfileMessage(data.message);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setProfileMessage("Unable to start AI monitoring engine.");
    }
  }

  async function stopEngine() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/engine/stop`, { method: "POST" });
      const data = await response.json();
      setEngineStatus({ running: false, pid: null, active_profile: activeCameraProfile, mode: engineStatus.mode, selected_mode: engineStatus.selected_mode, recommended_mode: engineStatus.recommended_mode });
      setProfileMessage(data.message);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setProfileMessage("Unable to stop AI monitoring engine.");
    }
  }

  async function restartEngine() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/engine/restart`, { method: "POST" });
      const data = await response.json();
      setEngineStatus({ running: data.running, pid: data.pid || null, active_profile: data.active_profile || activeCameraProfile, mode: data.mode || engineStatus.mode, selected_mode: data.selected_mode || engineStatus.selected_mode, recommended_mode: data.recommended_mode || engineStatus.recommended_mode });
      setProfileMessage(data.message);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setProfileMessage("Unable to restart AI monitoring engine.");
    }
  }

  async function updatePerformanceMode(mode) {
    try {
      setPerformanceMessage("Updating performance mode...");
      const response = await fetch(`${API_BASE_URL}/api/system/performance/${mode}`, { method: "POST" });
      if (!response.ok) throw new Error(`Performance update failed: ${response.status}`);
      const data = await response.json();
      setPerformanceStatus(data.performance);
      setPerformanceMessage(engineStatus.running ? `${data.message}. Restart monitoring to apply it.` : `${data.message}. Start monitoring when ready.`);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setPerformanceMessage("Unable to update performance mode.");
    }
  }

  async function createDeviceSource() {
    try {
      setSourceMessage("Creating camera source...");
      const formData = new FormData();
      formData.append("name", newSourceName || "Camera Device");
      formData.append("device_index", deviceIndex || "0");
      formData.append("source_type", newSourceType);
      const response = await fetch(`${API_BASE_URL}/api/sources/device`, { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.message || `Source creation failed: ${response.status}`);
      setSourceMessage(engineStatus.running ? `${data.message}. Restart monitoring to use it.` : `${data.message}. Start monitoring when ready.`);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setSourceMessage(error.message || "Unable to create device source.");
    }
  }

  async function createStreamSource() {
    try {
      setSourceMessage("Creating stream source...");
      const formData = new FormData();
      formData.append("name", newSourceName || "Stream Camera");
      formData.append("stream_url", streamUrl);
      formData.append("source_type", newSourceType);
      const response = await fetch(`${API_BASE_URL}/api/sources/stream`, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Stream source failed: ${response.status}`);
      const data = await response.json();
      setSourceMessage(engineStatus.running ? `${data.message}. Restart monitoring to use it.` : `${data.message}. Start monitoring when ready.`);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setSourceMessage("Unable to create stream source. Check the URL.");
    }
  }

  async function uploadVideoSource() {
    if (!videoFile) {
      setSourceMessage("Please choose a video file first.");
      return;
    }
    try {
      setSourceMessage("Uploading video...");
      const formData = new FormData();
      formData.append("name", newSourceName || "Uploaded Video");
      formData.append("file", videoFile);
      const response = await fetch(`${API_BASE_URL}/api/sources/video-upload`, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Video upload failed: ${response.status}`);
      const data = await response.json();
      setSourceMessage(engineStatus.running ? `${data.message}. Restart monitoring to analyze it.` : `${data.message}. Start monitoring to analyze it.`);
      setVideoFile(null);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setSourceMessage("Unable to upload video file.");
    }
  }

  async function deleteSource(profileKey) {
    try {
      setSourceMessage("Deleting source...");
      const response = await fetch(`${API_BASE_URL}/api/sources/${profileKey}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      const data = await response.json();
      setSourceMessage(data.message);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setSourceMessage("Unable to delete source.");
    }
  }

  async function fetchDashboardData() {
    try {
      const [healthRes, summaryRes, intelligenceRes, predictionRes, latestRes, eventsRes, chartRes, alertRes, latestIncidentRes, incidentSummaryRes, incidentsRes, latestAnomalyRes, anomalySummaryRes, anomaliesRes, reportsRes, cameraProfilesRes, engineStatusRes, performanceRes, cameraHealthRes, notificationsRes, evidenceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/health`), fetch(`${API_BASE_URL}/api/summary`), fetch(`${API_BASE_URL}/api/intelligence`), fetch(`${API_BASE_URL}/api/prediction`), fetch(`${API_BASE_URL}/api/latest-event`), fetch(`${API_BASE_URL}/api/events`), fetch(`${API_BASE_URL}/api/chart-data`), fetch(`${API_BASE_URL}/api/alert-distribution`), fetch(`${API_BASE_URL}/api/latest-incident`), fetch(`${API_BASE_URL}/api/incident-summary`), fetch(`${API_BASE_URL}/api/incidents`), fetch(`${API_BASE_URL}/api/latest-anomaly`), fetch(`${API_BASE_URL}/api/anomaly-summary`), fetch(`${API_BASE_URL}/api/anomalies`), fetch(`${API_BASE_URL}/api/reports`), fetch(`${API_BASE_URL}/api/camera-profiles`), fetch(`${API_BASE_URL}/api/engine/status`), fetch(`${API_BASE_URL}/api/system/performance`), fetch(`${API_BASE_URL}/api/camera-health`), fetch(`${API_BASE_URL}/api/notifications`), fetch(`${API_BASE_URL}/api/evidence`),
      ]);

      const healthData = await healthRes.json();
      const summaryData = await summaryRes.json();
      const intelligenceData = await intelligenceRes.json();
      const predictionData = await predictionRes.json();
      const latestData = await latestRes.json();
      const eventsData = await eventsRes.json();
      const chartJson = await chartRes.json();
      const alertJson = await alertRes.json();
      const latestIncidentData = await latestIncidentRes.json();
      const incidentSummaryData = await incidentSummaryRes.json();
      const incidentsData = await incidentsRes.json();
      const latestAnomalyData = await latestAnomalyRes.json();
      const anomalySummaryData = await anomalySummaryRes.json();
      const anomaliesData = await anomaliesRes.json();
      const reportsData = await reportsRes.json();
      const cameraProfilesData = await cameraProfilesRes.json();
      const engineStatusData = await engineStatusRes.json();
      const performanceData = await performanceRes.json();
      const cameraHealthData = await cameraHealthRes.json();
      const notificationsData = await notificationsRes.json();
      const evidenceData = await evidenceRes.json();

      setApiStatus(healthData.status || "online");
      setSummary(summaryData); setIntelligence(intelligenceData); setPrediction(predictionData); setLatestEvent(latestData.latest_event);
      setEvents(eventsData.events || []); setChartData(chartJson.chart_data || []); setAlertDistribution(alertJson.alerts || []);
      setLatestIncident(latestIncidentData.latest_incident); setIncidentSummary(incidentSummaryData); setIncidents(incidentsData.incidents || []);
      setLatestAnomaly(latestAnomalyData.latest_anomaly); setAnomalySummary(anomalySummaryData); setAnomalies(anomaliesData.anomalies || []);
      setReports(reportsData.reports || []); setCameraProfiles(cameraProfilesData.profiles || []); setActiveCameraProfile(cameraProfilesData.active_profile || "");
      setEngineStatus(engineStatusData); setPerformanceStatus(performanceData); setCameraHealth(cameraHealthData); setNotifications(notificationsData.notifications || []); setEvidence(evidenceData.evidence || []); setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
      setApiStatus("offline");
    }
  }

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const data = {
    summary, intelligence, prediction, latestEvent, latestIncident, incidentSummary, latestAnomaly, anomalySummary, anomalies, incidents, events, chartData, alertDistribution, reports, selectedReport, selectedReportContent, cameraProfiles, activeCameraProfile, profileMessage, engineStatus, performanceStatus, performanceMessage, sourceMessage, newSourceType, setNewSourceType, newSourceName, setNewSourceName, deviceIndex, setDeviceIndex, streamUrl, setStreamUrl, setVideoFile, apiStatus, lastUpdated, cameraHealth, notifications, evidence, openReport, switchCameraProfile, startEngine, stopEngine, restartEngine, updatePerformanceMode, createDeviceSource, createStreamSource, uploadVideoSource, deleteSource, fetchDashboardData,
  };

  const withLayout = (page) => (
    <MainLayout apiStatus={apiStatus} engineStatus={engineStatus} lastUpdated={lastUpdated}>
      {page}
    </MainLayout>
  );

  return (
    <Routes>
      <Route path="/" element={<LaunchPage data={data} />} />
      <Route path="/dashboard" element={withLayout(<DashboardPage data={data} />)} />
      <Route path="/monitoring" element={withLayout(<MonitoringPage data={data} />)} />
      <Route path="/sources" element={withLayout(<SourcesPage data={data} />)} />
      <Route path="/incidents" element={withLayout(<IncidentsPage data={data} />)} />
      <Route path="/anomalies" element={withLayout(<AnomaliesPage data={data} />)} />
      <Route path="/analytics" element={withLayout(<AnalyticsPage data={data} />)} />
      <Route path="/reports" element={withLayout(<ReportsPage data={data} />)} />
      <Route path="/evidence" element={withLayout(<EvidencePage data={data} />)} />
      <Route path="/settings" element={withLayout(<SettingsPage data={data} />)} />
      <Route path="/exports" element={withLayout(<ExportsPanel />)} />
      <Route path="/events" element={withLayout(<EventsPage data={data} />)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;