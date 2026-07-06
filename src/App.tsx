import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  BarChart3, FileSpreadsheet, FileText, FolderOpen, LayoutDashboard, MessageSquareText,
  Search, Settings, Upload, X, ChevronDown, Clock3, CheckCircle2, AlertCircle, CalendarDays,
  Trash2,
} from "lucide-react";
import "./App.css";

type Sentiment = "Positive" | "Neutral" | "Negative";
type Status = "New" | "To review" | "Done" | "Ignored";
type PeriodMode = "All" | "Month" | "Year" | "Custom period";
type Answer = { question: string; category: string; score: number; date?: string; seniority?: string; source?: string; importId?: string };
type Verbatim = { id: string; content: string; question: string; category: string; score?: number; sentiment?: Sentiment; date?: string; role?: string; seniority?: string; source: string; sheet: string; status: Status; note: string; importId?: string };
type ImportItem = { id: string; name: string; size: number; importedAt: string; status: "Completed" | "Error"; rows: number; verbatims: number; error?: string };
type Dataset = { answers: Answer[]; verbatims: Verbatim[]; imports: ImportItem[] };

const EMPTY: Dataset = { answers: [], verbatims: [], imports: [] };
const scoreMap: Record<string, number> = { "no way": 1, meh: 2, bof: 2, ok: 3, great: 4, "top!": 4, top: 4 };
const mapAnswerToScore = (value: unknown): number | null => {
  if (typeof value === "number" && value >= 1 && value <= 4) return value;
  const numeric = Number(String(value).trim());
  if (numeric >= 1 && numeric <= 4) return numeric;
  return scoreMap[String(value).trim().toLowerCase()] ?? null;
};
const scoreToSentiment = (score?: number): Sentiment | undefined => score == null ? undefined : score >= 3.5 ? "Positive" : score >= 2.5 ? "Neutral" : "Negative";
const areaScoreColor = (score: number) => score >= 3 ? "#514fe2" : score >= 2 ? "#777b8e" : "#bd3038";
const average = (numbers: number[]) => numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : undefined;
const median = (numbers: number[]) => { const s = [...numbers].sort((a,b)=>a-b); return s.length ? s[Math.floor(s.length / 2)] : undefined; };
const norm = (x: unknown) => String(x ?? "").toLowerCase().replace(/\s+/g, " ");
const categoryOf = (question: string) => {
  const q = norm(question);
  if (/atmosphere|ambiance|work environment/.test(q)) return "Work environment";
  if (/mission/.test(q)) return "Missions";
  if (/event/.test(q)) return "Events";
  if (/grow professionally|development|career/.test(q)) return "Development";
  if (/compensation|salary/.test(q)) return "Salary";
  if (/pom|manager/.test(q)) return "POM";
  if (/material|resources/.test(q)) return "Material";
  if (/proud/.test(q)) return "Proudness";
  return "Other";
};
const isComment = (header: string, value: unknown) => {
  const h = norm(header), v = String(value ?? "").trim();
  return v.length >= 18 && (/elaborate|improved|holding you back|main issue|mainly missing|wish to explain/.test(h));
};
const dateLabel = (date?: string) => date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable";
const dateValue = (date?: string) => {
  const parsed = date && new Date(date);
  if (!parsed || Number.isNaN(+parsed)) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const isWithinDateRange = (date: string | undefined, from: string, to: string) => {
  if (!from && !to) return true;
  const value = dateValue(date);
  if (!value) return false;
  return (!from || value >= from) && (!to || value <= to);
};
const periodBounds = (mode: PeriodMode, month: string, year: string, from: string, to: string) => {
  if (mode === "All") return { from: "", to: "" };
  if (mode === "Month" && month) {
    const [yearValue, monthValue] = month.split("-").map(Number);
    const lastDay = new Date(yearValue, monthValue, 0).getDate();
    return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
  }
  if (mode === "Year" && /^\d{4}$/.test(year)) return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (mode === "Custom period") return { from, to };
  return { from: "", to: "" };
};
const period = (date?: string) => { const d = date && new Date(date); return d && !Number.isNaN(+d) ? `Q${Math.floor(d.getMonth()/3)+1} ${d.getFullYear()}` : "Undated"; };
const isFromImport = (item: Answer | Verbatim, target: ImportItem, imports: ImportItem[]) => {
  if (item.importId) return item.importId === target.id;
  if ("source" in item && item.source === target.name) return true;
  const completedImports = imports.filter(i => i.status === "Completed");
  return completedImports.length === 1 && completedImports[0].id === target.id;
};

function parseWorkbook(file: File, importId: string): Promise<{ answers: Answer[]; verbatims: Verbatim[]; rows: number }> {
  return file.arrayBuffer().then(async (buffer) => {
    const json = file.name.toLowerCase().endsWith(".json")
      ? JSON.parse(await file.text()) as unknown
      : null;
    const sheets: { name: string; rows: Record<string, unknown>[] }[] = json
      ? [{ name: "JSON", rows: Array.isArray(json) ? json.filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row)) : [] }]
      : (() => {
          const workbook = XLSX.read(buffer, { cellDates: true });
          // The People Pulse raw response sheet is the canonical V1 schema.
          // Deliberately ignore the workbook's calculated and summary tabs (Notas, Sheet2, Sheet3).
          const names = /\.csv$/i.test(file.name) ? workbook.SheetNames : workbook.SheetNames.filter((name) => /^feuil1$/i.test(name));
          if (!names.length) throw new Error("Expected the People Pulse response sheet named 'Feuil1'");
          return names.map((name) => ({ name, rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: "", raw: false }) }));
        })();
    if (json && !sheets[0].rows.length) throw new Error("JSON must be an array of survey response objects");
    const answers: Answer[] = []; const verbatims: Verbatim[] = []; let rows = 0;
    sheets.forEach(({ name: sheetName, rows: sheetRows }) => {
      const headers = sheetRows[0] ? Object.keys(sheetRows[0]) : []; const rawSheet = /feuil1|csv|json/i.test(sheetName) || /\.(csv|json)$/i.test(file.name);
      if (!rawSheet || !headers.some((h) => /completion time|start time|country|role/i.test(h))) return;
      rows += sheetRows.length;
      sheetRows.forEach((row) => {
        const date = String(row[headers.find((h) => /completion time|start time/i.test(h)) ?? ""] || "") || undefined;
        const role = String(row[headers.find((h) => /core role|role/i.test(h)) ?? ""] || "") || undefined;
        const seniority = String(row[headers.find((h) => /how long|seniority/i.test(h)) ?? ""] || "") || undefined;
        headers.forEach((header) => {
          const value = row[header]; const score = mapAnswerToScore(value); const category = categoryOf(header);
          if (score !== null && category !== "Other") answers.push({ question: header, category, score, date, seniority, source: file.name, importId });
          if (isComment(header, value)) {
            const related = [...answers].reverse().find((a: Answer) => a.date === date && a.category !== "Other");
            verbatims.push({ id: crypto.randomUUID(), content: String(value).trim(), question: header, category: related?.category ?? category, score: related?.score, sentiment: scoreToSentiment(related?.score), date, role, seniority, source: file.name, sheet: sheetName, status: "New", note: "", importId });
          }
        });
      });
    });
    return { answers, verbatims, rows };
  });
}

