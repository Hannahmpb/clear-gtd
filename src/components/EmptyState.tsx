export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card">
      <div className="empty">
        <div className="big">{icon}</div>
        <div className="t">{title}</div>
        <div className="d">{desc}</div>
      </div>
    </div>
  );
}
