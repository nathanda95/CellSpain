import type { Dispatch, SetStateAction } from "react";
import type { QuestionnaireConfig } from "../settings/questionnaire.types";
import { createId } from "../../shared/utils/id";
import { belongsToImport, parseWorkbook } from "./file.service";
import type { Dataset, ImportItem } from "./file.types";

export function useImports(
  questionnaire: QuestionnaireConfig,
  setData: Dispatch<SetStateAction<Dataset>>,
) {
  const importFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const base: ImportItem = {
        id: createId(),
        name: file.name,
        size: file.size,
        importedAt: new Date().toISOString(),
        status: "Completed",
        rows: 0,
        verbatims: 0,
      };

      try {
        const parsed = await parseWorkbook(file, base.id, questionnaire);
        setData((current) => ({
          ...current,
          answers: [...current.answers, ...parsed.answers],
          verbatims: [...current.verbatims, ...parsed.verbatims],
          imports: [
            {
              ...base,
              rows: parsed.rows,
              verbatims: parsed.verbatims.length,
              warnings: parsed.warnings,
              configurationVersionId: questionnaire.id,
            },
            ...current.imports,
          ],
        }));
      } catch (error) {
        setData((current) => ({
          ...current,
          imports: [
            {
              ...base,
              status: "Error",
              error: error instanceof Error ? error.message : "Unreadable file",
            },
            ...current.imports,
          ],
        }));
      }
    }
  };

  const removeImport = (item: ImportItem) => {
    const message =
      item.status === "Completed"
        ? `Remove "${item.name}" and its imported data from this dashboard?`
        : `Remove "${item.name}" from the import history?`;
    if (!window.confirm(message)) return;

    setData((current) => ({
      ...current,
      answers:
        item.status === "Completed"
          ? current.answers.filter(
              (answer) => !belongsToImport(answer, item, current.imports),
            )
          : current.answers,
      verbatims:
        item.status === "Completed"
          ? current.verbatims.filter(
              (verbatim) => !belongsToImport(verbatim, item, current.imports),
            )
          : current.verbatims,
      imports: current.imports.filter((existingImport) => existingImport.id !== item.id),
    }));
  };

  return { importFiles, removeImport };
}
