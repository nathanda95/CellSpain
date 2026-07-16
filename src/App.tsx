import { Fragment, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings,
  Upload,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Trash2,
} from "lucide-react";
import "./App.css";
import { belongsToImport, parseWorkbook } from "./features/files/file.service";
import type { Answer, Dataset, ImportItem } from "./features/files/file.types";
import type { Status, Verbatim } from "./features/feedback/feedback.types";
import {
  areaScoreColor,
  average,
  median,
  period,
  periodOrder,
} from "./features/feedback/feedback.store";
import {
  isWithinDateRange,
  periodBounds,
  type PeriodMode,
} from "./features/settings/settings.store";
import { loadDataset, saveDataset } from "./shared/db/database";
import { QuestionnaireSettings } from "./features/settings/QuestionnaireSettings";
import { activeQuestionnaire } from "./features/settings/questionnaire.service";
import { createId } from "./shared/utils/id";

const dateLabel = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

type Page = "dashboard" | "verbatims" | "reports" | "settings";

const NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "verbatims", label: "Verbatims", icon: MessageSquareText },
  { id: "reports", label: "Reports", icon: BarChart3 },
] as const;

const Metric = ({
  label,
  value,
  sub,
}: {
  label: string;
  value?: string;
  sub?: string;
}) => (
  <section className="metric">
    <span>{label}</span>
    <strong>{value ?? "Data unavailable"}</strong>
    {sub && <small>{sub}</small>}
  </section>
);
const Empty = ({ title, detail }: { title: string; detail: string }) => (
  <div className="empty">
    <FileSpreadsheet size={30} />
    <h3>{title}</h3>
    <p>{detail}</p>
  </div>
);

