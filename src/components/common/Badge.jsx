export default function Badge({ value, type = "" }) {
  return <span className={`badge ${String(type || value).toLowerCase()}`}>{value}</span>;
}
