export type Sentiment = "Positive" | "Neutral" | "Negative";
export type Status = "New" | "To review" | "Done" | "Ignored";

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