const Metric = ({ label, value, sub }: { label: string; value?: string; sub?: string }) => <section className="metric"><span>{label}</span><strong>{value ?? "Data unavailable"}</strong>{sub && <small>{sub}</small>}</section>;
const Empty = ({ title, detail }: { title: string; detail: string }) => <div className="empty"><FileSpreadsheet size={30}/><h3>{title}</h3><p>{detail}</p></div>;

function App() {
  const [page, setPage] = useState<"dashboard" | "verbatims" | "reports">("dashboard");
  const [data, setData] = useState<Dataset>(() => { try { return JSON.parse(localStorage.getItem("cellspain-data") || "null") ?? EMPTY; } catch { return EMPTY; } });
  const [query, setQuery] = useState(""); const [sentiment, setSentiment] = useState("All"); const [category, setCategory] = useState("All");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("All"); const [periodMonth, setPeriodMonth] = useState(""); const [periodYear, setPeriodYear] = useState("");
  const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Verbatim | null>(null); const input = useRef<HTMLInputElement>(null);
  useEffect(() => localStorage.setItem("cellspain-data", JSON.stringify(data)), [data]);
  const importFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const base = { id: crypto.randomUUID(), name: file.name, size: file.size, importedAt: new Date().toISOString(), status: "Completed" as const, rows: 0, verbatims: 0 };
      try { const parsed = await parseWorkbook(file, base.id); setData((d) => ({ answers: [...d.answers, ...parsed.answers], verbatims: [...d.verbatims, ...parsed.verbatims], imports: [{ ...base, rows: parsed.rows, verbatims: parsed.verbatims.length }, ...d.imports] })); }
      catch (err) { setData((d) => ({ ...d, imports: [{ ...base, status: "Error", error: err instanceof Error ? err.message : "Unreadable file" }, ...d.imports] })); }
    }
  };
  const removeImport = (item: ImportItem) => {
    const message = item.status === "Completed"
      ? `Remove "${item.name}" and its imported data from this dashboard?`
      : `Remove "${item.name}" from the import history?`;
    if (!window.confirm(message)) return;
    setData((d) => ({
      answers: item.status === "Completed" ? d.answers.filter(a => !isFromImport(a, item, d.imports)) : d.answers,
      verbatims: item.status === "Completed" ? d.verbatims.filter(v => !isFromImport(v, item, d.imports)) : d.verbatims,
      imports: d.imports.filter(i => i.id !== item.id),
    }));
  };
  const activePeriod = periodBounds(periodMode, periodMonth, periodYear, dateFrom, dateTo);
  const filteredAnswers = data.answers.filter(a => isWithinDateRange(a.date, activePeriod.from, activePeriod.to));
  const filteredVerbatims = data.verbatims.filter(v => isWithinDateRange(v.date, activePeriod.from, activePeriod.to));
  const categories = [...new Set(data.answers.map(a => a.category))];
  const dashboardCategories = [...new Set(filteredAnswers.map(a => a.category))];
  const scores = filteredAnswers.map(a=>a.score); const avg = average(scores); const med = median(scores);
  const byCategory = dashboardCategories.map(name => ({ name, value: average(filteredAnswers.filter(a=>a.category===name).map(a=>a.score))! })).filter(x=>x.value);
  const categoryRadar = dashboardCategories.map(name => ({
    category: name,
    answers: Number((average(filteredAnswers.filter(a=>a.category===name).map(a=>a.score)) ?? 0).toFixed(2)),
    forms: Number((average(filteredVerbatims.filter(v=>v.category===name && v.score != null).map(v=>v.score!)) ?? 0).toFixed(2)),
  })).filter(x => x.answers || x.forms);
  const periods = [...new Set(filteredAnswers.map(a=>period(a.date)))].filter(x=>x!=="Undated").map(name => ({ name, value: average(filteredAnswers.filter(a=>period(a.date)===name).map(a=>a.score))! }));
  const filtered = filteredVerbatims.filter(v => (sentiment === "All" || v.sentiment === sentiment) && (category === "All" || v.category === category) && `${v.content} ${v.question}`.toLowerCase().includes(query.toLowerCase()));
  const nav = [{ id:"dashboard", label:"Dashboard", icon:LayoutDashboard }, { id:"verbatims", label:"Verbatims", icon:MessageSquareText }, { id:"reports", label:"Reports", icon:BarChart3 }] as const;
  return <div className="app">
    <header><div className="brand">CellSpain</div><nav>{nav.map(n => <button key={n.id} className={page===n.id?"active":""} onClick={()=>setPage(n.id)}><n.icon size={16}/>{n.label}</button>)}</nav><div className="header-tools"><Settings size={19}/><span>Local analysis · offline</span></div></header>
    <main>
      {page === "dashboard" && <><div className="title"><div><h1>Employee Satisfaction Dashboard</h1><p>Analysis built only from your imported survey responses.</p></div><div className="title-actions"><DateFilters mode={periodMode} setMode={setPeriodMode} month={periodMonth} setMonth={setPeriodMonth} year={periodYear} setYear={setPeriodYear} dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo}/><button className="outline" onClick={()=>setPage("reports")}>Manage imports</button></div></div>
        {!data.answers.length ? <Empty title="No imported files yet" detail="Import an Excel, CSV or JSON survey file to populate the dashboard."/> : !scores.length ? <Empty title="No data in selected period" detail="Try widening or clearing the period filter."/> : <>
          <div className="metrics"><Metric label="Overall average" value={`${avg!.toFixed(1)}/4`} sub="Numeric scores use the source 1–4 scale"/><Metric label="Overall median" value={`${med!.toFixed(1)}/4`}/><Metric label="Responses scored" value={String(scores.length)}/><Metric label="Verbatims detected" value={String(filteredVerbatims.length)}/></div>
          <div className="dashboard-grid"><ChartCard title="Trend in overall ratings" values={periods}/><RadarCard values={categoryRadar}/></div>
          <section className="card categories"><h2>Average by area</h2>{byCategory.map(c=><div className="bar-row" key={c.name}><span>{c.name}</span><div><i style={{width:`${c.value/4*100}%`,background:areaScoreColor(c.value)}}/></div><b>{c.value.toFixed(1)}</b></div>)}</section>
          <section className="card"><h2>Average by length of service</h2><div className="seniority">{[...new Set(filteredAnswers.map(a=>a.seniority).filter(Boolean))].map(name=>{const value=average(filteredAnswers.filter(a=>a.seniority===name).map(a=>a.score)); return <div key={name}><i style={{height:`${(value??0)/4*150}px`}}/><span>{name}</span><b>{value?.toFixed(1)}</b></div>})}</div></section>
          <Quotes items={filteredVerbatims.slice(0,3)} onOpen={setSelected}/></>}
      </>}
      {page === "verbatims" && <><div className="title"><div><h1>Verbatims</h1><p>{data.verbatims.length ? `${data.verbatims.length} real comments detected in imported files` : "No free-text comments have been detected yet."}</p></div></div>
        {!data.verbatims.length ? <Empty title="No verbatims available" detail="Import a survey that includes real free-text comment columns."/> : <><div className="filters"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search keywords, phrases or topics…"/><Select value={sentiment} onChange={setSentiment} options={["All", "Positive", "Neutral", "Negative"]}/><Select value={category} onChange={setCategory} options={["All", ...categories]}/><DateFilters mode={periodMode} setMode={setPeriodMode} month={periodMonth} setMonth={setPeriodMonth} year={periodYear} setYear={setPeriodYear} dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo}/></div><div className="verbatim-list">{filtered.map(v=><VerbatimCard key={v.id} item={v} onOpen={setSelected}/>)}</div>{!filtered.length && <Empty title="No matching comments" detail="Try clearing some filters."/>}</>}
      </>}
      {page === "reports" && <><div className="title"><div><h1>Import data</h1><p>Files remain on this device. No information is sent online.</p></div></div>
        <section className="import-area" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); importFiles(e.dataTransfer.files)}} onClick={()=>input.current?.click()}><input ref={input} hidden type="file" accept=".xlsx,.xls,.csv,.json" multiple onChange={e=>e.target.files && importFiles(e.target.files)}/><span className="upload"><Upload size={27}/></span><h2>Drop your files here</h2><p>or select files from your computer</p><button className="primary" onClick={e=>{e.stopPropagation(); input.current?.click()}}><FolderOpen size={17}/> Browse files</button><small>Accepted formats: XLSX, CSV, JSON</small></section>
        <section className="recent"><div><h2>Recent imports</h2><span>{data.imports.length} file{data.imports.length!==1?"s":""}</span></div>{!data.imports.length ? <Empty title="No imported files yet" detail="Your successful imports will appear here."/> : <table><thead><tr><th>File name</th><th>Status</th><th>Imported</th><th>Size</th><th>Rows</th><th>Verbatims</th><th>Actions</th></tr></thead><tbody>{data.imports.map(i=><tr key={i.id}><td><FileText size={17}/>{i.name}</td><td><span className={`status ${i.status.toLowerCase()}`}>{i.status === "Completed" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {i.status}</span></td><td>{dateLabel(i.importedAt)}</td><td>{(i.size/1024).toFixed(1)} KB</td><td>{i.rows}</td><td>{i.verbatims}</td><td><button className="icon danger" title={`Remove ${i.name}`} onClick={()=>removeImport(i)}><Trash2 size={16}/></button></td></tr>)}</tbody></table>}</section>
      </>}
    </main>{selected && <Details item={selected} onClose={()=>setSelected(null)} onSave={(patch)=>{setData(d=>({...d,verbatims:d.verbatims.map(v=>v.id===selected.id?{...v,...patch}:v)}));setSelected({...selected,...patch});}}/>}
  </div>;
}
const Select = ({ value, onChange, options }: { value:string; onChange:(v:string)=>void; options:string[] }) => <label className="select">{value}<ChevronDown size={16}/><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(x=><option key={x}>{x}</option>)}</select></label>;
const DateFilters = ({ mode, setMode, month, setMonth, year, setYear, dateFrom, dateTo, setDateFrom, setDateTo }: { mode:PeriodMode; setMode:(v:PeriodMode)=>void; month:string; setMonth:(v:string)=>void; year:string; setYear:(v:string)=>void; dateFrom:string; dateTo:string; setDateFrom:(v:string)=>void; setDateTo:(v:string)=>void }) => {
  const hasValue = Boolean(month || year || dateFrom || dateTo);
  const clear = () => { setMonth(""); setYear(""); setDateFrom(""); setDateTo(""); };
  return <><Select value={mode} onChange={v=>setMode(v as PeriodMode)} options={["All", "Month", "Year", "Custom period"]}/>{mode === "Month" && <label className="date-filter"><CalendarDays size={16}/><span>Month</span><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>}{mode === "Year" && <label className="date-filter"><CalendarDays size={16}/><span>Year</span><input type="number" min="1900" max="2100" step="1" value={year} placeholder="2026" onChange={e=>setYear(e.target.value)}/></label>}{mode === "Custom period" && <><label className="date-filter"><CalendarDays size={16}/><span>From</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={e=>setDateFrom(e.target.value)}/></label><label className="date-filter"><CalendarDays size={16}/><span>To</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={e=>setDateTo(e.target.value)}/></label></>}{hasValue && <button className="clear-filter" onClick={clear}>Clear period</button>}</>;
};
const ChartCard = ({title,values}:{title:string;values:{name:string;value:number}[]}) => <section className="card chart"><h2>{title}</h2>{values.length > 1 ? <><svg viewBox="0 0 600 220" preserveAspectRatio="none"><path d={`M ${values.map((v,i)=>`${i/(values.length-1)*580+10},${200-(v.value/4*170)}`).join(" L ")}`} fill="none" stroke="currentColor" strokeWidth="4"/></svg><div className="axis">{values.map(x=><span key={x.name}>{x.name}</span>)}</div></> : <p className="unavailable">At least two dated periods are needed to show a trend.</p>}</section>;
const RadarCard = ({values}:{values:{category:string;answers:number;forms:number}[]}) => <section className="card radar-card"><h2>Categories radar</h2>{values.length >= 3 ? <ResponsiveContainer width="100%" height={280}><RadarChart data={values} outerRadius="72%"><PolarGrid stroke="#cfd2e2"/><PolarAngleAxis dataKey="category" tick={{ fill:"#4e5064", fontSize:12 }}/><PolarRadiusAxis angle={90} domain={[0,4]} tickCount={5} tick={{ fill:"#777b8e", fontSize:11 }}/><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}/4`, "Score"]}/><Legend iconType="plainline"/><Radar name="App categories" dataKey="answers" stroke="#4847dc" fill="#4847dc" fillOpacity={0.18} strokeWidth={2}/><Radar name="Forms verbatims" dataKey="forms" stroke="#b75555" fill="#b75555" fillOpacity={0.12} strokeWidth={2}/></RadarChart></ResponsiveContainer> : <p className="unavailable">At least three categories are needed to show a radar chart.</p>}</section>;
const Quotes = ({items,onOpen}:{items:Verbatim[];onOpen:(v:Verbatim)=>void}) => items.length ? <section className="quotes"><h2>Verbatim quotes</h2><div>{items.map(v=><VerbatimCard key={v.id} item={v} compact onOpen={onOpen}/>)}</div></section> : null;
const VerbatimCard = ({item,onOpen,compact=false}:{item:Verbatim;onOpen:(v:Verbatim)=>void;compact?:boolean}) => <article className={`verbatim ${compact?"compact":""}`}><div className="verbatim-top"><span><MessageSquareText size={18}/> {item.role || "Anonymous respondent"}</span>{item.sentiment && <em className={item.sentiment.toLowerCase()}>{item.sentiment}</em>}</div><p>“{item.content}”</p><footer><span><Clock3 size={14}/>{dateLabel(item.date)} · {item.category}</span><button className="primary" onClick={()=>onOpen(item)}>See details</button></footer></article>;
const Details = ({item,onClose,onSave}:{item:Verbatim;onClose:()=>void;onSave:(p:Partial<Verbatim>)=>void}) => <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={onClose}><X/></button><span className={`sentiment ${item.sentiment?.toLowerCase()}`}>{item.sentiment ?? "Score unavailable"}</span><h2>Comment details</h2><blockquote>“{item.content}”</blockquote><dl><dt>Question</dt><dd>{item.question}</dd><dt>Source</dt><dd>{item.source} · {item.sheet}</dd><dt>Category</dt><dd>{item.category}</dd><dt>Score</dt><dd>{item.score ? `${item.score}/4` : "Unavailable"}</dd><dt>Date</dt><dd>{dateLabel(item.date)}</dd></dl><label>Local status<Select value={item.status} onChange={status=>onSave({status:status as Status})} options={["New","To review","Done","Ignored"]}/></label><label>Internal note<textarea value={item.note} onChange={e=>onSave({note:e.target.value})} placeholder="Private note stored on this device…"/></label></section></div>;
export default App;
