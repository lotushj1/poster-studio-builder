/**
 * 純函式的文字排版引擎：斷行、截斷、自動縮字級、直排。
 * 不依賴 DOM，量測寬度由外部注入（瀏覽器用 canvas measureText，測試用假量測）。
 */

export interface TextMeasurer {
  /** 回傳目前字級下這段文字的寬度（px） */
  measure(text: string): number;
}

export interface LayoutOptions {
  maxWidth: number;
  /** 沒給就不限制高度 */
  maxHeight?: number;
  maxLines?: number;
  fontSize: number;
  /** 行高倍數 */
  lineHeight: number;
  /** 字距（px） */
  letterSpacing: number;
}

export interface LaidOutLine {
  text: string;
  /** 橫排＝寬度；直排＝欄高 */
  width: number;
}

export interface TextLayout {
  lines: LaidOutLine[];
  /** 每行（或每欄）的間距 px */
  lineHeightPx: number;
  /** 橫排＝總高度；直排＝總寬度 */
  totalHeight: number;
  truncated: boolean;
  fontSize: number;
}

const ELLIPSIS = "…";

// 不能出現在行首的標點（避頭點）
const CLOSING = new Set("，。、！？；：」』）】〉》〕｝,.!?;:)]}…～~%");
// 不能出現在行尾的標點（避尾點）
const OPENING = new Set("「『（【〈《〔｛([{");

let segmenter: Intl.Segmenter | null | undefined;

function getSegmenter(): Intl.Segmenter | null {
  if (segmenter !== undefined) return segmenter;
  try {
    segmenter =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null;
  } catch {
    segmenter = null;
  }
  return segmenter;
}

/** 拆成字素（處理 emoji、合字） */
export function graphemes(text: string): string[] {
  const seg = getSegmenter();
  if (seg) return Array.from(seg.segment(text), (s) => s.segment);
  return Array.from(text);
}

function isCJK(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x2e80 && code <= 0x9fff) || // CJK 部首、漢字
    (code >= 0xac00 && code <= 0xd7af) || // 韓文
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xffef) || // 全形符號
    (code >= 0x3000 && code <= 0x30ff) || // 日文假名、CJK 標點
    (code >= 0x20000 && code <= 0x2ffff)
  );
}

/**
 * 切成可斷行單位：中日韓每字一個；拉丁字母與數字連成一個詞；空白獨立。
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let word = "";
  for (const g of graphemes(text)) {
    if (g === " " || g === "\t") {
      if (word) {
        tokens.push(word);
        word = "";
      }
      tokens.push(" ");
    } else if (isCJK(g) || CLOSING.has(g) || OPENING.has(g)) {
      if (word) {
        tokens.push(word);
        word = "";
      }
      tokens.push(g);
    } else {
      word += g;
    }
  }
  if (word) tokens.push(word);
  return tokens;
}

/** 量測一段文字（含字距） */
export function measureRun(
  text: string,
  measurer: TextMeasurer,
  letterSpacing: number,
): number {
  if (!text) return 0;
  if (!letterSpacing) return measurer.measure(text);
  const gs = graphemes(text);
  let w = 0;
  for (const g of gs) w += measurer.measure(g);
  return w + letterSpacing * (gs.length - 1);
}

function fitWithEllipsis(
  text: string,
  maxWidth: number,
  measurer: TextMeasurer,
  ls: number,
): string {
  let gs = graphemes(text);
  while (gs.length > 0) {
    const candidate = gs.join("").replace(/\s+$/, "") + ELLIPSIS;
    if (measureRun(candidate, measurer, ls) <= maxWidth) return candidate;
    gs = gs.slice(0, -1);
  }
  return ELLIPSIS;
}

