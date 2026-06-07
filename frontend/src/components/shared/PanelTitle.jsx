export function PanelTitle({ icon, title, subtitle }) {
  return (
    <div className="panel-title">
      <span className="panel-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
