/**
 * Canvas 渲染引擎：把 TemplateConfig + 使用者填的值畫到 2D canvas。
 * 預覽與匯出共用同一套程式，所以看到什麼就匯出什麼。
 */
import type {
  Adjustments,
  FieldDef,
  Fill,
  FontOverrides,
  FontSpec,
  ImageLayer,
  ImageValue,
  Layer,
  LinearGradient,
  ModuleAdjustments,
  RectLayer,
  TemplateConfig,
  TextLayer,
  Values,
  Variant,
} from "./types";
import { layerGeometry, type Box } from "./geometry";
export { layerBox, layerGeometry, moduleBounds, transformBoxAround, type Box, type LayerGeometry } from "./geometry";
import {
  fitText,
  graphemes,
  layoutText,
  layoutVertical,
  type TextLayout,
  type TextMeasurer,
} from "./text";
import { allBoundEmpty, applyTemplate, isImageValue, placeholderIds } from "./format";

export interface ResolvedFont {
  family: string;
  weight: number | string;
  style: string;
  fallback: string;
}

export interface RenderInput {
  config: TemplateConfig;
  variant: Variant;
  values: Values;
  adjustments: Adjustments;
  /** 模組層級的移動／縮放；舊呼叫端省略時視為沒有模組調整 */
  moduleAdjustments?: ModuleAdjustments;
  fontOverrides: FontOverrides;
  /** key = 圖片來源字串（網址／blob URL／data URL） */
  images: Map<string, HTMLImageElement>;
  mode: "preview" | "export";
}

/* ---------- 欄位與可見性 ---------- */

export function fieldMap(config: TemplateConfig, variant: Variant): Map<string, FieldDef> {
  const m = new Map<string, FieldDef>();
  for (const f of config.fields) m.set(f.id, f);
  for (const f of variant.fields ?? []) m.set(f.id, f);
  return m;
}

function isEmptyValue(v: Values[string] | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "boolean") return !v;
  if (isImageValue(v)) return !v.src;
  return false;
}

export function layerVisible(layer: Layer, values: Values): boolean {
  const cond = layer.visibleIf;
  if (!cond) return true;
  const eq = cond.indexOf("=");
  if (eq > 0) {
    const id = cond.slice(0, eq);
    const want = cond.slice(eq + 1);
    const v = values[id];
    return String(v ?? "") === want;
  }
  if (cond.startsWith("!")) return isEmptyValue(values[cond.slice(1)]);
  return !isEmptyValue(values[cond]);
}

/* ---------- 字體 ---------- */

export function resolveFont(
  spec: FontSpec,
  config: TemplateConfig,
  overrides: FontOverrides,
): ResolvedFont {
  const fallback = spec.fallback ?? "sans-serif";
  if (spec.role) {
    const role = config.fonts?.roles?.[spec.role];
    const ov = overrides[spec.role];
    return {
      family: ov?.family ?? role?.family ?? spec.family ?? "sans-serif",
      weight: spec.weight ?? ov?.weight ?? role?.weight ?? "normal",
      style: spec.style ?? ov?.style ?? role?.style ?? "normal",
      fallback: role?.fallback ?? fallback,
    };
  }
  return {
    family: spec.family ?? "sans-serif",
    weight: spec.weight ?? "normal",
    style: spec.style ?? "normal",
    fallback,
  };
}

export function fontString(font: ResolvedFont, size: number): string {
  const family = font.family.includes(",")
    ? font.family
    : `"${font.family.replace(/"/g, '\\"')}"`;
  return `${font.style} ${font.weight} ${Math.max(1, size)}px ${family}, ${font.fallback}`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  b: Box,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, b.w / 2, b.h / 2));
  ctx.beginPath();
  if (r === 0) {
    ctx.rect(b.x, b.y, b.w, b.h);
    return;
  }
  ctx.moveTo(b.x + r, b.y);
  ctx.lineTo(b.x + b.w - r, b.y);
  ctx.arcTo(b.x + b.w, b.y, b.x + b.w, b.y + r, r);
  ctx.lineTo(b.x + b.w, b.y + b.h - r);
  ctx.arcTo(b.x + b.w, b.y + b.h, b.x + b.w - r, b.y + b.h, r);
  ctx.lineTo(b.x + r, b.y + b.h);
  ctx.arcTo(b.x, b.y + b.h, b.x, b.y + b.h - r, r);
  ctx.lineTo(b.x, b.y + r);
  ctx.arcTo(b.x, b.y, b.x + r, b.y, r);
  ctx.closePath();
}

