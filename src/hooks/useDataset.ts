import { useEffect, useState } from "react";
import type { Dataset } from "../features/files/file.types";
import type { QuestionnaireConfig } from "../features/settings/questionnaire.types";
import type { Verbatim } from "../features/feedback/feedback.types";
import { loadDataset, saveDataset } from "../shared/db/database";

export function useDataset() {
  const [data, setData] = useState<Dataset>(loadDataset);

  useEffect(() => saveDataset(data), [data]);

  const updateVerbatim = (id: string, patch: Partial<Verbatim>) => {
    setData((current) => ({
      ...current,
      verbatims: current.verbatims.map((verbatim) =>
        verbatim.id === id ? { ...verbatim, ...patch } : verbatim,
      ),
    }));
  };

  const activateQuestionnaire = (next: QuestionnaireConfig) => {
    setData((current) => ({
      ...current,
      questionnaireVersions: [
        ...current.questionnaireVersions.map((version) => ({
          ...version,
          active: false,
        })),
        next,
      ],
    }));
  };

  return { data, setData, updateVerbatim, activateQuestionnaire };
}
