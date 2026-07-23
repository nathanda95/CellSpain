export type ResponseType = "rating" | "verbatim";

export type CategoryConfig = {
  stableKey: string;
  name: string;
  description?: string;
  active: boolean;
};

export type QuestionConfig = {
  stableKey: string;
  label: string;
  sourceColumn: string;
  categoryKey: string;
  responseType: ResponseType;
  active: boolean;
  scoreMapping?: Record<string, number>;
};

export type QuestionnaireConfig = {
  id: string;
  version: number;
  createdAt: string;
  active: boolean;
  /** Compatibility mode for data imported before a questionnaire was configured. */
  legacyAutoDetect?: boolean;
  categories: CategoryConfig[];
  questions: QuestionConfig[];
};
