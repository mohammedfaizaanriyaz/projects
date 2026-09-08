export default function Metric({ label, value, detail, icon }) {
  return (
    <article className="metric">
      <div className="metric-icon">{icon}</div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{detail}</small>
      </div>
    </article>
  );
}

// ============================================================
// GOAL CARD
// ============================================================
