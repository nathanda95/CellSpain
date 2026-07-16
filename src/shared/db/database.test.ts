import { beforeEach, describe, expect, it } from "vitest";
import { loadDataset, saveDataset } from "./database";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
});

describe("dataset persistence and migration", () => {
  beforeEach(() => values.clear());

  it("creates a legacy version and associates existing imports without changing results", () => {
    localStorage.setItem("cellspain-data", JSON.stringify({
      answers: [{ question: "Atmosphere", category: "Work environment", score: 4 }],
      verbatims: [],
      imports: [{ id: "old", name: "old.xlsx", size: 1, importedAt: "2025-01-01", status: "Completed", rows: 1, verbatims: 0 }],
    }));
    const migrated = loadDataset();
    expect(migrated.answers[0].category).toBe("Work environment");
    expect(migrated.questionnaireVersions).toHaveLength(1);
    expect(migrated.imports[0].configurationVersionId).toBe(migrated.questionnaireVersions[0].id);
  });

  it("retains questionnaire versions after a simulated restart", () => {
    const dataset = loadDataset();
    saveDataset(dataset);
    expect(loadDataset().questionnaireVersions[0].id).toBe(dataset.questionnaireVersions[0].id);
  });
});
