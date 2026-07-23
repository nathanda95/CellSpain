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

  it("creates a legacy version and associates existing data without changing results", () => {
    localStorage.setItem("cellspain-data", JSON.stringify({
      answers: [{ question: "Atmosphere", category: "Work environment", score: 4 }],
      verbatims: [],
      imports: [{ id: "old", name: "old.xlsx", size: 1, importedAt: "2025-01-01", status: "Completed", rows: 1, verbatims: 0 }],
    }));

    const migrated = loadDataset();
    expect(migrated.answers[0].category).toBe("Work environment");
    expect(migrated.questionnaireVersions).toHaveLength(1);
    expect(migrated.imports[0].configurationVersionId).toBe(migrated.questionnaireVersions[0].id);
    expect(migrated.answers[0].configurationVersionId).toBe(migrated.questionnaireVersions[0].id);
  });

  it("uses an import binding to backfill missing historical response metadata", () => {
    localStorage.setItem("cellspain-data", JSON.stringify({
      questionnaireVersions: [
        { id: "v1", version: 1, createdAt: "2025-01-01", active: false, categories: [], questions: [] },
        { id: "v2", version: 2, createdAt: "2026-01-01", active: true, categories: [], questions: [] },
      ],
      imports: [{
        id: "import-v2",
        name: "new.xlsx",
        size: 1,
        importedAt: "2026-01-01",
        status: "Completed",
        rows: 1,
        verbatims: 0,
        configurationVersionId: "v2",
      }],
      answers: [{
        question: "Mission",
        category: "Missions",
        score: 4,
        importId: "import-v2",
      }],
      verbatims: [],
    }));

    const migrated = loadDataset();
    expect(migrated.answers[0].configurationVersionId).toBe("v2");
    expect(migrated.answers[0].category).toBe("Missions");
  });

  it("retains questionnaire versions after a simulated restart", () => {
    const dataset = loadDataset();
    saveDataset(dataset);
    expect(loadDataset().questionnaireVersions[0].id).toBe(dataset.questionnaireVersions[0].id);
  });
});
