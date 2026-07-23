import { QuestionnaireSettings } from "../features/settings/QuestionnaireSettings";
import type { QuestionnaireConfig } from "../features/settings/questionnaire.types";

export function SettingsPage({
  active,
  onSave,
}: {
  active: QuestionnaireConfig;
  onSave: (next: QuestionnaireConfig) => void;
}) {
  return <QuestionnaireSettings active={active} onSave={onSave} />;
}
