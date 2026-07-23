import { describe, expect, it } from "vitest";
import { createQuestionnaireVersion } from "../features/settings/questionnaire.service";
import {
  createInitialQuestionnaire,
  DEFAULT_SCORE_MAPPING,
} from "../features/settings/questionnaire.types";
import { datasetReducer } from "./dataset.reducer";
import { EMPTY_DATASET, type ImportItem } from "./dataset.types";
import type { Answer } from "./survey.types";

const completedImport = (
  id: string,
  configurationVersionId: string,
): ImportItem => ({
  id,
  name: `${id}.json`,
  size: 1,
  importedAt: "2026-01-01T00:00:00.000Z",
  status: "Completed",
  rows: 1,
  verbatims: 0,
  configurationVersionId,
});

const answer = (category: string): Answer => ({
  question: "Question",
  category,
  score: 4,
});

describe("dataset questionnaire history", () => {
  it("keeps old imports bound to their questionnaire version after a new version is activated", () => {
    const initial = createInitialQuestionnaire();
    const versionA = createQuestionnaireVersion(initial, initial.categories, [{
      stableKey: "q1",
      label: "Question",
      sourceColumn: "Question",
      categoryKey: "work_environment",
      responseType: "rating",
      active: true,
      scoreMapping: DEFAULT_SCORE_MAPPING,
    }]);
    const versionB = createQuestionnaireVersion(versionA, versionA.categories, [{
      ...versionA.questions[0],
      categoryKey: "missions",
    }]);

    let state = {
      ...structuredClone(EMPTY_DATASET),
      questionnaireVersions: [{ ...versionA, active: true }],
    };
    state = datasetReducer(state, {
      type: "IMPORT_COMPLETED",
      item: completedImport("import-a", versionA.id),
      answers: [answer("Work environment")],
      verbatims: [],
    });
    state = datasetReducer(state, {
      type: "QUESTIONNAIRE_ACTIVATED",
      questionnaire: versionB,
    });
    state = datasetReducer(state, {
      type: "IMPORT_COMPLETED",
      item: completedImport("import-b", versionB.id),
      answers: [answer("Missions")],
      verbatims: [],
    });

    expect(state.answers[0]).toMatchObject({
      category: "Work environment",
      importId: "import-a",
      configurationVersionId: versionA.id,
    });
    expect(state.answers[1]).toMatchObject({
      category: "Missions",
      importId: "import-b",
      configurationVersionId: versionB.id,
    });
    expect(state.questionnaireVersions.map((version) => version.id)).toEqual([
      versionA.id,
      versionB.id,
    ]);
    expect(state.questionnaireVersions[0].active).toBe(false);
    expect(state.questionnaireVersions[1].active).toBe(true);
  });

  it("uses the import snapshot id as the source of truth for imported data", () => {
    const state = datasetReducer(structuredClone(EMPTY_DATASET), {
      type: "IMPORT_COMPLETED",
      item: completedImport("import-a", "questionnaire-a"),
      answers: [{ ...answer("Work environment"), configurationVersionId: "wrong" }],
      verbatims: [],
    });

    expect(state.answers[0].configurationVersionId).toBe("questionnaire-a");
    expect(state.answers[0].importId).toBe("import-a");
  });
});
