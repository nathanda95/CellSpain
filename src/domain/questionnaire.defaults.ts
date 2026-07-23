import type { QuestionnaireConfig } from "./questionnaire.types";

export const DEFAULT_SCORE_MAPPING: Record<string, number> = {
  "no way": 1,
  meh: 2,
  bof: 2,
  ok: 3,
  great: 4,
  top: 4,
  "top!": 4,
};

const DEFAULT_CATEGORIES = [
  ["work_environment", "Work environment"],
  ["missions", "Missions"],
  ["events", "Events"],
  ["development", "Development"],
  ["salary", "Salary"],
  ["pom", "POM"],
  ["material", "Material"],
  ["proudness", "Proudness"],
] as const;

export const createInitialQuestionnaire = (): QuestionnaireConfig => ({
  id: "questionnaire-v1-legacy",
  version: 1,
  createdAt: new Date().toISOString(),
  active: true,
  legacyAutoDetect: true,
  categories: DEFAULT_CATEGORIES.map(([stableKey, name]) => ({
    stableKey,
    name,
    active: true,
  })),
  questions: [],
});
