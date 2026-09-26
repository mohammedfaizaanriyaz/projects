export default function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = "violet"
}) {
  return (
    <article
      className={`stat-card stat-card--${accent}`}
    >
      <div className="stat-card__icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}