function shapePath(ctx: CanvasRenderingContext2D, layer: ImageLayer, b: Box): void {
  if (layer.shape === "circle") {
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
    return;
  }
  roundRectPath(ctx, b, layer.shape === "rounded" ? (layer.radius ?? 24) : (layer.radius ?? 0));
}

/** 封面／包含模式的繪製矩形 */
export function imageDrawRect(
  iw: number,
  ih: number,
  box: Box,
  fit: "cover" | "contain",
  focalX: number,
  focalY: number,
  zoom: number,
): Box {
  const z = Math.max(0.1, zoom || 1);
  const base = fit === "contain" ? Math.min(box.w / iw, box.h / ih) : Math.max(box.w / iw, box.h / ih);
  const scale = base * z;
  const dw = iw * scale;
  const dh = ih * scale;
  const fx = clamp01(focalX);
  const fy = clamp01(focalY);
  // 圖比框大：用焦點決定裁切位置；圖比框小：用焦點決定擺放位置
  const x = box.x + (box.w - dw) * fx;
  const y = box.y + (box.h - dh) * fy;
  return { x, y, w: dw, h: dh };
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.5));
}

/* ---------- 填色 ---------- */

function makeGradient(ctx: CanvasRenderingContext2D, g: LinearGradient, b: Box): CanvasGradient {
  const a = ((g.angle ?? 180) * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(b.w * dx) + Math.abs(b.h * dy)) / 2;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const grad = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  for (const s of g.stops) grad.addColorStop(clamp01(s.offset), s.color);
  return grad;
}

export function resolveColor(value: string, values: Values, fallback = "#000000"): string {
  const m = /^\{([a-zA-Z0-9_.-]+)\}$/.exec(value.trim());
  if (!m) return value;
  const v = values[m[1]];
  return typeof v === "string" && v ? v : fallback;
}

function resolveFillStyle(
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  values: Values,
  b: Box,
): string | CanvasGradient {
  if (typeof fill === "string") return resolveColor(fill, values, "transparent");
  return makeGradient(ctx, fill, b);
}

