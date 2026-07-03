import StatCard from "../components/common/StatCard";
import ChartPanel from "../components/charts/ChartPanel";
import LinePanel from "../components/charts/LinePanel";

export default function AnalyticsPage({ data }) {
  const { chartData, alertDistribution, events, intelligence, prediction } = data;
  return (
    <>
      <section className="page-title-panel">
        <p className="section-kicker">Analytics Center</p>
        <h1>Analytics & Trends</h1>
        <p>Study crowd trends, alerts, occupancy, prediction, anomaly scores, and operational intelligence.</p>
      </section>

      <section className="cards-grid">
        <StatCard label="Average People" value={intelligence?.average_people ?? 0} variant="cyan" />
        <StatCard label="Average Occupancy" value={intelligence?.average_occupancy ?? 0} variant="cyan" />
        <StatCard label="Average Zone Count" value={intelligence?.average_zone_count ?? 0} variant="cyan" />
        <StatCard label="Alert Rate" value={`${intelligence?.alert_rate ?? 0}%`} variant="warning" />
      </section>

      <section className="cards-grid">
        <StatCard label="Predicted People" value={prediction?.predicted_people ?? 0} variant="purple" />
        <StatCard label="Predicted Occupancy" value={prediction?.predicted_occupancy ?? 0} variant="purple" />
        <StatCard label="Risk Trend" value={prediction?.risk_trend || "Stable"} variant={`trend-${String(prediction?.risk_trend || "Stable").toLowerCase()}`} />
        <StatCard label="Event Samples" value={events?.length ?? 0} />
      </section>

      <section className="content-grid"><ChartPanel title="Alert Distribution" type="bar" data={alertDistribution} /><LinePanel title="Anomaly Score Trend" data={chartData} lines={["anomaly_score"]} colors={["#ff4d5f"]} /></section>
      <section className="content-grid"><LinePanel title="Prediction Trend" data={chartData} lines={["predicted_people", "predicted_occupancy"]} colors={["#9b6bff", "#13d9b0"]} /><LinePanel title="Occupancy Trend" data={chartData} lines={["occupancy", "peak_occupancy"]} colors={["#76c80f", "#ff4d5f"]} /></section>
    </>
  );
}
