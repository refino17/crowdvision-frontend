export default function SectionHead({ kicker, title, action, badge }) {
  return (
    <div className="section-head">
      <div>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2>{title}</h2>
      </div>
      <div className="section-head-actions">
        {badge}
        {action}
      </div>
    </div>
  );
}
