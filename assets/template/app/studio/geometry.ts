/**
 * 純函式幾何：圖層個別調整與 variant-specific 模組群組變換。
 * 不依賴 DOM，方便單元測試與 canvas 引擎共用。
 */
import type { Adjustments, Layer, LayerAdjustment, ModuleAdjustments, ModuleDef, Variant } from "./types";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function layerBox(layer: Layer, adjustments: Adjustments): Box {
  const a = adjustments[layer.id];
  let { x, y, w, h } = layer;
  if (a?.scale && a.scale !== 1 && layer.type !== "text") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    w *= a.scale;
    h *= a.scale;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  x += a?.dx ?? 0;
  y += a?.dy ?? 0;
  return { x, y, w, h };
}

/** 取得模組未調整前的整體邊界，作為群組縮放的中心基準。 */
export function moduleBounds(variant: Variant, module: ModuleDef): Box {
  const memberIds = new Set(module.layerIds);
  const members = variant.layers.filter((layer) => memberIds.has(layer.id));
  if (members.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const boxes = members.map((layer) => layerBox(layer, {}));
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** 以模組邊界中心套用群組位移／縮放，讓照片、名字、頭銜保持相對關係。 */
export function transformBoxAround(box: Box, base: Box, adjustment?: LayerAdjustment): Box {
  const scale = Math.max(0.01, adjustment?.scale ?? 1);
  return {
    x: base.x + (box.x - base.x) * scale + (adjustment?.dx ?? 0),
    y: base.y + (box.y - base.y) * scale + (adjustment?.dy ?? 0),
    w: box.w * scale,
    h: box.h * scale,
  };
}

export interface LayerGeometry {
  box: Box;
  /** 模組縮放倍率，文字排版也必須套用這個倍率才會與照片同步。 */
  scale: number;
  module?: ModuleDef;
}

/** 取得同時考慮圖層個別調整與所屬模組調整的實際幾何。 */
export function layerGeometry(
  layer: Layer,
  variant: Variant,
  adjustments: Adjustments,
  moduleAdjustments: ModuleAdjustments = {},
): LayerGeometry {
  const own = layerBox(layer, adjustments);
  const moduleDef = variant.modules?.find((candidate) => candidate.id === layer.moduleId || candidate.layerIds.includes(layer.id));
  if (!moduleDef) return { box: own, scale: 1 };
  const base = moduleBounds(variant, moduleDef);
  const moduleAdjustment = moduleAdjustments[moduleDef.id];
  return {
    box: transformBoxAround(own, base, moduleAdjustment),
    scale: Math.max(0.01, moduleAdjustment?.scale ?? 1),
    module: moduleDef,
  };
}
