import type { ImportItem } from "../../domain/dataset.types";
import type { QuestionnaireConfig } from "../../domain/questionnaire.types";
import type { Answer, Verbatim } from "../../domain/survey.types";
import { createId } from "../../shared/utils/id";
import { parseWorkbook } from "./file.service";

export type ImportDatasetActions = {
  completeImport: (item: ImportItem, answers: Answer[], verbatims: Verbatim[]) => void;
  failImport: (item: ImportItem) => void;
  removeImport: (item: ImportItem) => void;
};

export function useImports(
  questionnaire: QuestionnaireConfig,
  actions: ImportDatasetActions,
) {
  const importFiles = async (files: FileList | File[]) => {
    // One user import action is bound to the questionnaire that was active when
    // it started. A settings change during parsing cannot rebind these files.
    const questionnaireSnapshot = structuredClone(questionnaire);

    for (const file of Array.from(files)) {
      const base: ImportItem = {
        id: createId(),
        name: file.name,
        size: file.size,
        importedAt: new Date().toISOString(),
        status: "Completed",
        rows: 0,
        verbatims: 0,
        configurationVersionId: questionnaireSnapshot.id,
      };

      try {
        const parsed = await parseWorkbook(file, base.id, questionnaireSnapshot);
        actions.completeImport(
          {
            ...base,
            rows: parsed.rows,
            verbatims: parsed.verbatims.length,
            warnings: parsed.warnings,
          },
          parsed.answers,
          parsed.verbatims,
        );
      } catch (error) {
        actions.failImport({
          ...base,
          status: "Error",
          error: error instanceof Error ? error.message : "Unreadable file",
        });
      }
    }
  };

  const removeImport = (item: ImportItem) => {
    const message =
      item.status === "Completed"
        ? `Remove "${item.name}" and its imported data from this dashboard?`
        : `Remove "${item.name}" from the import history?`;
    if (!window.confirm(message)) return;
    actions.removeImport(item);
  };

  return { importFiles, removeImport };
}
