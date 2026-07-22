import { describe, expect, it } from "vitest";
import { createQuestionnaireVersion, exportQuestionnaire, importQuestionnaire, resetQuestionnaire, validateQuestionnaire } from "./questionnaire.service";
import { createInitialQuestionnaire, DEFAULT_SCORE_MAPPING, type QuestionConfig } from "./questionnaire.types";

const question = (categoryKey = "work_environment"): QuestionConfig => ({
  stableKey: "work_atmosphere",
  label: "Work atmosphere",
  sourceColumn: "How is the atmosphere?",
  categoryKey,
  responseType: "rating",
  active: true,
  scoreMapping: DEFAULT_SCORE_MAPPING,
});

describe("questionnaire versioning", () => {
  it("creates an immutable new version when a question category changes", () => {
    const initial = createInitialQuestionnaire();
    const versionA = createQuestionnaireVersion(initial, initial.categories, [question()]);
    const versionB = createQuestionnaireVersion(versionA, versionA.categories, [question("missions")]);

    expect(versionB.version).toBe(versionA.version + 1);
    expect(versionB.id).not.toBe(versionA.id);
    expect(versionA.questions[0].categoryKey).toBe("work_environment");
    expect(versionB.questions[0].categoryKey).toBe("missions");
  });

  it("rejects duplicate stable keys and ambiguous active columns", () => {
    const initial = createInitialQuestionnaire();
    const duplicate = { ...question(), stableKey: "another_key" };
    expect(validateQuestionnaire(initial.categories, [question(), duplicate])).toEqual(
      expect.arrayContaining(["Two active questions cannot use the same source column."]),
    );
  });

  it("exports and imports a valid configuration as a new version", () => {
    const initial = createInitialQuestionnaire();
    const configured = createQuestionnaireVersion(initial, initial.categories, [question()]);
    const imported = importQuestionnaire(exportQuestionnaire(configured), configured);

    expect(imported.version).toBe(configured.version + 1);
    expect(imported.id).not.toBe(configured.id);
    expect(imported.questions).toEqual(configured.questions);
  });

  it("rejects malformed imports", () => {
    expect(() => importQuestionnaire("not json", createInitialQuestionnaire()))
      .toThrow("not valid JSON");
  });

  it("resets to a new legacy automatic-detection version", () => {
    const configured = createQuestionnaireVersion(createInitialQuestionnaire(), [], []);
    const reset = resetQuestionnaire(configured);

    expect(reset.version).toBe(configured.version + 1);
    expect(reset.legacyAutoDetect).toBe(true);
    expect(reset.categories.length).toBeGreaterThan(0);
  });
});
