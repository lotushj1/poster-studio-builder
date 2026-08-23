/**
 * 進階字體：只有 config.fonts.localCatalog 明確開啟後，才讀取使用者電腦已安裝的字體
 * （Local Font Access API，桌面版 Chrome／Edge）。預設使用固定繁中安全字體堆疊；
 * 其他瀏覽器降級為「直接輸入字體名稱＋可用性偵測」。不做字體上傳。
 */

export interface LocalFontFace {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

export interface LocalFontFamily {
  family: string;
  faces: LocalFontFace[];
}

interface FontDataLike {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
  blob(): Promise<Blob>;
}

type QueryLocalFonts = (options?: { postscriptNames?: string[] }) => Promise<FontDataLike[]>;

export function supportsLocalFonts(): boolean {
  return typeof window !== "undefined" && typeof (window as unknown as { queryLocalFonts?: unknown }).queryLocalFonts === "function";
}

/** 讀取本機字體清單（必須在使用者點擊之後呼叫；第一次會跳權限提示） */
export async function queryLocalFontFamilies(): Promise<LocalFontFamily[]> {
  const q = (window as unknown as { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts;
  if (!q) throw new Error("unsupported");
  const list = await q.call(window);
  const byFamily = new Map<string, LocalFontFace[]>();
  for (const f of list) {
    const arr = byFamily.get(f.family) ?? [];
    arr.push({ family: f.family, fullName: f.fullName, postscriptName: f.postscriptName, style: f.style });
    byFamily.set(f.family, arr);
  }
  const families = Array.from(byFamily.entries()).map(([family, faces]) => ({
    family,
    faces: faces.sort((a, b) => faceWeight(a.style) - faceWeight(b.style) || a.style.localeCompare(b.style)),
  }));
  families.sort((a, b) => a.family.localeCompare(b.family, "zh-Hant"));
  return families;
}

const WEIGHT_WORDS: [RegExp, number][] = [
  [/thin|hairline|w1\b/i, 100],
  [/extra ?light|ultra ?light|w2\b/i, 200],
  [/\blight|w3\b/i, 300],
  [/regular|normal|book|roman|w4\b/i, 400],
  [/medium|w5\b/i, 500],
  [/semi ?bold|demi ?bold|w6\b/i, 600],
  [/extra ?bold|ultra ?bold|w8\b/i, 800],
  [/\bbold|w7\b/i, 700],
  [/black|heavy|w9\b/i, 900],
];

/** 從字型樣式名稱（Bold、Medium、W6…）推出 CSS 字重 */
export function faceWeight(style: string): number {
  for (const [re, w] of WEIGHT_WORDS) if (re.test(style)) return w;
  const num = /(\d{3})/.exec(style);
  if (num) return Number(num[1]);
  return 400;
}

export function faceStyle(style: string): "normal" | "italic" {
  return /italic|oblique/i.test(style) ? "italic" : "normal";
}

const pinned = new Set<string>();

/**
 * 把選到的確切字型（例如「粉圓 W6」）載入成 FontFace，
 * 讓 canvas 與 CSS 用家族名＋字重就能對到這個字型。
 */
export async function pinFace(face: LocalFontFace): Promise<boolean> {
  if (pinned.has(face.postscriptName)) return true;
  const q = (window as unknown as { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts;
  if (!q || typeof FontFace === "undefined") return false;
  try {
    const [data] = await q.call(window, { postscriptNames: [face.postscriptName] });
    if (!data) return false;
    const blob = await data.blob();
    const buf = await blob.arrayBuffer();
    const ff = new FontFace(face.family, buf, {
      weight: String(faceWeight(face.style)),
      style: faceStyle(face.style),
    });
    await ff.load();
    document.fonts.add(ff);
    pinned.add(face.postscriptName);
    return true;
  } catch {
    return false;
  }
}

/* ---------- 不支援 API 時的降級：用 canvas 量寬度判斷字體是否存在 ---------- */

let probeCtx: CanvasRenderingContext2D | null = null;
const availabilityCache = new Map<string, boolean>();
const PROBE_TEXT = "字體測試 台北東京 mmmwwwiiilll 0123 ABC";

export function isFontAvailable(family: string): boolean {
  const name = family.trim();
  if (!name) return false;
  const cached = availabilityCache.get(name);
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return false;
  if (!probeCtx) {
    const c = document.createElement("canvas");
    probeCtx = c.getContext("2d");
  }
  const ctx = probeCtx;
  if (!ctx) return false;
  const safe = name.replace(/"/g, '\\"');
  let available = false;
  for (const base of ["monospace", "sans-serif", "serif"]) {
    ctx.font = `48px ${base}`;
    const w1 = ctx.measureText(PROBE_TEXT).width;
    ctx.font = `48px "${safe}", ${base}`;
    const w2 = ctx.measureText(PROBE_TEXT).width;
    if (Math.abs(w1 - w2) > 0.5) {
      available = true;
      break;
    }
  }
  availabilityCache.set(name, available);
  return available;
}

export function clearAvailabilityCache(): void {
  availabilityCache.clear();
}

/** 台灣常見的中文字體（系統內建＋常用免費字體）；只會顯示使用者電腦有裝的 */
export const SUGGESTED_ZH_FONTS: { family: string; label: string }[] = [
  { family: "PingFang TC", label: "蘋方" },
  { family: "Heiti TC", label: "黑體" },
  { family: "Songti TC", label: "宋體" },
  { family: "Kaiti TC", label: "楷體" },
  { family: "Microsoft JhengHei", label: "微軟正黑體" },
  { family: "DFKai-SB", label: "標楷體" },
  { family: "PMingLiU", label: "新細明體" },
  { family: "Noto Sans TC", label: "思源黑體（Noto Sans TC）" },
  { family: "Noto Sans CJK TC", label: "思源黑體（CJK TC）" },
  { family: "Source Han Sans TC", label: "思源黑體（Source Han Sans）" },
  { family: "Noto Serif TC", label: "思源宋體（Noto Serif TC）" },
  { family: "Noto Serif CJK TC", label: "思源宋體（CJK TC）" },
  { family: "Source Han Serif TC", label: "思源宋體（Source Han Serif）" },
  { family: "jf open 粉圓 2.0", label: "粉圓 2.0" },
  { family: "jf-openhuninn-2.0", label: "粉圓 2.0（英文名）" },
  { family: "Huninn", label: "粉圓（Huninn）" },
  { family: "GenSenRounded TW", label: "源泉圓體" },
  { family: "GenSenRounded2 TW", label: "源泉圓體 2" },
  { family: "GenYoGothic TW", label: "源樣黑體" },
  { family: "GenRyuMin TW", label: "源流明體" },
  { family: "GenWanMin TW", label: "源雲明體" },
  { family: "GenJyuuGothic", label: "源柔黑體" },
  { family: "Taipei Sans TC Beta", label: "台北黑體" },
  { family: "Iansui", label: "芫荽" },
  { family: "LXGW WenKai TC", label: "霞鶩文楷 TC" },
  { family: "Chiron Hei HK", label: "昭源黑體" },
  { family: "Chiron Sung HK", label: "昭源宋體" },
  { family: "Cubic 11", label: "俐方體 11 號" },
  { family: "Yozai", label: "悠哉字體" },
  { family: "ChenYuluoyan", label: "辰宇落雁體" },
  { family: "Zen Maru Gothic", label: "Zen Maru Gothic" },
  { family: "Zen Kaku Gothic New", label: "Zen Kaku Gothic" },
  { family: "Klee One", label: "Klee One" },
  { family: "Shippori Mincho", label: "Shippori Mincho" },
  { family: "Hiragino Sans", label: "Hiragino 角黑" },
  { family: "Hiragino Mincho ProN", label: "Hiragino 明朝" },
  { family: "Arial", label: "Arial" },
  { family: "Helvetica Neue", label: "Helvetica Neue" },
  { family: "Georgia", label: "Georgia" },
  { family: "Futura", label: "Futura" },
  { family: "Avenir Next", label: "Avenir Next" },
  { family: "Impact", label: "Impact" },
];

/** 過濾出目前電腦有安裝的建議字體 */
export function availableSuggestedFonts(extra: string[] = []): { family: string; label: string }[] {
  const seen = new Set<string>();
  const list: { family: string; label: string }[] = [];
  for (const f of [...extra.map((family) => ({ family, label: family })), ...SUGGESTED_ZH_FONTS]) {
    if (seen.has(f.family)) continue;
    seen.add(f.family);
    if (isFontAvailable(f.family)) list.push(f);
  }
  return list;
}

export const WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 300, label: "細" },
  { value: 400, label: "一般" },
  { value: 500, label: "中" },
  { value: 700, label: "粗" },
  { value: 900, label: "特粗" },
];
