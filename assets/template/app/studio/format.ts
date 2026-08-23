/**
 * 文字樣板與日期格式：把 "{title}"、"{date:M月D日（ddd）}" 換成實際值。
 */
import type { FieldDef, FieldValue, Values } from "./types";

const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 解析 YYYY-MM-DD 為本地時間的 Date；失敗回 null */
export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * 日期格式化。支援 YYYY YY MM M DD D dddd ddd d；
 * 時間（HH:mm 字串）支援 HH H mm A（上午／下午）h。
 */
export function formatDate(value: string, fmt: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  const y = date.getFullYear();
  const mo = date.getMonth() + 1;
  const d = date.getDate();
  const wd = date.getDay();
  return fmt.replace(/YYYY|YY|MM|M|DD|D|dddd|ddd|d/g, (tok) => {
    switch (tok) {
      case "YYYY":
        return String(y);
      case "YY":
        return String(y).slice(-2);
      case "MM":
        return pad(mo);
      case "M":
        return String(mo);
      case "DD":
        return pad(d);
      case "D":
        return String(d);
      case "dddd":
        return `星期${WEEKDAY_SHORT[wd]}`;
      case "ddd":
        return `週${WEEKDAY_SHORT[wd]}`;
      case "d":
        return WEEKDAY_SHORT[wd];
      default:
        return tok;
    }
  });
}

export function formatTime(value: string, fmt: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const H = Number(m[1]);
  const mm = m[2];
  const h12 = H % 12 === 0 ? 12 : H % 12;
  return fmt.replace(/HH|H|mm|hh|h|A/g, (tok) => {
    switch (tok) {
      case "HH":
        return pad(H);
      case "H":
        return String(H);
      case "mm":
        return mm;
      case "hh":
        return pad(h12);
      case "h":
        return String(h12);
      case "A":
        return H < 12 ? "上午" : "下午";
      default:
        return tok;
    }
  });
}

export function isImageValue(v: FieldValue): v is { src: string; focalX: number; focalY: number; zoom: number } {
  return typeof v === "object" && v !== null && "src" in v;
}

/** 把欄位值轉成可顯示的字串 */
export function valueToText(
  value: FieldValue | undefined,
  field: FieldDef | undefined,
  fmt?: string,
): string {
  if (value === undefined || value === null) return "";
  if (isImageValue(value)) return "";
  if (typeof value === "boolean") return value ? "是" : "";
  if (typeof value === "number") return String(value);
  if (field?.type === "date") return formatDate(value, fmt ?? "M/D");
  if (field?.type === "time") return formatTime(value, fmt ?? "HH:mm");
  if (field?.type === "select") {
    const opt = field.options.find((o) => o.value === value);
    return opt ? opt.label : value;
  }
  return value;
}

const PLACEHOLDER = /\{([a-zA-Z0-9_.-]+)(?::([^}]*))?\}/g;

/** 樣板字串裡有沒有佔位符 */
export function hasPlaceholder(template: string): boolean {
  PLACEHOLDER.lastIndex = 0;
  return PLACEHOLDER.test(template);
}

/** 樣板中用到的欄位 id */
export function placeholderIds(template: string): string[] {
  const ids: string[] = [];
  for (const m of template.matchAll(PLACEHOLDER)) ids.push(m[1]);
  return ids;
}

/** 套用樣板；找不到的欄位視為空字串 */
export function applyTemplate(
  template: string,
  values: Values,
  fields: Map<string, FieldDef>,
): string {
  return template.replace(PLACEHOLDER, (_all, id: string, fmt?: string) =>
    valueToText(values[id], fields.get(id), fmt),
  );
}

/** 樣板裡所有綁定欄位是否都是空的（用來決定要不要畫／顯示提示） */
export function allBoundEmpty(
  template: string,
  values: Values,
  fields: Map<string, FieldDef>,
): boolean {
  const ids = placeholderIds(template);
  if (ids.length === 0) return false;
  return ids.every((id) => valueToText(values[id], fields.get(id)) === "");
}

/** 匯出檔名：{name} {date} {variant} {fieldId}，並移除檔名不允許的字元 */
export function buildFilename(
  pattern: string,
  ctx: { name: string; variant: string; values: Values; fields: Map<string, FieldDef> },
): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const base = pattern.replace(PLACEHOLDER, (_all, id: string, fmt?: string) => {
    if (id === "name") return ctx.name;
    if (id === "date") return fmt ? formatDate(todayISO(now), fmt) : stamp;
    if (id === "variant") return ctx.variant;
    return valueToText(ctx.values[id], ctx.fields.get(id), fmt);
  });
  return (
    base
      .replace(/[\\/:*?"<>|\n\r\t]/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "poster"
  );
}
