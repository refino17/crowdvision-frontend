export default function StatCard({ label, value, variant = "" }) {
  return (
    <div className={`card ${variant}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
