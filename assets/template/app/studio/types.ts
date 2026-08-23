/**
 * Poster Studio 範本設定的型別定義。
 * 這個檔案描述 config.ts 可以寫什麼；引擎（engine.ts）與 UI（PosterStudio.tsx）都依這份型別運作。
 */

export interface Size {
  width: number;
  height: number;
}

/* ---------- 欄位（使用者每次填的東西） ---------- */

export type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "color"
  | "select"
  | "date"
  | "time"
  | "number"
  | "toggle";

interface FieldBase {
  id: string;
  label: string;
  type: FieldType;
  /** 表單分組標題；同 group 的欄位排在一起 */
  group?: string;
  hint?: string;
  placeholder?: string;
}

export interface TextFieldDef extends FieldBase {
  type: "text" | "textarea";
  default?: string;
  maxLength?: number;
}

export interface ImageFieldDef extends FieldBase {
  type: "image";
  /** 預設圖片（放在 public/ 的路徑，例如 "/assets/host.jpg"） */
  default?: string;
}

export interface ColorFieldDef extends FieldBase {
  type: "color";
  default: string;
  /** 快速色票 */
  swatches?: string[];
}

export interface SelectFieldDef extends FieldBase {
  type: "select";
  options: { value: string; label: string }[];
  default: string;
}

export interface DateFieldDef extends FieldBase {
  type: "date";
  /** "today" 或 ISO 日期（YYYY-MM-DD） */
  default?: string;
}

export interface TimeFieldDef extends FieldBase {
  type: "time";
  /** HH:mm */
  default?: string;
}

