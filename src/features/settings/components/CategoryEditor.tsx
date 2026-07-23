import { Trash2 } from "lucide-react";
import type { CategoryConfig } from "../../../domain/questionnaire.types";

export function CategoryEditor({
  category,
  onChange,
  onRemove,
}: {
  category: CategoryConfig;
  onChange: (patch: Partial<CategoryConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="config-category">
      <label>
        Name
        <input
          value={category.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>
      <label>
        Description
        <input
          value={category.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={category.active}
          onChange={(event) => onChange({ active: event.target.checked })}
        />
        Active
      </label>
      <button
        className="icon danger"
        title="Remove from the next version"
        onClick={onRemove}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
