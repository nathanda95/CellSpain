import type { ImportItem } from "./dataset.types";
import type { Answer, Verbatim } from "./survey.types";

export function belongsToImport(
  item: Answer | Verbatim,
  target: ImportItem,
  imports: ImportItem[],
): boolean {
  if (item.importId) return item.importId === target.id;
  if (item.source === target.name) return true;

  const completedImports = imports.filter((item) => item.status === "Completed");
  return completedImports.length === 1 && completedImports[0].id === target.id;
}
