import { Download, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createQuestionnaireVersion, exportQuestionnaire, importQuestionnaire, resetQuestionnaire, validateQuestionnaire } from "./questionnaire.service";
import {
  DEFAULT_SCORE_MAPPING,
  type CategoryConfig,
  type QuestionnaireConfig,
  type QuestionConfig,
  type ResponseType,
} from "./questionnaire.types";

const nextStableKey = (prefix: "category" | "question", keys: string[]) => {
  const usedKeys = new Set(keys);
  let index = 1;
  while (usedKeys.has(`${prefix}_${index}`)) index += 1;
  return `${prefix}_${index}`;
};

export function QuestionnaireSettings({
  active,
  onSave,
}: {
  active: QuestionnaireConfig;
  onSave: (next: QuestionnaireConfig) => void;
}) {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);
  const [message, setMessage] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setCategories(structuredClone(active.categories));
    setQuestions(structuredClone(active.questions));
  }, [active]);

  const updateCategory = (index: number, patch: Partial<CategoryConfig>) =>
    setCategories((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateQuestion = (index: number, patch: Partial<QuestionConfig>) =>
    setQuestions((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const addCategory = () => setCategories((items) => [
    ...items,
    { stableKey: nextStableKey("category", items.map((item) => item.stableKey)), name: "New category", active: true },
  ]);
  const addQuestion = () => setQuestions((items) => [
    ...items,
    { stableKey: nextStableKey("question", items.map((item) => item.stableKey)), label: "New question", sourceColumn: "", categoryKey: categories.find((item) => item.active)?.stableKey ?? categories[0]?.stableKey ?? "", responseType: "rating", active: true, scoreMapping: { ...DEFAULT_SCORE_MAPPING } },
  ]);
  const removeCategory = (category: CategoryConfig) => {
    const linkedQuestionCount = questions.filter((item) => item.categoryKey === category.stableKey).length;
    if (linkedQuestionCount > 0 && !window.confirm(
      `Delete “${category.name}” and its ${linkedQuestionCount} linked question${linkedQuestionCount > 1 ? "s" : ""}?`,
    )) return;
    setCategories((items) => items.filter((item) => item.stableKey !== category.stableKey));
    setQuestions((items) => items.filter((item) => item.categoryKey !== category.stableKey));
  };
  const save = () => {
    const errors = validateQuestionnaire(categories, questions);
    if (errors.length) return setMessage(errors.join(" "));
    onSave(createQuestionnaireVersion(active, categories, questions));
    setMessage("Configuration saved. It will be used by future imports only.");
  };
  const exportConfiguration = () => {
    const blob = new Blob([exportQuestionnaire(active)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cellspain-questionnaire-v${active.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Configuration exported.");
  };
  const importConfiguration = async (file?: File) => {
    if (!file) return;
    try {
      const next = importQuestionnaire(await file.text(), active);
      onSave(next);
      setMessage("Configuration imported and activated for future imports.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import the configuration.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };
  const resetConfiguration = () => {
    if (!window.confirm("Reset the questionnaire to its initial configuration? Existing imports and their results will not be modified.")) return;
    onSave(resetQuestionnaire(active));
    setMessage("Configuration reset. Automatic column detection will be used for future imports.");
  };

  return <>
    <div className="title"><div><h1>Questionnaire configuration</h1><p>Active version {active.version}, created {new Date(active.createdAt).toLocaleString()}.</p></div><div className="title-actions config-management-actions"><button className="outline danger-outline" onClick={resetConfiguration}><RotateCcw size={16}/> Reset</button><button className="outline" onClick={exportConfiguration}><Download size={16}/> Export</button><button className="outline" onClick={() => importInput.current?.click()}><Upload size={16}/> Import</button><input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importConfiguration(event.target.files?.[0])}/></div></div>
    <div className="config-notice">Changes are applied only to future imports. Existing imports and their results will not be modified.</div>
    {active.legacyAutoDetect && <div className="config-notice legacy">The initial version uses the historical automatic column detection. Saving creates the first explicit questionnaire.</div>}
    <section className="card config-section">
      <div className="config-heading"><div><h2>Categories</h2><p>Deleting a category also removes its linked questions from the next version.</p></div><button className="outline" onClick={addCategory}><Plus size={16}/> Add category</button></div>
      <div className="config-list">{categories.map((item, index) => <div className="config-category" key={`${item.stableKey}-${index}`}>
        <label>Name<input value={item.name} onChange={(e) => updateCategory(index, { name: e.target.value })}/></label>
        <label>Description<input value={item.description ?? ""} onChange={(e) => updateCategory(index, { description: e.target.value })}/></label>
        <label className="check"><input type="checkbox" checked={item.active} onChange={(e) => updateCategory(index, { active: e.target.checked })}/> Active</label>
        <button className="icon danger" title="Remove from the next version" onClick={() => removeCategory(item)}><Trash2 size={16}/></button>
      </div>)}</div>
      <div className="config-add-question"><button className="outline" onClick={addCategory}><Plus size={16}/> Add category</button></div>
    </section>
    <section className="card config-section">
      <div className="config-heading"><div><h2>Questions</h2><p>Column names must exactly match the imported file.</p></div><button className="outline" disabled={!categories.length} onClick={addQuestion}><Plus size={16}/> Add question</button></div>
      <div className="question-list">{questions.map((item, index) => <article className="question-config" key={`${item.stableKey}-${index}`}>
        <div className="question-fields">
          <label>Display label<input value={item.label} onChange={(e) => updateQuestion(index, { label: e.target.value })}/></label>
          <label>Expected file column<input value={item.sourceColumn} onChange={(e) => updateQuestion(index, { sourceColumn: e.target.value })}/></label>
          <label>Category<select value={item.categoryKey} onChange={(e) => updateQuestion(index, { categoryKey: e.target.value })}>{categories.map((category) => <option value={category.stableKey} key={category.stableKey}>{category.name}{category.active ? "" : " (inactive)"}</option>)}</select></label>
          <label>Response type<select value={item.responseType} onChange={(e) => updateQuestion(index, { responseType: e.target.value as ResponseType })}><option value="rating">Rating</option><option value="verbatim">Free text / verbatim</option></select></label>
          <div className="question-flags"><label className="check"><input type="checkbox" checked={item.active} onChange={(e) => updateQuestion(index, { active: e.target.checked })}/> Active</label></div>
        </div>
        <button className="icon danger" title="Remove from the next version" onClick={() => setQuestions((items) => items.filter((_, i) => i !== index))}><Trash2 size={16}/></button>
      </article>)}</div>
      {!questions.length && <p className="unavailable">No explicit questions yet. Add one to replace historical automatic detection.</p>}
      <div className="config-add-question"><button className="outline" disabled={!categories.length} onClick={addQuestion}><Plus size={16}/> Add question</button></div>
    </section>
    {message && <p className={message.includes("invalid") || message.startsWith("Unable") || message.startsWith("Each") || message.startsWith("Two") || message.startsWith("Every") || message.startsWith("The selected") ? "config-error" : "config-success"}>{message}</p>}
    <div className="config-actions"><button className="primary" onClick={save}><Save size={17}/> Save new configuration</button></div>
  </>;
}