/** 硬切一個過長的詞（例如超長英文或網址） */
function breakLongToken(
  token: string,
  maxWidth: number,
  measurer: TextMeasurer,
  ls: number,
): string[] {
  const parts: string[] = [];
  let cur = "";
  for (const g of graphemes(token)) {
    const next = cur + g;
    if (cur && measureRun(next, measurer, ls) > maxWidth) {
      parts.push(cur);
      cur = g;
    } else {
      cur = next;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

function wrapParagraph(
  paragraph: string,
  opts: LayoutOptions,
  measurer: TextMeasurer,
): string[] {
  const ls = opts.letterSpacing;
  const lines: string[] = [];
  let line = "";
  const push = () => {
    lines.push(line.replace(/\s+$/, ""));
    line = "";
  };
  const tokens = tokenize(paragraph);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === " " && !line) continue; // 行首不留空白
    const candidate = line + tok;
    if (measureRun(candidate, measurer, ls) <= opts.maxWidth) {
      line = candidate;
      continue;
    }
    // 放不下
    if (!line) {
      // 單一 token 就超過寬度：硬切
      const parts = breakLongToken(tok, opts.maxWidth, measurer, ls);
      for (let p = 0; p < parts.length - 1; p++) {
        line = parts[p];
        push();
      }
      line = parts[parts.length - 1] ?? "";
      continue;
    }
    if (tok.length === 1 && CLOSING.has(tok)) {
      // 避頭點：標點懸掛在行尾
      line = candidate;
      continue;
    }
    // 避尾點：行尾若是開括號，把它帶到下一行
    const lineGs = graphemes(line);
    const last = lineGs[lineGs.length - 1];
    if (last && OPENING.has(last) && lineGs.length > 1) {
      line = lineGs.slice(0, -1).join("");
      push();
      line = last + (tok === " " ? "" : tok);
      continue;
    }
    push();
    if (tok !== " ") line = tok;
  }
  if (line || lines.length === 0) push();
  return lines;
}

/** 橫排版面 */
export function layoutText(
  text: string,
  opts: LayoutOptions,
  measurer: TextMeasurer,
): TextLayout {
  const lineHeightPx = opts.fontSize * opts.lineHeight;
  const ls = opts.letterSpacing;
  const byHeight =
    opts.maxHeight !== undefined
      ? Math.max(1, Math.floor((opts.maxHeight + 1e-6) / lineHeightPx))
      : Infinity;
  const limit = Math.min(opts.maxLines ?? Infinity, byHeight);

  const raw: string[] = [];
  for (const para of text.replace(/\r\n?/g, "\n").split("\n")) {
    raw.push(...wrapParagraph(para, opts, measurer));
  }

  let truncated = false;
  let kept = raw;
  if (raw.length > limit) {
    truncated = true;
    kept = raw.slice(0, limit);
    const lastIdx = kept.length - 1;
    kept[lastIdx] = fitWithEllipsis(kept[lastIdx], opts.maxWidth, measurer, ls);
  }

  const lines = kept.map((t) => ({ text: t, width: measureRun(t, measurer, ls) }));
  return {
    lines,
    lineHeightPx,
    totalHeight: lines.length * lineHeightPx,
    truncated,
    fontSize: opts.fontSize,
  };
}

/** 直排版面：每「行」是一欄，由右往左排；width 欄位代表欄高 */
export function layoutVertical(
  text: string,
  opts: LayoutOptions,
  measurer: TextMeasurer,
): TextLayout {
  void measurer;
  const advance = opts.fontSize + opts.letterSpacing;
  const colWidth = opts.fontSize * opts.lineHeight;
  const capacity = Math.max(
    1,
    Math.floor((opts.maxHeight ?? Infinity) / advance),
  );
  const maxCols = Math.min(
    opts.maxLines ?? Infinity,
    Math.max(1, Math.floor((opts.maxWidth + 1e-6) / colWidth)),
  );
  const cols: string[] = [];
  for (const para of text.replace(/\r\n?/g, "\n").split("\n")) {
    const gs = graphemes(para);
    if (gs.length === 0) {
      cols.push("");
      continue;
    }
    for (let i = 0; i < gs.length; i += capacity) {
      cols.push(gs.slice(i, i + capacity).join(""));
    }
  }
  let truncated = false;
  let kept = cols;
  if (cols.length > maxCols) {
    truncated = true;
    kept = cols.slice(0, maxCols);
    const last = graphemes(kept[kept.length - 1]);
    kept[kept.length - 1] = last.slice(0, Math.max(0, capacity - 1)).join("") + ELLIPSIS;
  }
  const lines = kept.map((t) => ({
    text: t,
    width: Math.max(0, graphemes(t).length * advance - opts.letterSpacing),
  }));
  return {
    lines,
    lineHeightPx: colWidth,
    totalHeight: lines.length * colWidth,
    truncated,
    fontSize: opts.fontSize,
  };
}

/**
 * 自動縮字級：從 opts.fontSize 往下找到放得下（不截斷、不超高）的最大字級。
 * measurerFor(size) 回傳該字級的量測器。
 */
export function fitText(
  text: string,
  opts: LayoutOptions,
  measurerFor: (size: number) => TextMeasurer,
  minSize: number,
  vertical = false,
): TextLayout {
  const layoutAt = (size: number) =>
    (vertical ? layoutVertical : layoutText)(
      text,
      { ...opts, fontSize: size, letterSpacing: opts.letterSpacing * (size / opts.fontSize) },
      measurerFor(size),
    );
  const fits = (l: TextLayout) =>
    !l.truncated &&
    (opts.maxHeight === undefined || l.totalHeight <= opts.maxHeight + 1e-6) &&
    l.lines.every((ln) => ln.width <= (vertical ? (opts.maxHeight ?? Infinity) : opts.maxWidth) + 1e-6);

  const first = layoutAt(opts.fontSize);
  if (fits(first)) return first;
  let lo = Math.max(1, Math.floor(minSize));
  let hi = Math.floor(opts.fontSize) - 1;
  let best = layoutAt(lo);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const l = layoutAt(mid);
    if (fits(l)) {
      best = l;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
