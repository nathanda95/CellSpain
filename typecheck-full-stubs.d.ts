declare namespace JSX {
  interface IntrinsicAttributes { key?: string | number }
  type InputEvent = { target: HTMLInputElement; currentTarget: HTMLInputElement };
  type SelectEvent = { target: HTMLSelectElement; currentTarget: HTMLSelectElement };
  type TextareaEvent = { target: HTMLTextAreaElement; currentTarget: HTMLTextAreaElement };
  interface IntrinsicElements {
    input: { onChange?: (event: InputEvent) => void; [key: string]: any };
    select: { onChange?: (event: SelectEvent) => void; [key: string]: any };
    textarea: { onChange?: (event: TextareaEvent) => void; [key: string]: any };
    button: { onClick?: (event: { stopPropagation(): void }) => void; [key: string]: any };
    section: { onMouseDown?: (event: { stopPropagation(): void }) => void; onDragOver?: (event: { preventDefault(): void }) => void; onDrop?: (event: { preventDefault(): void; dataTransfer: DataTransfer }) => void; [key: string]: any };
    [elemName: string]: any;
  }
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react" {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type DragEvent<T = Element> = {
    preventDefault(): void;
    dataTransfer: DataTransfer;
    currentTarget: T;
  };
  export type ChangeEvent<T = Element> = { target: T; currentTarget: T };
  export const Fragment: any;
  export const StrictMode: any;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useReducer<R extends (state: any, action: any) => any, I>(
    reducer: R,
    initializerArg: I,
    initializer: (arg: I) => ReturnType<R>,
  ): [ReturnType<R>, Dispatch<Parameters<R>[1]>];
}

declare module "react-dom/client" {
  export function createRoot(element: Element): { render(value: unknown): void };
}

declare module "lucide-react" {
  export const AlertCircle: any; export const BarChart3: any; export const CalendarDays: any;
  export const CheckCircle2: any; export const ChevronDown: any; export const ChevronLeft: any;
  export const ChevronRight: any; export const Clock3: any; export const Download: any;
  export const FileSpreadsheet: any; export const FileText: any; export const FolderOpen: any;
  export const LayoutDashboard: any; export const MessageSquareText: any; export const Plus: any;
  export const RotateCcw: any; export const Save: any; export const Search: any; export const Settings: any;
  export const Trash2: any; export const Upload: any; export const X: any;
}

declare module "recharts" {
  type AnyProps = { [key: string]: any };
  export function CartesianGrid(props: AnyProps): any;
  export function Line(props: AnyProps): any;
  export function LineChart(props: AnyProps): any;
  export function ResponsiveContainer(props: AnyProps): any;
  export function XAxis(props: AnyProps): any;
  export function Radar(props: AnyProps): any;
  export function RadarChart(props: AnyProps): any;
  export function PolarGrid(props: AnyProps): any;
  export function PolarAngleAxis(props: { tickFormatter?: (value: any) => any; [key: string]: any }): any;
  export function PolarRadiusAxis(props: { tickFormatter?: (value: any) => any; [key: string]: any }): any;
  export function YAxis(props: { tickFormatter?: (value: any) => any; [key: string]: any }): any;
  export function Tooltip(props: { formatter?: (value: any, name?: any) => any; [key: string]: any }): any;
  export function Legend(props: {
    onMouseEnter?: (entry: any) => void;
    onMouseLeave?: () => void;
    onClick?: (entry: any) => void;
    [key: string]: any;
  }): any;
}

declare module "xlsx" {
  export type WorkBook = { SheetNames: string[]; Sheets: Record<string, unknown> };
  export function read(data: ArrayBuffer, options?: unknown): WorkBook;
  export const utils: { sheet_to_json<T>(sheet: unknown, options?: unknown): T[] };
}

declare module "vitest" {
  export const describe: any; export const expect: any; export const it: any; export const beforeEach: any; export const vi: any;
}
