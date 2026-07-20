import { describe, expect, it } from "vitest";
import { parseWorkbook } from "./file.service";
import { createQuestionnaireVersion } from "../settings/questionnaire.service";
import { createInitialQuestionnaire, DEFAULT_SCORE_MAPPING, type QuestionConfig } from "../settings/questionnaire.types";

const configuredVersion = (required = true) => {
  const initial = createInitialQuestionnaire();
  const question: QuestionConfig = {
    stableKey: "manager_trust",
    label: "Do you trust your manager?",
    sourceColumn: "Manager trust",
    categoryKey: "pom",
    responseType: "rating",
    required,
    active: true,
    scoreMapping: DEFAULT_SCORE_MAPPING,
  };
  return createQuestionnaireVersion(initial, initial.categories, [question]);
};

const jsonFile = (rows: Record<string, unknown>[]) =>
  new File([JSON.stringify(rows)], "survey.json", { type: "application/json" });

describe("configured imports", () => {
  it("snapshots the configuration, stable question key, label and category", async () => {
    const config = configuredVersion();
    const result = await parseWorkbook(jsonFile([{ "Manager trust": "top!" }]), "import-1", config);
    expect(result.answers[0]).toMatchObject({
      score: 4,
      question: "Do you trust your manager?",
      questionKey: "manager_trust",
      category: "POM",
      configurationVersionId: config.id,
    });
  });

  it("uses the configured category when the workbook header only differs in formatting", async () => {
    const config = configuredVersion();
    config.categories.push({ stableKey: "test", name: "Test", active: true });
    config.questions[0].categoryKey = "test";

    const result = await parseWorkbook(
      jsonFile([{ "  MANAGER   TRUST ": "top!" }]),
      "import-formatted-header",
      config,
    );

    expect(result.answers).toHaveLength(1);
    expect(result.answers[0]).toMatchObject({
      questionKey: "manager_trust",
      category: "Test",
    });
    expect(result.warnings).toEqual([]);
  });

  it("accepts an Excel column reference as the configured source column", async () => {
    const config = configuredVersion();
    config.categories.push({ stableKey: "test", name: "Test", active: true });
    config.questions[0].sourceColumn = "B";
    config.questions[0].categoryKey = "test";

    const result = await parseWorkbook(
      jsonFile([{
        ID: "respondent-1",
        "Would you say that your POM is accessible and attentive?": "great",
      }]),
      "import-excel-reference",
      config,
    );

    expect(result.answers).toHaveLength(1);
    expect(result.answers[0]).toMatchObject({
      questionKey: "manager_trust",
      category: "Test",
      score: 4,
    });
  });

  it("blocks an import when a required column is absent", async () => {
    await expect(parseWorkbook(jsonFile([{ Unknown: "top" }]), "import-2", configuredVersion()))
      .rejects.toThrow("Missing required column: Manager trust");
  });

  it("warns without blocking for unknown columns", async () => {
    const result = await parseWorkbook(
      jsonFile([{ "Manager trust": "ok", "New workload question": "text" }]),
      "import-3",
      configuredVersion(),
    );
    expect(result.answers).toHaveLength(1);
    expect(result.warnings[0]).toContain("New workload question");
  });

  it("keeps built-in survey and respondent columns without requiring configuration", async () => {
    const standardColumns = [
      "ID", "Email", "Name", "Last modified time",
      "How long have you been working at the company?",
      "How would you rate the work atmosphere at Sharp DX?",
      "Do the missions offered by Sharp DX meet your expectations?",
      "What do you particularly appreciate in the missions you work on at Sharp DX? ",
      "What mainly explains your dissatisfaction? ",
      "If you want to elaborate, you can do so here",
      "Are you satisfied with internal events (Kick-off, Summer Party, Winter Party, Connect, etc.)?",
      "What could be improved, in your opinion? ",
      "Would you say that Sharp DX helps you grow professionally?",
      "What is holding you back today? ",
      "Are you satisfied with your compensation level?",
      "Would you say that your POM is accessible and attentive?",
      "What is the main issue, in your opinion? ",
      "Do you have sufficient material resources to do your job properly?",
      "What is mainly missing for you? ",
      "Are you proud to belong to Sharp DX?",
      "If you wish to explain your answer, you can do so here ",
      "From your perspective, which areas should be our mains focus for improvement? (Please rank each area from highest to lowest focus)",
      "Would you say that your overall situation is improving?",
      "Would you like to be contacted by HR to discuss further?",
      "Who are you? ", "Survey quarter", "Test respondent ID",
    ];
    const config = configuredVersion(false);
    const row = Object.fromEntries(standardColumns.map((column) => [column, ""]));
    const result = await parseWorkbook(jsonFile([row]), "import-standard", config);
    expect(result.warnings).toEqual([]);
  });
});
