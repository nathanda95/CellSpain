import { Download, Plus, RotateCcw, Save, Upload } from "lucide-react";
import type { QuestionnaireConfig } from "../../domain/questionnaire.types";
import { CategoryEditor } from "./components/CategoryEditor";
import { QuestionEditor } from "./components/QuestionEditor";
import { useQuestionnaireEditor } from "./useQuestionnaireEditor";

export function QuestionnaireSettings({
  active,
  onSave,
}: {
  active: QuestionnaireConfig;
  onSave: (next: QuestionnaireConfig) => void;
}) {
  const editor = useQuestionnaireEditor(active, onSave);

  return (
    <>
      <div className="title">
        <div>
          <h1>Questionnaire configuration</h1>
          <p>
            Active version {active.version}, created {new Date(active.createdAt).toLocaleString()}.
          </p>
        </div>
        <div className="title-actions config-management-actions">
          <button className="outline danger-outline" onClick={editor.resetConfiguration}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="outline" onClick={editor.exportConfiguration}>
            <Download size={16} /> Export
          </button>
          <button className="outline" onClick={() => editor.importInput.current?.click()}>
            <Upload size={16} /> Import
          </button>
          <input
            ref={editor.importInput}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void editor.importConfiguration(event.target.files?.[0])}
          />
        </div>
      </div>

      <div className="config-notice">
        Changes are applied only to future imports. Existing imports and their results will not be modified.
      </div>
      {active.legacyAutoDetect && (
        <div className="config-notice legacy">
          The initial version uses the historical automatic column detection. Saving creates the first explicit questionnaire.
        </div>
      )}

      <section className="card config-section">
        <div className="config-heading">
          <div>
            <h2>Categories</h2>
            <p>Deleting a category also removes its linked questions from the next version.</p>
          </div>
          <button className="outline" onClick={editor.addCategory}>
            <Plus size={16} /> Add category
          </button>
        </div>
        <div className="config-list">
          {editor.categories.map((category, index) => (
            <CategoryEditor
              key={`${category.stableKey}-${index}`}
              category={category}
              onChange={(patch) => editor.updateCategory(index, patch)}
              onRemove={() => editor.removeCategory(category)}
            />
          ))}
        </div>
        <div className="config-add-question">
          <button className="outline" onClick={editor.addCategory}>
            <Plus size={16} /> Add category
          </button>
        </div>
      </section>

      <section className="card config-section">
        <div className="config-heading">
          <div>
            <h2>Questions</h2>
            <p>Column names must exactly match the imported file.</p>
          </div>
          <button
            className="outline"
            disabled={!editor.categories.length}
            onClick={editor.addQuestion}
          >
            <Plus size={16} /> Add question
          </button>
        </div>
        <div className="question-list">
          {editor.questions.map((question, index) => (
            <QuestionEditor
              key={`${question.stableKey}-${index}`}
              question={question}
              categories={editor.categories}
              onChange={(patch) => editor.updateQuestion(index, patch)}
              onRemove={() => editor.removeQuestion(index)}
            />
          ))}
        </div>
        {!editor.questions.length && (
          <p className="unavailable">
            No explicit questions yet. Add one to replace historical automatic detection.
          </p>
        )}
        <div className="config-add-question">
          <button
            className="outline"
            disabled={!editor.categories.length}
            onClick={editor.addQuestion}
          >
            <Plus size={16} /> Add question
          </button>
        </div>
      </section>

      {editor.message && (
        <p className={editor.message.type === "error" ? "config-error" : "config-success"}>
          {editor.message.text}
        </p>
      )}
      <div className="config-actions">
        <button className="primary" onClick={editor.save}>
          <Save size={17} /> Save new configuration
        </button>
      </div>
    </>
  );
}