function App() {
  // État de navigation et données persistées de l'application.
  const [page, setPage] = useState<Page>("dashboard");
  const [data, setData] = useState<Dataset>(loadDataset);
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState("All");
  const [category, setCategory] = useState("All");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("All");
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedVerbatim, setSelectedVerbatim] = useState<Verbatim | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const questionnaire = activeQuestionnaire(data.questionnaireVersions);

  useEffect(() => saveDataset(data), [data]);

  // Chaque fichier est enregistré dans l'historique, même en cas d'erreur, afin
  // que l'utilisateur comprenne pourquoi certaines données n'apparaissent pas.
  const importFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const base = {
        id: createId(),
        name: file.name,
        size: file.size,
        importedAt: new Date().toISOString(),
        status: "Completed" as const,
        rows: 0,
        verbatims: 0,
      };
      try {
        const parsed = await parseWorkbook(file, base.id, questionnaire);
        setData((currentData) => ({
          ...currentData,
          answers: [...currentData.answers, ...parsed.answers],
          verbatims: [...currentData.verbatims, ...parsed.verbatims],
          imports: [
            { ...base, rows: parsed.rows, verbatims: parsed.verbatims.length, warnings: parsed.warnings, configurationVersionId: questionnaire.id },
            ...currentData.imports,
          ],
        }));
      } catch (err) {
        setData((currentData) => ({
          ...currentData,
          imports: [
            {
              ...base,
              status: "Error",
              error: err instanceof Error ? err.message : "Unreadable file",
            },
            ...currentData.imports,
          ],
        }));
      }
    }
  };
  const removeImport = (item: ImportItem) => {
    const message =
      item.status === "Completed"
        ? `Remove "${item.name}" and its imported data from this dashboard?`
        : `Remove "${item.name}" from the import history?`;
    if (!window.confirm(message)) return;
    setData((currentData) => ({
      ...currentData,
      answers:
        item.status === "Completed"
          ? currentData.answers.filter(
              (answer) => !belongsToImport(answer, item, currentData.imports),
            )
          : currentData.answers,
      verbatims:
        item.status === "Completed"
          ? currentData.verbatims.filter(
              (verbatim) =>
                !belongsToImport(verbatim, item, currentData.imports),
            )
          : currentData.verbatims,
      imports: currentData.imports.filter(
        (existingImport) => existingImport.id !== item.id,
      ),
    }));
  };
  const activePeriod = periodBounds(
    periodMode,
    periodMonth,
    periodYear,
    dateFrom,
    dateTo,
  );

  // Les valeurs suivantes sont dérivées du dataset. Elles ne sont pas stockées,
  // ce qui évite qu'elles se désynchronisent après un import ou un changement de filtre.
  const filteredAnswers = data.answers.filter((a) =>
    isWithinDateRange(a.date, activePeriod.from, activePeriod.to),
  );
  const filteredVerbatims = data.verbatims.filter((v) =>
    isWithinDateRange(v.date, activePeriod.from, activePeriod.to),
  );
  const categories = [...new Set(data.answers.map((a) => a.category))];
  const dashboardCategories = [
    ...new Set(filteredAnswers.map((a) => a.category)),
  ];
  const scores = filteredAnswers.map((answer) => answer.score);
  const averageScore = average(scores);
  const medianScore = median(scores);
  const byCategory = dashboardCategories
    .map((name) => ({
      name,
      value: average(
        filteredAnswers.filter((a) => a.category === name).map((a) => a.score),
      )!,
    }))
    .filter((categoryScore) => categoryScore.value);
  const seniorityAverages = [
    ...new Set(filteredAnswers.map((answer) => answer.seniority).filter(Boolean)),
  ].map((name) => ({
    name: name!,
    value:
      average(
        filteredAnswers
          .filter((answer) => answer.seniority === name)
          .map((answer) => answer.score),
      ) ?? 0,
  }));
  const radarPeriodNames = [
    ...new Set(data.answers.map((answer) => period(answer.date))),
  ]
    .filter((name) => name !== "Undated")
    .sort((a, b) => periodOrder(a) - periodOrder(b));
  const radarCategories = [
    ...new Set(data.answers.map((answer) => answer.category)),
  ];
  const radarPeriods = radarPeriodNames.map((name) => ({
    name,
    values: radarCategories.map((categoryName) => ({
      category: categoryName,
      score: average(
        data.answers
          .filter(
            (answer) =>
              period(answer.date) === name &&
              answer.category === categoryName,
          )
          .map((answer) => answer.score),
      ),
    })),
  }));
  const trendSeries = dashboardCategories.map((name, index) => ({
    key: `category-${index}`,
    name,
  }));
  const periods = [...new Set(filteredAnswers.map((a) => period(a.date)))]
    .filter((periodName) => periodName !== "Undated")
    .sort((a, b) => periodOrder(a) - periodOrder(b))
    .map((name) => {
      const periodAnswers = filteredAnswers.filter(
        (answer) => period(answer.date) === name,
      );
      return trendSeries.reduce<Record<string, string | number | undefined>>(
        (point, series) => {
          point[series.key] = average(
            periodAnswers
              .filter((answer) => answer.category === series.name)
              .map((answer) => answer.score),
          );
          return point;
        },
        {
          name,
          overall: average(periodAnswers.map((answer) => answer.score)),
        },
      );
    });
  const matchingVerbatims = filteredVerbatims.filter(
    (verbatim) =>
      (sentiment === "All" || verbatim.sentiment === sentiment) &&
      (category === "All" || verbatim.category === category) &&
      `${verbatim.content} ${verbatim.question}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div className="app">
      <header>
        <div className="brand">CellSpain</div>
        <nav>
          {NAVIGATION_ITEMS.map((navigationItem) => (
            <button
              key={navigationItem.id}
              className={page === navigationItem.id ? "active" : ""}
              onClick={() => setPage(navigationItem.id)}
            >
              <navigationItem.icon size={16} />
              {navigationItem.label}
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <button className="settings-link" onClick={() => setPage("settings")} title="Questionnaire configuration"><Settings size={19} /></button>
          <span>Local analysis · offline</span>
        </div>
      </header>
      <main>
        {page === "dashboard" && (
          <>
            <div className="title">
              <div>
                <h1>Employee Satisfaction Dashboard</h1>
                <p>Analysis built only from your imported survey responses.</p>
              </div>
              <div className="title-actions">
                <DateFilters
                  mode={periodMode}
                  setMode={setPeriodMode}
                  month={periodMonth}
                  setMonth={setPeriodMonth}
                  year={periodYear}
                  setYear={setPeriodYear}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  setDateFrom={setDateFrom}
                  setDateTo={setDateTo}
                />
                <button className="outline" onClick={() => setPage("reports")}>
                  Manage imports
                </button>
              </div>
            </div>
            {!data.answers.length ? (
              <Empty
                title="No imported files yet"
                detail="Import an Excel, CSV or JSON survey file to populate the dashboard."
              />
            ) : !scores.length ? (
              <Empty
                title="No data in selected period"
                detail="Try widening or clearing the period filter."
              />
            ) : (
              <>
                <div className="metrics">
                  <Metric
                    label="Overall average"
                    value={`${averageScore!.toFixed(1)}/4`}
                    sub="Numeric scores use the source 1–4 scale"
                  />
                  <Metric
                    label="Overall median"
                    value={`${medianScore!.toFixed(1)}/4`}
                  />
                  <Metric
                    label="Responses scored"
                    value={String(scores.length)}
                  />
                  <Metric
                    label="Verbatims detected"
                    value={String(filteredVerbatims.length)}
                  />
                </div>
                <div className="dashboard-grid">
                  <ChartCard
                    title="Ratings trend by category"
                    values={periods}
                    series={trendSeries}
                  />
                  <RadarCard periods={radarPeriods} />
                </div>
                <section className="card categories">
                  <h2>Average by area</h2>
                  {byCategory.map((c) => (
                    <div className="bar-row" key={c.name}>
                      <span>{c.name}</span>
                      <div>
                        <i
                          style={{
                            width: `${(c.value / 4) * 100}%`,
                            background: areaScoreColor(c.value),
                          }}
                        />
                      </div>
                      <b>{c.value.toFixed(1)}</b>
                    </div>
                  ))}
                </section>
                <div className="seniority-dashboard-grid">
                  <SeniorityAverageCard values={seniorityAverages} />
                  <SeniorityTrendCard answers={filteredAnswers} />
                </div>
              </>
            )}
          </>
        )}
        {page === "verbatims" && (
          <>
            <div className="title">
              <div>
                <h1>Verbatims</h1>
                <p>
                  {data.verbatims.length
                    ? `${data.verbatims.length} real comments detected in imported files`
                    : "No free-text comments have been detected yet."}
                </p>
              </div>
            </div>
            {!data.verbatims.length ? (
              <Empty
                title="No verbatims available"
                detail="Import a survey that includes real free-text comment columns."
              />
            ) : (
              <>
                <div className="filters">
                  <Search size={20} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search keywords, phrases or topics…"
                  />
                  <Select
                    value={sentiment}
                    onChange={setSentiment}
                    options={["All", "Positive", "Neutral", "Negative"]}
                  />
                  <Select
                    value={category}
                    onChange={setCategory}
                    options={["All", ...categories]}
                  />
                  <DateFilters
                    mode={periodMode}
                    setMode={setPeriodMode}
                    month={periodMonth}
                    setMonth={setPeriodMonth}
                    year={periodYear}
                    setYear={setPeriodYear}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    setDateFrom={setDateFrom}
                    setDateTo={setDateTo}
                  />
                </div>
                <div className="verbatim-list">
                  {matchingVerbatims.map((verbatim) => (
                    <VerbatimCard
                      key={verbatim.id}
                      item={verbatim}
                      onOpen={setSelectedVerbatim}
                    />
                  ))}
                </div>
                {!matchingVerbatims.length && (
                  <Empty
                    title="No matching comments"
                    detail="Try clearing some filters."
                  />
                )}
              </>
            )}
          </>
        )}
        {page === "reports" && (
          <>
            <div className="title">
              <div>
                <h1>Import data</h1>
                <p>
                  Files remain on this device. No information is sent online.
                </p>
              </div>
            </div>
            <section
              className="import-area"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                importFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
            >
              <input
                ref={fileInput}
                hidden
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                multiple
                onChange={(e) => e.target.files && importFiles(e.target.files)}
              />
              <span className="upload">
                <Upload size={27} />
              </span>
              <h2>Drop your files here</h2>
              <p>or select files from your computer</p>
              <button
                className="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInput.current?.click();
                }}
              >
                <FolderOpen size={17} /> Browse files
              </button>
              <small>Accepted formats: XLSX, CSV, JSON</small>
            </section>
            <section className="recent">
              <div>
                <h2>Recent imports</h2>
                <span>
                  {data.imports.length} file
                  {data.imports.length !== 1 ? "s" : ""}
                </span>
              </div>
              {!data.imports.length ? (
                <Empty
                  title="No imported files yet"
                  detail="Your successful imports will appear here."
                />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>File name</th>
                      <th>Status</th>
                      <th>Imported</th>
                      <th>Size</th>
                      <th>Rows</th>
                      <th>Verbatims</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.imports.map((i) => (
                      <Fragment key={i.id}>
                      <tr>
                        <td>
                          <FileText size={17} />
                          {i.name}
                        </td>
                        <td>
                          <span className={`status ${i.status.toLowerCase()}`}>
                            {i.status === "Completed" ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <AlertCircle size={14} />
                            )}{" "}
                            {i.status}
                          </span>
                        </td>
                        <td>{dateLabel(i.importedAt)}</td>
                        <td>{(i.size / 1024).toFixed(1)} KB</td>
                        <td>{i.rows}</td>
                        <td>{i.verbatims}</td>
                        <td>
                          <button
                            className="icon danger"
                            title={`Remove ${i.name}`}
                            onClick={() => removeImport(i)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      {i.warnings?.length ? <tr className="import-warning"><td colSpan={7}>{i.warnings.join(" · ")}</td></tr> : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
        {page === "settings" && <QuestionnaireSettings active={questionnaire} onSave={(next) => setData((current) => ({
          ...current,
          questionnaireVersions: [
            ...current.questionnaireVersions.map((version) => ({ ...version, active: false })),
            next,
          ],
        }))} />}
      </main>
      {selectedVerbatim && (
        <Details
          item={selectedVerbatim}
          onClose={() => setSelectedVerbatim(null)}
          onSave={(patch) => {
            setData((currentData) => ({
              ...currentData,
              verbatims: currentData.verbatims.map((verbatim) =>
                verbatim.id === selectedVerbatim.id
                  ? { ...verbatim, ...patch }
                  : verbatim,
              ),
            }));
            setSelectedVerbatim({ ...selectedVerbatim, ...patch });
          }}
        />
      )}
    </div>
  );
}
const Select = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) => (
  <label className="select">
    {value}
    <ChevronDown size={16} />
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  </label>
);
const DateFilters = ({
  mode,
  setMode,
  month,
  setMonth,
  year,
  setYear,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
}: {
  mode: PeriodMode;
  setMode: (v: PeriodMode) => void;
  month: string;
  setMonth: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
}) => {
  const hasValue = Boolean(month || year || dateFrom || dateTo);
  const clear = () => {
    setMonth("");
    setYear("");
    setDateFrom("");
    setDateTo("");
  };
  return (
    <>
      <Select
        value={mode}
        onChange={(v) => setMode(v as PeriodMode)}
        options={["All", "Month", "Year", "Custom period"]}
      />
      {mode === "Month" && (
        <label className="date-filter">
          <CalendarDays size={16} />
          <span>Month</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      )}
      {mode === "Year" && (
        <label className="date-filter">
          <CalendarDays size={16} />
          <span>Year</span>
          <input
            type="number"
            min="1900"
            max="2100"
            step="1"
            value={year}
            placeholder="2026"
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
      )}
      {mode === "Custom period" && (
        <>
          <label className="date-filter">
            <CalendarDays size={16} />
            <span>From</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className="date-filter">
            <CalendarDays size={16} />
            <span>To</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </>
      )}
      {hasValue && (
        <button className="clear-filter" onClick={clear}>
          Clear period
        </button>
      )}
    </>
  );
};
const SeniorityAverageCard = ({
  values,
}: {
  values: { name: string; value: number }[];
}) => {
  const scores = values.map((item) => item.value);
  const minimum = scores.length ? Math.min(...scores) : 0;
  const maximum = scores.length ? Math.max(...scores) : 4;
  const range = maximum - minimum;
  const padding = range === 0 ? 0.2 : Math.max(range * 0.12, 0.1);
  const domainMinimum = Math.max(
    0,
    Math.floor((minimum - padding) * 10) / 10,
  );
  const domainMaximum = Math.min(
    4,
    Math.ceil((maximum + padding) * 10) / 10,
  );
  const domainRange = domainMaximum - domainMinimum || 1;

  return (
    <section className="card service-card">
      <h2>Average by length of service</h2>
      {values.length ? (
        <div className="service-chart-body">
          <div className="service-y-axis" aria-hidden="true">
            <span>{domainMaximum.toFixed(1)}</span>
            <span>{((domainMaximum + domainMinimum) / 2).toFixed(1)}</span>
            <span>{domainMinimum.toFixed(1)}</span>
          </div>
          <div className="seniority">
            {values.map((item) => {
              const height =
                ((item.value - domainMinimum) / domainRange) * 100;
              return (
                <div key={item.name}>
                  <i style={{ height: `${height}%` }} />
                  <span>{item.name}</span>
                  <b>{item.value.toFixed(1)}</b>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="unavailable">No length-of-service data available.</p>
      )}
    </section>
  );
};

const SeniorityTrendCard = ({ answers }: { answers: Answer[] }) => {
  const allSeniorities = [
    ...new Set(answers.map((answer) => answer.seniority).filter(Boolean)),
  ] as string[];
  const [selectedSeniority, setSelectedSeniority] = useState("All seniorities");
  const seniorityAnswers =
    selectedSeniority === "All seniorities"
      ? answers
      : answers.filter((answer) => answer.seniority === selectedSeniority);
  const categories = [
    ...new Set(seniorityAnswers.map((answer) => answer.category)),
  ];
  const series = categories.map((name, index) => ({
    key: `seniority-category-${index}`,
    name,
  }));
  const values = [
    ...new Set(seniorityAnswers.map((answer) => period(answer.date))),
  ]
    .filter((name) => name !== "Undated")
    .sort((a, b) => periodOrder(a) - periodOrder(b))
    .map((name) => {
      const periodAnswers = seniorityAnswers.filter(
        (answer) => period(answer.date) === name,
      );
      return series.reduce<Record<string, string | number | undefined>>(
        (point, item) => {
          point[item.key] = average(
            periodAnswers
              .filter((answer) => answer.category === item.name)
              .map((answer) => answer.score),
          );
          return point;
        },
        {
          name,
          overall: average(periodAnswers.map((answer) => answer.score)),
        },
      );
    });

  useEffect(() => {
    if (
      selectedSeniority !== "All seniorities" &&
      !allSeniorities.includes(selectedSeniority)
    ) {
      setSelectedSeniority("All seniorities");
    }
  }, [allSeniorities, selectedSeniority]);

  return (
    <ChartCard
      title="Ratings trend by category and length of service"
      values={values}
      series={series}
      secondaryFilter={{
        label: "Length of service",
        value: selectedSeniority,
        options: ["All seniorities", ...allSeniorities],
        onChange: setSelectedSeniority,
      }}
    />
  );
};

const ChartCard = ({
  title,
  values,
  series,
  secondaryFilter,
}: {
  title: string;
  values: Record<string, string | number | undefined>[];
  series: { key: string; name: string }[];
  secondaryFilter?: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
  };
}) => {
  const [selectedSeries, setSelectedSeries] = useState("all");

  useEffect(() => {
    if (
      selectedSeries !== "all" &&
      selectedSeries !== "overall" &&
      !series.some((item) => item.key === selectedSeries)
    ) {
      setSelectedSeries("all");
    }
  }, [selectedSeries, series]);

  const visibleSeries =
    selectedSeries === "all"
      ? series
      : series.filter((item) => item.key === selectedSeries);
  const showOverall =
    selectedSeries === "all" || selectedSeries === "overall";
  const visibleKeys = [
    ...(showOverall ? ["overall"] : []),
    ...visibleSeries.map((item) => item.key),
  ];
  const visibleScores = values.flatMap((point) =>
    visibleKeys
      .map((key) => point[key])
      .filter((value): value is number => typeof value === "number"),
  );
  const lowestScore = visibleScores.length ? Math.min(...visibleScores) : 0;
  const highestScore = visibleScores.length ? Math.max(...visibleScores) : 4;
  const scoreRange = highestScore - lowestScore;
  const scalePadding = scoreRange === 0 ? 0.2 : Math.max(scoreRange * 0.12, 0.1);
  const yDomain: [number, number] = [
    Math.max(0, Math.floor((lowestScore - scalePadding) * 10) / 10),
    Math.min(4, Math.ceil((highestScore + scalePadding) * 10) / 10),
  ];

  return (
  <section className="card chart">
    <div className="chart-heading">
      <h2>{title}</h2>
      <div className="chart-filters">
        <label className="chart-category-filter">
          <span>Category</span>
          <select
            value={selectedSeries}
            onChange={(event) => setSelectedSeries(event.target.value)}
          >
            <option value="all">All categories</option>
            <option value="overall">Overall</option>
            {series.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {secondaryFilter && (
          <label className="chart-category-filter">
            <span>{secondaryFilter.label}</span>
            <select
              value={secondaryFilter.value}
              onChange={(event) => secondaryFilter.onChange(event.target.value)}
            >
              {secondaryFilter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
    {values.length > 1 ? (
      <div className="trend-chart">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={values} margin={{ top: 8, right: 12, bottom: 42, left: 0 }}>
          <CartesianGrid stroke="#e5e6ef" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-40}
            textAnchor="end"
            height={62}
            tick={{ fill: "#55586a", fontSize: 11 }}
          />
          <YAxis
            domain={yDomain}
            tickCount={6}
            allowDecimals
            tick={{ fill: "#777b8e", fontSize: 11 }}
            tickFormatter={(value) => Number(value).toFixed(1)}
          />
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(1)}/4`}
          />
          <Legend
            align="right"
            verticalAlign="middle"
            layout="vertical"
            iconType="plainline"
            wrapperStyle={{ fontSize: 11, paddingLeft: 12 }}
          />
          {showOverall && (
            <Line
              type="monotone"
              name="Overall"
              dataKey="overall"
              stroke="#1c2332"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#1c2332" }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
          {visibleSeries.map((item) => {
            const colorIndex = series.findIndex(
              (seriesItem) => seriesItem.key === item.key,
            );
            const color = TREND_COLORS[colorIndex % TREND_COLORS.length];
            return (
            <Line
              key={item.key}
              type="monotone"
              name={item.name}
              dataKey={item.key}
              stroke={color}
              strokeWidth={2}
              dot={{
                r: 3.5,
                fill: color,
              }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            );
          })}
        </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="unavailable">
        At least two dated periods are needed to show a trend.
      </p>
    )}
  </section>
  );
};
const TREND_COLORS = [
  "#4847dc",
  "#d45b78",
  "#16877c",
  "#d18425",
  "#7b55c7",
  "#3c78b5",
  "#8a6d3b",
  "#b34d4d",
];
const RadarCard = ({
  periods,
}: {
  periods: {
    name: string;
    values: { category: string; score: number | undefined }[];
  }[];
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const requestedIndex = periods.findIndex(
    (item) => item.name === selectedPeriod,
  );
  const selectedIndex = Math.max(
    1,
    requestedIndex >= 1 ? requestedIndex : periods.length - 1,
  );
  const currentPeriod = periods[selectedIndex];
  const previousPeriod = periods[selectedIndex - 1];
  const values =
    currentPeriod?.values
      .map((item) => ({
        category: item.category,
        current: item.score,
        previous: previousPeriod.values.find(
          (previousItem) => previousItem.category === item.category,
        )?.score,
      }))
      .filter((item) => item.current != null || item.previous != null) ?? [];

  const changePeriod = (nextIndex: number) => {
    const nextPeriod = periods[nextIndex];
    if (nextPeriod) setSelectedPeriod(nextPeriod.name);
  };

  return (
    <section className="card radar-card">
      <h2>Categories radar</h2>
      {periods.length >= 2 && values.length >= 3 ? (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={values} outerRadius="68%">
              <PolarGrid stroke="#cfd2e2" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "#4e5064", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 4]}
                tickCount={5}
                tick={{ fill: "#777b8e", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)}/4`,
                  String(name),
                ]}
              />
              <Legend
                content={() => (
                  <div className="radar-custom-legend">
                    <span className="radar-period-previous">
                      <i />
                      {previousPeriod.name}
                    </span>
                    <span className="radar-period-current">
                      <i />
                      {currentPeriod.name}
                    </span>
                  </div>
                )}
              />
              <Radar
                name={previousPeriod.name}
                dataKey="previous"
                stroke="#e0782f"
                fill="#e0782f"
                fillOpacity={0.16}
                strokeWidth={2}
              />
              <Radar
                name={currentPeriod.name}
                dataKey="current"
                stroke="#4847dc"
                fill="#4847dc"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="radar-period-navigation">
            <button
              type="button"
              aria-label="Previous period comparison"
              disabled={selectedIndex <= 1}
              onClick={() => changePeriod(selectedIndex - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              <b className="radar-period-previous">{previousPeriod.name}</b>
              {" vs "}
              <b className="radar-period-current">{currentPeriod.name}</b>
            </span>
            <button
              type="button"
              aria-label="Next period comparison"
              disabled={selectedIndex >= periods.length - 1}
              onClick={() => changePeriod(selectedIndex + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      ) : (
        <p className="unavailable">
          At least two dated periods and three categories are needed to compare them.
        </p>
      )}
    </section>
  );
};
const VerbatimCard = ({
  item,
  onOpen,
  compact = false,
}: {
  item: Verbatim;
  onOpen: (v: Verbatim) => void;
  compact?: boolean;
}) => (
  <article className={`verbatim ${compact ? "compact" : ""}`}>
    <div className="verbatim-top">
      <span>
        <MessageSquareText size={18} /> {item.role || "Anonymous respondent"}
      </span>
      {item.sentiment && (
        <em className={item.sentiment.toLowerCase()}>{item.sentiment}</em>
      )}
    </div>
    <p>“{item.content}”</p>
    <footer>
      <span>
        <Clock3 size={14} />
        {dateLabel(item.date)} · {item.category}
      </span>
      <button className="primary" onClick={() => onOpen(item)}>
        See details
      </button>
    </footer>
  </article>
);
const Details = ({
  item,
  onClose,
  onSave,
}: {
  item: Verbatim;
  onClose: () => void;
  onSave: (p: Partial<Verbatim>) => void;
}) => (
  <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
      <button className="close" onClick={onClose}>
        <X />
      </button>
      <span className={`sentiment ${item.sentiment?.toLowerCase()}`}>
        {item.sentiment ?? "Score unavailable"}
      </span>
      <h2>Comment details</h2>
      <blockquote>“{item.content}”</blockquote>
      <dl>
        <dt>Question</dt>
        <dd>{item.question}</dd>
        <dt>Source</dt>
        <dd>
          {item.source} · {item.sheet}
        </dd>
        <dt>Category</dt>
        <dd>{item.category}</dd>
        <dt>Score</dt>
        <dd>{item.score ? `${item.score}/4` : "Unavailable"}</dd>
        <dt>Date</dt>
        <dd>{dateLabel(item.date)}</dd>
      </dl>
      <label>
        Local status
        <Select
          value={item.status}
          onChange={(status) => onSave({ status: status as Status })}
          options={["New", "To review", "Done", "Ignored"]}
        />
      </label>
      <label>
        Internal note
        <textarea
          value={item.note}
          onChange={(e) => onSave({ note: e.target.value })}
          placeholder="Private note stored on this device…"
        />
      </label>
    </section>
  </div>
);
export default App;
