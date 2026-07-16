import { EMPTY_DATASET, type Dataset } from "../../features/files/file.types";
import { createInitialQuestionnaire } from "../../features/settings/questionnaire.types";

const STORAGE_KEY = "cellspain-data";

export const loadDataset = (): Dataset => {
  // Une valeur corrompue dans localStorage ne doit pas empêcher l'application
  // de démarrer : elle est traitée comme un jeu de données vide.
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<Dataset> | null;
    const dataset = { ...EMPTY_DATASET, ...(stored ?? {}) } as Dataset;
    if (!dataset.questionnaireVersions?.length) {
      const initial = createInitialQuestionnaire();
      dataset.questionnaireVersions = [initial];
      dataset.imports = dataset.imports.map((item) => ({
        ...item,
        configurationVersionId: item.configurationVersionId ?? initial.id,
      }));
    }
    return dataset;
  } catch {
    return EMPTY_DATASET;
  }
};

export const saveDataset = (dataset: Dataset) => {
  // Toute la persistance reste locale afin de garantir le fonctionnement hors ligne.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
};
