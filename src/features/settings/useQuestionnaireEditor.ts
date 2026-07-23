import { useEffect, useRef, useState } from "react";
import type {
  CategoryConfig,
  QuestionnaireConfig,
  QuestionConfig,
} from "../../domain/questionnaire.types";
import {
  createQuestionnaireVersion,
  exportQuestionnaire,
  importQuestionnaire,
  resetQuestionnaire,
  validateQuestionnaire,
} from "./questionnaire.service";
import { DEFAULT_SCORE_MAPPING } from "./questionnaire.types";

export type SettingsMessage =
  | { type: "success" | "error"; text: string }
  | undefined;

const nextStableKey = (prefix: "category" | "question", keys: string[]) => {
  const usedKeys = new Set(keys);
  let index = 1;
  while (usedKeys.has(`${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
};

export function useQuestionnaireEditor(
  active: QuestionnaireConfig,
  onSave: (next: QuestionnaireConfig) => void,
) {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);
  const [message, setMessage] = useState<SettingsMessage>();
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategories(structuredClone(active.categories));
    setQuestions(structuredClone(active.questions));
  }, [active]);

  const updateCategory = (index: number, patch: Partial<CategoryConfig>) =>
    setCategories((items) =>
      items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    );

  const updateQuestion = (index: number, patch: Partial<QuestionConfig>) =>
    setQuestions((items) =>
      items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    );

  const addCategory = () =>
    setCategories((items) => [
      ...items,
      {
        stableKey: nextStableKey("category", items.map((item) => item.stableKey)),
        name: "New category",
        active: true,
      },
    ]);

  const addQuestion = () =>
    setQuestions((items) => [
      ...items,
      {
        stableKey: nextStableKey("question", items.map((item) => item.stableKey)),
        label: "New question",
        sourceColumn: "",
        categoryKey:
          categories.find((item) => item.active)?.stableKey ??
          categories[0]?.stableKey ??
          "",
        responseType: "rating",
        active: true,
        scoreMapping: { ...DEFAULT_SCORE_MAPPING },
      },
    ]);

  const removeCategory = (category: CategoryConfig) => {
    const linkedQuestionCount = questions.filter(
      (item) => item.categoryKey === category.stableKey,
    ).length;
    if (
      linkedQuestionCount > 0 &&
      !window.confirm(
        `Delete “${category.name}” and its ${linkedQuestionCount} linked question${linkedQuestionCount > 1 ? "s" : ""}?`,
      )
    ) return;

    setCategories((items) =>
      items.filter((item) => item.stableKey !== category.stableKey),
    );
    setQuestions((items) =>
      items.filter((item) => item.categoryKey !== category.stableKey),
    );
  };

  const removeQuestion = (index: number) =>
    setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index));

  const save = () => {
    const errors = validateQuestionnaire(categories, questions);
    if (errors.length) {
      setMessage({ type: "error", text: errors.join(" ") });
      return;
    }
    onSave(createQuestionnaireVersion(active, categories, questions));
    setMessage({
      type: "success",
      text: "Configuration saved. It will be used by future imports only.",
    });
  };

  const exportConfiguration = () => {
    const blob = new Blob([exportQuestionnaire(active)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cellspain-questionnaire-v${active.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "Configuration exported." });
  };

  const importConfiguration = async (file?: File) => {
    if (!file) return;
    try {
      onSave(importQuestionnaire(await file.text(), active));
      setMessage({
        type: "success",
        text: "Configuration imported and activated for future imports.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error
          ? error.message
          : "Unable to import the configuration.",
      });
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  const resetConfiguration = () => {
    if (!window.confirm(
      "Reset the questionnaire to its initial configuration? Existing imports and their results will not be modified.",
    )) return;

    onSave(resetQuestionnaire(active));
    setMessage({
      type: "success",
      text: "Configuration reset. Automatic column detection will be used for future imports.",
    });
  };

  return {
    categories,
    questions,
    message,
    importInput,
    updateCategory,
    updateQuestion,
    addCategory,
    addQuestion,
    removeCategory,
    removeQuestion,
    save,
    exportConfiguration,
    importConfiguration,
    resetConfiguration,
  };
}