export interface NumberFieldDef extends FieldBase {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface ToggleFieldDef extends FieldBase {
  type: "toggle";
  default?: boolean;
}

export type FieldDef =
  | TextFieldDef
  | ImageFieldDef
  | ColorFieldDef
  | SelectFieldDef
  | DateFieldDef
  | TimeFieldDef
  | NumberFieldDef
  | ToggleFieldDef;

/** 圖片欄位的值：來源網址＋構圖（焦點與縮放） */
export interface ImageValue {
  src: string;
  /** 0..1，圖片哪個點對齊框的對應位置（0.5, 0.5 = 置中） */
  focalX: number;
  focalY: number;
  /** >= 1，1 = 剛好填滿 */
  zoom: number;
  name?: string;
  /** 本機儲存（IndexedDB）的鍵，重新整理後可還原 */
  key?: string;
}

export type FieldValue = string | number | boolean | ImageValue | null;
export type Values = Record<string, FieldValue>;

/* ---------- 字體 ---------- */

export interface FontSpec {
  /** 字體角色（對應 config.fonts.roles 的 key）；使用者可在 UI 整批換掉 */
  role?: string;
  /** 直接指定字體家族（不走角色） */
  family?: string;
  weight?: number | "normal" | "bold";
  style?: "normal" | "italic";
  /** 字級（px，相對於畫布尺寸） */
  size: number;
  /** CSS 備援字體，預設 sans-serif */
  fallback?: string;
}

export interface FontRole {
  label: string;
  family: string;
  weight?: number | "normal" | "bold";
  style?: "normal" | "italic";
  fallback?: string;
}

/* ---------- 圖層 ---------- */

export type AdjustableProp =
  | "x"
  | "y"
  | "scale"
  | "fontSize"
  | "color"
  | "opacity"
  | "letterSpacing"
  | "lineHeight";

export interface Shadow {
  color: string;
  blur: number;
  x?: number;
  y?: number;
}

export interface Stroke {
  color: string;
  width: number;
}

export interface LinearGradient {
  type: "linear";
  /** 角度（度），0 = 由下往上，90 = 由左往右，180 = 由上往下 */
  angle: number;
  stops: { offset: number; color: string }[];
}

/** 純色字串、"{fieldId}"（綁定顏色欄位）或線性漸層 */
export type Fill = string | LinearGradient;

interface LayerBase {
  id: string;
  /** 人看得懂的名稱，顯示在微調面板 */
  label?: string;
  /** 所屬模組 id；模組調整會套用到此圖層的整個幾何與文字比例 */
  moduleId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  /** 旋轉角度（度），以圖層中心旋轉 */
  rotate?: number;
  /**
   * 顯示條件："fieldId"（有值才顯示）、"!fieldId"（沒值才顯示）、"fieldId=value"
   */
  visibleIf?: string;
  /** 使用者可在「微調」面板調整的屬性 */
  adjustable?: AdjustableProp[];
  /** 只在預覽顯示、匯出時不畫（例如輔助線） */
  previewOnly?: boolean;
}

export interface RectLayer extends LayerBase {
  type: "rect";
  fill: Fill;
  radius?: number;
  stroke?: Stroke;
  shadow?: Shadow;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  /** "/assets/xxx.png"（固定素材）或 "{fieldId}"（綁定圖片欄位） */
  src: string;
  fit?: "cover" | "contain";
  shape?: "rect" | "rounded" | "circle";
  radius?: number;
  border?: Stroke;
  shadow?: Shadow;
  /** 固定素材的構圖預設值 */
  focalX?: number;
  focalY?: number;
  zoom?: number;
  grayscale?: boolean;
  /** 綁定欄位沒有圖片時，預覽顯示的提示文字 */
  placeholder?: string;
  /** 沒有圖片時的底色（預覽與匯出都畫） */
  emptyFill?: string;
}

export interface TextLayer extends LayerBase {
  type: "text";
  /** 可含 {fieldId} 佔位，日期可用 {date:M月D日} 格式 */
  text: string;
  font: FontSpec;
  /** 顏色或 "{fieldId}" */
  color: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  /** 行高倍數，預設 1.35 */
  lineHeight?: number;
  /** 字距（em），預設 0 */
  letterSpacing?: number;
  /** 最多行數；超過以「…」截斷 */
  maxLines?: number;
  /**
   * 文字放不下時自動縮小字級到放得下為止；true 表示最小縮到 font.size * 0.5
   */
  autoFit?: boolean | { min: number };
  stroke?: Stroke;
  shadow?: Shadow;
  /** 文字底色（每行一個圓角色塊，適合日期、標籤） */
  background?: {
    color: string;
    paddingX?: number;
    paddingY?: number;
    radius?: number;
  };
  /** 直排（由右至左、由上而下） */
  vertical?: boolean;
  uppercase?: boolean;
}

export type Layer = RectLayer | ImageLayer | TextLayer;

/* ---------- 變體與整份設定 ---------- */

export type ModuleAdjustableProp = "x" | "y" | "scale";

/**
 * 把一組圖層視為可一起移動／縮放的模組。
 * layerIds 必須只指向同一個 variant 內的圖層，避免跨變體共用調整值。
 */
export interface ModuleDef {
  id: string;
  label: string;
  layerIds: string[];
  adjustable?: ModuleAdjustableProp[];
}

export interface Variant {
  id: string;
  label: string;
  /** 這個變體的畫布尺寸；沒給就用 config.size（同一個工具要同時出直式與橫式時用） */
  size?: Size;
  /** 這個變體專屬的額外欄位 */
  fields?: FieldDef[];
  layers: Layer[];
  /** 這個變體專屬的模組；模組 id 不可跨變體重複 */
  modules?: ModuleDef[];
}

export interface ExportOptions {
  format?: "png" | "jpeg";
  /** jpeg 品質 0..1 */
  quality?: number;
  /** 檔名樣板，可用 {name}、{date}、{variant}、{fieldId} */
  filename?: string;
}

export interface DesignTokens {
  /** 工具介面與海報共用的墨色／紙色／線條色 */
  ink: string;
  paper: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  preview: string;
}

export interface DesignSystem {
  /** 版本化的設計標準，例如 mono-v1 */
  id: string;
  label: string;
  tokens: DesignTokens;
}

export interface TemplateConfig {
  /** 唯一識別，用於 localStorage 命名空間 */
  id: string;
  /** 設定版本；改了欄位結構時 +1，舊的本機資料會被忽略 */
  version: number;
  /** 工具名稱，顯示在標題列與檔名 */
  name: string;
  description?: string;
  size: Size;
  /** 預設視覺與介面標準；未設定時使用模板內建 mono-v1 中性黑白標準 */
  designSystem?: DesignSystem;
  /** 畫布底色（最底層），預設白色 */
  background?: Fill;
  /** 所有變體共用的欄位 */
  fields: FieldDef[];
  /** 至少一個；只有一個時不顯示切換器 */
  variants: Variant[];
  fonts?: {
    roles?: Record<string, FontRole>;
    /** 字體挑選器的快速選項（使用者電腦有裝才會顯示為可用） */
    suggested?: string[];
    /** 預設關閉，只有明確啟用才會請求 queryLocalFonts 權限 */
    localCatalog?: boolean;
  };
  export?: ExportOptions;
  ui?: {
    /** 介面強調色 */
    accent?: string;
    /** 標題列副標 */
    subtitle?: string;
    /** 預覽區底色 */
    previewBackground?: string;
    /** 方便後台／驗收辨識目前套用的設計標準 */
    designSystemId?: string;
  };
}

/* ---------- 執行期狀態 ---------- */

export interface LayerAdjustment {
  dx?: number;
  dy?: number;
  scale?: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  letterSpacing?: number;
  lineHeight?: number;
}

export type Adjustments = Record<string, LayerAdjustment>;

export type ModuleAdjustments = Record<string, LayerAdjustment>;

/** 使用者對字體角色的覆寫 */
export interface FontOverride {
  family: string;
  /** 指定的 PostScript 名稱（由本機字體清單選到的確切字重／字型） */
  postscriptName?: string;
  weight?: number | "normal" | "bold";
  style?: "normal" | "italic";
}

export type FontOverrides = Record<string, FontOverride>;

export interface StudioState {
  variantId: string;
  values: Values;
  adjustments: Adjustments;
  moduleAdjustments: ModuleAdjustments;
  fontOverrides: FontOverrides;
}
