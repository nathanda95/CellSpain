import { X } from "lucide-react";
import type { Status, Verbatim } from "../feedback.types";
import { dateLabel } from "../../../shared/utils/date";
import { Select } from "../../../shared/ui/Select";

export function VerbatimDetails({
  item,
  onClose,
  onSave,
}: {
  item: Verbatim;
  onClose: () => void;
  onSave: (patch: Partial<Verbatim>) => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose}>
          <X />
        </button>
        <span className={`sentiment ${item.sentiment?.toLowerCase()}`}>
          {item.sentiment ?? "Score unavailable"}
        </span>
        <h2>Comment details</h2>
        <blockquote>“{item.content}”</blockquote>
        <dl>
          <dt>Question</dt>
          <dd>{item.question}</dd>
          <dt>Source</dt>
          <dd>
            {item.source} · {item.sheet}
          </dd>
          <dt>Category</dt>
          <dd>{item.category}</dd>
          <dt>Score</dt>
          <dd>{item.score ? `${item.score}/4` : "Unavailable"}</dd>
          <dt>Date</dt>
          <dd>{dateLabel(item.date)}</dd>
        </dl>
        <label>
          Local status
          <Select
            value={item.status}
            onChange={(status) => onSave({ status: status as Status })}
            options={["New", "To review", "Done", "Ignored"]}
          />
        </label>
        <label>
          Internal note
          <textarea
            value={item.note}
            onChange={(event) => onSave({ note: event.target.value })}
            placeholder="Private note stored on this device…"
          />
        </label>
      </section>
    </div>
  );
}