function applyShadow(ctx: CanvasRenderingContext2D, s?: { color: string; blur: number; x?: number; y?: number }) {
  if (!s) return;
  ctx.shadowColor = s.color;
  ctx.shadowBlur = s.blur;
  ctx.shadowOffsetX = s.x ?? 0;
  ctx.shadowOffsetY = s.y ?? 0;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/* ---------- 圖層繪製 ---------- */

function drawRect(ctx: CanvasRenderingContext2D, layer: RectLayer, b: Box, input: RenderInput) {
  roundRectPath(ctx, b, layer.radius ?? 0);
  ctx.save();
  applyShadow(ctx, layer.shadow);
  ctx.fillStyle = resolveFillStyle(ctx, layer.fill, input.values, b);
  ctx.fill();
  ctx.restore();
  if (layer.stroke && layer.stroke.width > 0) {
    ctx.lineWidth = layer.stroke.width;
    ctx.strokeStyle = resolveColor(layer.stroke.color, input.values);
    ctx.stroke();
  }
}

/** 取得圖片圖層實際要畫的來源與構圖 */
export function resolveImageSource(
  layer: ImageLayer,
  values: Values,
): { src: string; focalX: number; focalY: number; zoom: number; bound: boolean; fieldId?: string } {
  const m = /^\{([a-zA-Z0-9_.-]+)\}$/.exec(layer.src.trim());
  if (m) {
    const v = values[m[1]];
    const iv: ImageValue | null = isImageValue(v) ? v : null;
    return {
      src: iv?.src ?? "",
      focalX: iv?.focalX ?? 0.5,
      focalY: iv?.focalY ?? 0.5,
      zoom: iv?.zoom ?? 1,
      bound: true,
      fieldId: m[1],
    };
  }
  return {
    src: layer.src,
    focalX: layer.focalX ?? 0.5,
    focalY: layer.focalY ?? 0.5,
    zoom: layer.zoom ?? 1,
    bound: false,
  };
}

function drawImage(ctx: CanvasRenderingContext2D, layer: ImageLayer, b: Box, input: RenderInput) {
  const source = resolveImageSource(layer, input.values);
  const img = source.src ? input.images.get(source.src) : undefined;
  const ready = !!img && img.complete && img.naturalWidth > 0;

  if (!ready) {
    if (layer.emptyFill) {
      shapePath(ctx, layer, b);
      ctx.fillStyle = resolveColor(layer.emptyFill, input.values);
      ctx.fill();
    }
    if (input.mode === "preview" && source.bound) {
      // 預覽提示：虛線框＋文字
      ctx.save();
      shapePath(ctx, layer, b);
      ctx.clip();
      if (!layer.emptyFill) {
        ctx.fillStyle = "rgba(127,127,127,0.12)";
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      shapePath(ctx, layer, b);
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(120,120,120,0.7)";
      ctx.stroke();
      ctx.setLineDash([]);
      const label = layer.placeholder ?? "點左側上傳圖片";
      const size = Math.max(14, Math.min(b.w, b.h) / 8);
      ctx.font = `500 ${size}px system-ui, "PingFang TC", "Noto Sans TC", sans-serif`;
      ctx.fillStyle = "rgba(90,90,90,0.85)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2, b.w - 16);
      ctx.restore();
    }
    return;
  }

  const draw = imageDrawRect(
    img.naturalWidth,
    img.naturalHeight,
    b,
    layer.fit ?? "cover",
    source.focalX,
    source.focalY,
    source.zoom,
  );

  if (layer.shadow) {
    ctx.save();
    shapePath(ctx, layer, b);
    applyShadow(ctx, layer.shadow);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  shapePath(ctx, layer, b);
  ctx.clip();
  if (layer.grayscale && "filter" in ctx) {
    try {
      ctx.filter = "grayscale(1)";
    } catch {
      /* 不支援就忽略 */
    }
  }
  ctx.drawImage(img, draw.x, draw.y, draw.w, draw.h);
  ctx.restore();

  if (layer.border && layer.border.width > 0) {
    ctx.save();
    shapePath(ctx, layer, b);
    ctx.lineWidth = layer.border.width;
    ctx.strokeStyle = resolveColor(layer.border.color, input.values);
    ctx.stroke();
    ctx.restore();
  }
}

function canvasMeasurer(ctx: CanvasRenderingContext2D, font: ResolvedFont, size: number): TextMeasurer {
  const f = fontString(font, size);
  return {
    measure(text: string) {
      ctx.font = f;
      return ctx.measureText(text).width;
    },
  };
}

export interface TextRenderPlan {
  layout: TextLayout;
  font: ResolvedFont;
  fontSize: number;
  letterSpacingPx: number;
  color: string;
  box: Box;
  text: string;
  placeholder: boolean;
}

/** 計算文字圖層的排版結果（也給 UI 用來顯示警告） */
export function planText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  b: Box,
  input: RenderInput,
  fields: Map<string, FieldDef>,
  geometryScale = 1,
): TextRenderPlan | null {
  const adj = input.adjustments[layer.id];
  let text = applyTemplate(layer.text, input.values, fields);
  let placeholder = false;
  if (text.trim() === "") {
    if (input.mode === "export" || !allBoundEmpty(layer.text, input.values, fields)) return null;
    const ids = placeholderIds(layer.text);
    const labels = ids.map((id) => fields.get(id)?.label ?? id);
    text = labels.length ? `[${labels.join("＋")}]` : "";
    placeholder = true;
    if (!text) return null;
  }
  if (layer.uppercase) text = text.toUpperCase();

  const font = resolveFont(layer.font, input.config, input.fontOverrides);
  const baseSize = (adj?.fontSize ?? layer.font.size) * Math.max(0.01, geometryScale);
  const lineHeight = adj?.lineHeight ?? layer.lineHeight ?? 1.35;
  const lsEm = adj?.letterSpacing ?? layer.letterSpacing ?? 0;
  const color = adj?.color ?? resolveColor(layer.color, input.values);
  const vertical = !!layer.vertical;

  const opts = {
    maxWidth: b.w,
    maxHeight: b.h,
    maxLines: layer.maxLines,
    fontSize: baseSize,
    lineHeight,
    letterSpacing: lsEm * baseSize,
  };
  let layout: TextLayout;
  if (layer.autoFit) {
    const min = typeof layer.autoFit === "object" ? layer.autoFit.min : baseSize * 0.5;
    layout = fitText(text, opts, (size) => canvasMeasurer(ctx, font, size), min, vertical);
  } else {
    layout = (vertical ? layoutVertical : layoutText)(text, opts, canvasMeasurer(ctx, font, baseSize));
  }
  return {
    layout,
    font,
    fontSize: layout.fontSize,
    letterSpacingPx: lsEm * layout.fontSize,
    color,
    box: b,
    text,
    placeholder,
  };
}

function drawTextRun(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  ls: number,
  mode: "fill" | "stroke",
) {
  if (!ls) {
    if (mode === "fill") ctx.fillText(text, x, y);
    else ctx.strokeText(text, x, y);
    return;
  }
  let cx = x;
  for (const g of graphemes(text)) {
    if (mode === "fill") ctx.fillText(g, cx, y);
    else ctx.strokeText(g, cx, y);
    cx += ctx.measureText(g).width + ls;
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  b: Box,
  input: RenderInput,
  fields: Map<string, FieldDef>,
  geometryScale = 1,
) {
  const plan = planText(ctx, layer, b, input, fields, geometryScale);
  if (!plan) return;
  const { layout, font, fontSize, letterSpacingPx: ls } = plan;
  ctx.font = fontString(font, fontSize);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const align = layer.align ?? "left";
  const valign = layer.valign ?? "top";

  if (plan.placeholder) ctx.globalAlpha *= 0.38;

  if (layer.vertical) {
    const colW = layout.lineHeightPx;
    const totalW = layout.totalHeight;
    const startX =
      align === "left" ? b.x : align === "center" ? b.x + (b.w - totalW) / 2 : b.x + b.w - totalW;
    ctx.textAlign = "center";
    layout.lines.forEach((line, i) => {
      // 第一欄在最右邊
      const colX = startX + totalW - (i + 1) * colW + colW / 2;
      const colH = line.width;
      const top =
        valign === "top" ? b.y : valign === "middle" ? b.y + (b.h - colH) / 2 : b.y + b.h - colH;
      let cy = top + fontSize / 2;
      for (const g of graphemes(line.text)) {
        if (layer.stroke && layer.stroke.width > 0) {
          ctx.lineWidth = layer.stroke.width * 2;
          ctx.lineJoin = "round";
          ctx.strokeStyle = resolveColor(layer.stroke.color, input.values);
          ctx.strokeText(g, colX, cy);
        }
        ctx.save();
        applyShadow(ctx, layer.shadow);
        ctx.fillStyle = plan.color;
        ctx.fillText(g, colX, cy);
        ctx.restore();
        cy += fontSize + ls;
      }
    });
    return;
  }

  const total = layout.totalHeight;
  const top =
    valign === "top" ? b.y : valign === "middle" ? b.y + (b.h - total) / 2 : b.y + b.h - total;

  layout.lines.forEach((line, i) => {
    const lineTop = top + i * layout.lineHeightPx;
    const cy = lineTop + layout.lineHeightPx / 2;
    const lx =
      align === "left" ? b.x : align === "center" ? b.x + (b.w - line.width) / 2 : b.x + b.w - line.width;

    if (layer.background && line.text) {
      const px = layer.background.paddingX ?? fontSize * 0.4;
      const py = layer.background.paddingY ?? fontSize * 0.15;
      roundRectPath(
        ctx,
        { x: lx - px, y: cy - fontSize / 2 - py, w: line.width + px * 2, h: fontSize + py * 2 },
        layer.background.radius ?? fontSize * 0.25,
      );
      ctx.fillStyle = resolveColor(layer.background.color, input.values);
      ctx.fill();
    }
    if (layer.stroke && layer.stroke.width > 0) {
      ctx.lineWidth = layer.stroke.width * 2;
      ctx.lineJoin = "round";
      ctx.strokeStyle = resolveColor(layer.stroke.color, input.values);
      drawTextRun(ctx, line.text, lx, cy, ls, "stroke");
    }
    ctx.save();
    applyShadow(ctx, layer.shadow);
    ctx.fillStyle = plan.color;
    drawTextRun(ctx, line.text, lx, cy, ls, "fill");
    ctx.restore();
  });
}

/* ---------- 主流程 ---------- */

export function renderTemplate(ctx: CanvasRenderingContext2D, input: RenderInput): void {
  const { config, variant } = input;
  const size = variant.size ?? config.size;
  const W = size.width;
  const H = size.height;
  const fields = fieldMap(config, variant);
  const full: Box = { x: 0, y: 0, w: W, h: H };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  clearShadow(ctx);
  ctx.globalAlpha = 1;
  const bg = config.background ?? "#ffffff";
  ctx.fillStyle = resolveFillStyle(ctx, bg, input.values, full);
  ctx.fillRect(0, 0, W, H);

  for (const layer of variant.layers) {
    if (layer.previewOnly && input.mode === "export") continue;
    if (!layerVisible(layer, input.values)) continue;
    const geometry = layerGeometry(layer, variant, input.adjustments, input.moduleAdjustments);
    const b = geometry.box;
    ctx.save();
    const adj = input.adjustments[layer.id];
    ctx.globalAlpha = Math.max(0, Math.min(1, adj?.opacity ?? layer.opacity ?? 1));
    if (layer.rotate) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotate * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    clearShadow(ctx);
    switch (layer.type) {
      case "rect":
        drawRect(ctx, layer, b, input);
        break;
      case "image":
        drawImage(ctx, layer, b, input);
        break;
      case "text":
        drawText(ctx, layer, b, input, fields, geometry.scale);
        break;
    }
    ctx.restore();
  }
  ctx.restore();
}

/** 所有需要預先載入的圖片來源 */
export function imageSources(input: Pick<RenderInput, "config" | "variant" | "values">): string[] {
  const out = new Set<string>();
  for (const layer of input.variant.layers) {
    if (layer.type !== "image") continue;
    const s = resolveImageSource(layer, input.values);
    if (s.src) out.add(s.src);
  }
  return Array.from(out);
}

export interface HitResult {
  layer: ImageLayer;
  fieldId: string;
  box: Box;
}

/** 找出座標下最上層、綁定圖片欄位的圖片圖層（給拖曳構圖用） */
export function hitTestImage(input: RenderInput, px: number, py: number): HitResult | null {
  const layers = input.variant.layers;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.type !== "image") continue;
    if (!layerVisible(layer, input.values)) continue;
    const src = resolveImageSource(layer, input.values);
    if (!src.bound || !src.fieldId || !src.src) continue;
    const b = layerGeometry(layer, input.variant, input.adjustments, input.moduleAdjustments).box;
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
      return { layer, fieldId: src.fieldId, box: b };
    }
  }
  return null;
}

/** 文字放不下的警告（UI 顯示用） */
export function textWarnings(ctx: CanvasRenderingContext2D, input: RenderInput): string[] {
  const fields = fieldMap(input.config, input.variant);
  const out: string[] = [];
  for (const layer of input.variant.layers) {
    if (layer.type !== "text" || !layerVisible(layer, input.values)) continue;
    const geometry = layerGeometry(layer, input.variant, input.adjustments, input.moduleAdjustments);
    const plan = planText(ctx, layer, geometry.box, input, fields, geometry.scale);
    if (!plan || plan.placeholder) continue;
    if (plan.layout.truncated) out.push(`「${layer.label ?? layer.id}」文字太長被截斷，請縮短或調小字級`);
  }
  return out;
}
