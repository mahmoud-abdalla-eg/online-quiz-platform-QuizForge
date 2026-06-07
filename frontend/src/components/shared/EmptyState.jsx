import { GraduationCap } from "lucide-react";

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <GraduationCap size={30} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
