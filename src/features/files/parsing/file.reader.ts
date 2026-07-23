import * as XLSX from "xlsx";

export type SurveyRow = Record<string, unknown>;

export type SurveySheet = {
  name: string;
  rows: SurveyRow[];
};

export async function readSurveySheets(file: File): Promise<SurveySheet[]> {
  if (hasExtension(file.name, "json")) return readJsonFile(file);
  return readSpreadsheetFile(file);
}

async function readJsonFile(file: File): Promise<SurveySheet[]> {
  const content: unknown = JSON.parse(await file.text());
  if (!Array.isArray(content)) {
    throw new Error("JSON must be an array of survey response objects");
  }

  const rows = content.filter(isSurveyRow);
  if (rows.length === 0) {
    throw new Error("JSON must be an array of survey response objects");
  }

  return [{ name: "JSON", rows }];
}

async function readSpreadsheetFile(file: File): Promise<SurveySheet[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const sheetNames = hasExtension(file.name, "csv")
    ? workbook.SheetNames
    : workbook.SheetNames.slice(0, 1);

  if (sheetNames.length === 0) {
    throw new Error("The spreadsheet does not contain any sheet");
  }

  return sheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<SurveyRow>(workbook.Sheets[name], {
      defval: "",
      raw: false,
    }),
  }));
}

function isSurveyRow(value: unknown): value is SurveyRow {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExtension(fileName: string, extension: string): boolean {
  return fileName.toLowerCase().endsWith(`.${extension}`);
}
