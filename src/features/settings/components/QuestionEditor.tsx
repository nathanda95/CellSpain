import { Trash2 } from "lucide-react";
import type {
  CategoryConfig,
  QuestionConfig,
  ResponseType,
} from "../../../domain/questionnaire.types";

export function QuestionEditor({
  question,
  categories,
  onChange,
  onRemove,
}: {
  question: QuestionConfig;
  categories: CategoryConfig[];
  onChange: (patch: Partial<QuestionConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <article className="question-config">
      <div className="question-fields">
        <label>
          Display label
          <input
            value={question.label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </label>
        <label>
          Expected file column
          <input
            value={question.sourceColumn}
            onChange={(event) => onChange({ sourceColumn: event.target.value })}
          />
        </label>
        <label>
          Category
          <select
            value={question.categoryKey}
            onChange={(event) => onChange({ categoryKey: event.target.value })}
          >
            {categories.map((category) => (
              <option value={category.stableKey} key={category.stableKey}>
                {category.name}{category.active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Response type
          <select
            value={question.responseType}
            onChange={(event) => onChange({
              responseType: event.target.value as ResponseType,
            })}
          >
            <option value="rating">Rating</option>
            <option value="verbatim">Free text / verbatim</option>
          </select>
        </label>
        <div className="question-flags">
          <label className="check">
            <input
              type="checkbox"
              checked={question.active}
              onChange={(event) => onChange({ active: event.target.checked })}
            />
            Active
          </label>
        </div>
      </div>
      <button
        className="icon danger"
        title="Remove from the next version"
        onClick={onRemove}
      >
        <Trash2 size={16} />
      </button>
    </article>
  );
}
