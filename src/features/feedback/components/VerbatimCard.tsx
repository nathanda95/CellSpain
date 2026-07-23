import { Clock3, MessageSquareText } from "lucide-react";
import type { Verbatim } from "../../../domain/survey.types";
import { dateLabel } from "../../../shared/utils/date";

export function VerbatimCard({
  item,
  onOpen,
  compact = false,
}: {
  item: Verbatim;
  onOpen: (verbatim: Verbatim) => void;
  compact?: boolean;
}) {
  return (
    <article className={`verbatim ${compact ? "compact" : ""}`}>
      <div className="verbatim-top">
        <span>
          <MessageSquareText size={18} /> {item.role || "Anonymous respondent"}
        </span>
        <div className="verbatim-badges">
          {item.sentiment && <em className={item.sentiment.toLowerCase()}>{item.sentiment}</em>}
          <span
            className={`verbatim-status status-${(item.status ?? "New")
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {item.status ?? "New"}
          </span>
        </div>
      </div>
      <p>“{item.content}”</p>
      <footer>
        <span>
          <Clock3 size={14} />
          {dateLabel(item.date)} · {item.category}
        </span>
        <button className="primary" onClick={() => onOpen(item)}>
          See details
        </button>
      </footer>
    </article>
  );
}
