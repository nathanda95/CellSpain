export type Sentiment = "Positive" | "Neutral" | "Negative";
export type Status = "New" | "To review" | "Done" | "Ignored";

/**
 * A scored response as it existed at import time.
 * Labels/categories are intentionally snapshotted so later questionnaire versions
 * never rewrite historical analytics.
 */
export type Answer = {
  question: string;
  category: string;
  score: number;
  date?: string;
  seniority?: string;
  source?: string;
  importId?: string;
  questionKey?: string;
  configurationVersionId?: string;
};

/**
 * A free-text response as it existed at import time.
 * question/category and configurationVersionId preserve the historical context.
 */
export type Verbatim = {
  id: string;
  content: string;
  question: string;
  category: string;
  score?: number;
  sentiment?: Sentiment;
  date?: string;
  role?: string;
  seniority?: string;
  source: string;
  sheet: string;
  status: Status;
  note: string;
  importId?: string;
  questionKey?: string;
  configurationVersionId?: string;
};
