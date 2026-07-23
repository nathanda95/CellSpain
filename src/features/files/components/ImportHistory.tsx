import { Fragment } from "react";
import { AlertCircle, CheckCircle2, FileText, Trash2 } from "lucide-react";
import type { ImportItem } from "../file.types";
import { dateLabel } from "../../../shared/utils/date";
import { EmptyState } from "../../../shared/ui/EmptyState";

export function ImportHistory({
  imports,
  onRemove,
}: {
  imports: ImportItem[];
  onRemove: (item: ImportItem) => void;
}) {
  return (
    <section className="recent">
      <div>
        <h2>Recent imports</h2>
        <span>
          {imports.length} file{imports.length !== 1 ? "s" : ""}
        </span>
      </div>
      {!imports.length ? (
        <EmptyState
          title="No imported files yet"
          detail="Your successful imports will appear here."
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>File name</th>
              <th>Status</th>
              <th>Imported</th>
              <th>Size</th>
              <th>Rows</th>
              <th>Verbatims</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((item) => (
              <Fragment key={item.id}>
                <tr>
                  <td>
                    <FileText size={17} />
                    {item.name}
                  </td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status === "Completed" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}{" "}
                      {item.status}
                    </span>
                  </td>
                  <td>{dateLabel(item.importedAt)}</td>
                  <td>{(item.size / 1024).toFixed(1)} KB</td>
                  <td>{item.rows}</td>
                  <td>{item.verbatims}</td>
                  <td>
                    <button
                      className="icon danger"
                      title={`Remove ${item.name}`}
                      onClick={() => onRemove(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
                {item.warnings?.length ? (
                  <tr className="import-warning">
                    <td colSpan={7}>{item.warnings.join(" · ")}</td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
