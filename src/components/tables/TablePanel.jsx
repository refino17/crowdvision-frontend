import SectionHead from "../common/SectionHead";

export default function TablePanel({ kicker, title, onRefresh, children }) {
  return (
    <section className="panel">
      <SectionHead kicker={kicker} title={title} action={onRefresh ? <button type="button" onClick={onRefresh}>Refresh</button> : null} />
      <div className="table-wrap">{children}</div>
    </section>
  );
}
