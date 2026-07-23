import { FileSpreadsheet } from "lucide-react";

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <FileSpreadsheet size={30} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
