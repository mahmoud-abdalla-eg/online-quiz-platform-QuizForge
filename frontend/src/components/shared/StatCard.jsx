export function StatCard({ icon, value, label }) {
  return (
    <article className="stat-card">
      <span>{icon}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </article>
  );
}
