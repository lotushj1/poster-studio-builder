"use client";

import type {
  Adjustments,
  AdjustableProp,
  Layer,
  LayerAdjustment,
  ModuleAdjustableProp,
  ModuleAdjustments,
  TemplateConfig,
  Values,
  Variant,
} from "../types";
import { resolveColor } from "../engine";

interface Props {
  config: TemplateConfig;
  variant: Variant;
  values: Values;
  adjustments: Adjustments;
  moduleAdjustments: ModuleAdjustments;
  onChange: (layerId: string, patch: LayerAdjustment | null) => void;
  onModuleChange: (moduleId: string, patch: LayerAdjustment | null) => void;
}

const PROP_LABEL: Record<AdjustableProp, string> = {
  x: "左右位置",
  y: "上下位置",
  scale: "大小",
  fontSize: "字級",
  color: "顏色",
  opacity: "透明度",
  letterSpacing: "字距",
  lineHeight: "行高",
};

export default function AdjustPanel({ config, variant, values, adjustments, moduleAdjustments, onChange, onModuleChange }: Props) {
  const layers = variant.layers.filter((l) => l.adjustable && l.adjustable.length > 0);
  const modules = (variant.modules ?? []).filter((module) => (module.adjustable ?? []).length > 0);
  if (layers.length === 0 && modules.length === 0) return null;
  const size = variant.size ?? config.size;
  const W = size.width;
  const H = size.height;
  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const adj = moduleAdjustments[module.id] ?? {};
        const touched = Object.keys(adj).length > 0;
        return (
          <div key={module.id} className="rounded-xl border border-[var(--ps-accent)]/30 bg-[var(--ps-bg)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{module.label}</div>
                <div className="text-xs text-[var(--ps-muted)]">整組移動或縮放，照片仍可另外調整構圖</div>
              </div>
              {touched ? (
                <button type="button" className="ps-btn ps-btn-sm" onClick={() => onModuleChange(module.id, null)}>
                  重設
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              {(module.adjustable ?? []).map((prop) => (
                <ModuleAdjustRow
                  key={prop}
                  prop={prop}
                  adj={adj}
                  W={W}
                  H={H}
                  onChange={(patch) => onModuleChange(module.id, patch)}
                />
              ))}
            </div>
          </div>
        );
      })}
      {layers.map((layer) => {
        const adj = adjustments[layer.id] ?? {};
        const touched = Object.keys(adj).length > 0;
        return (
          <div key={layer.id} className="rounded-xl border border-[var(--ps-line)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">{layer.label ?? layer.id}</div>
              {touched ? (
                <button type="button" className="ps-btn ps-btn-sm" onClick={() => onChange(layer.id, null)}>
                  重設
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              {layer.adjustable!.map((prop) => (
                <AdjustRow key={prop} prop={prop} layer={layer} adj={adj} values={values} W={W} H={H} onChange={(patch) => onChange(layer.id, patch)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleAdjustRow({
  prop,
  adj,
  W,
  H,
  onChange,
}: {
  prop: ModuleAdjustableProp;
  adj: LayerAdjustment;
  W: number;
  H: number;
  onChange: (patch: LayerAdjustment) => void;
}) {
  switch (prop) {
    case "x":
      return <Slider label="整組左右" min={-Math.round(W * 0.3)} max={Math.round(W * 0.3)} step={1} value={adj.dx ?? 0} format={(v) => `${v > 0 ? "+" : ""}${v}`} onChange={(v) => onChange({ dx: v })} />;
    case "y":
      return <Slider label="整組上下" min={-Math.round(H * 0.3)} max={Math.round(H * 0.3)} step={1} value={adj.dy ?? 0} format={(v) => `${v > 0 ? "+" : ""}${v}`} onChange={(v) => onChange({ dy: v })} />;
    case "scale":
      return <Slider label="整組大小" min={0.5} max={2} step={0.01} value={adj.scale ?? 1} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onChange({ scale: v })} />;
  }
}

function AdjustRow({
  prop,
  layer,
  adj,
  values,
  W,
  H,
  onChange,
}: {
  prop: AdjustableProp;
  layer: Layer;
  adj: LayerAdjustment;
  values: Values;
  W: number;
  H: number;
  onChange: (patch: LayerAdjustment) => void;
}) {
  const label = PROP_LABEL[prop];
  const baseFont = layer.type === "text" ? layer.font.size : 0;
  switch (prop) {
    case "x":
      return (
        <Slider label={label} min={-Math.round(W * 0.3)} max={Math.round(W * 0.3)} step={1} value={adj.dx ?? 0} format={(v) => `${v > 0 ? "+" : ""}${v}`} onChange={(v) => onChange({ dx: v })} />
      );
    case "y":
      return (
        <Slider label={label} min={-Math.round(H * 0.3)} max={Math.round(H * 0.3)} step={1} value={adj.dy ?? 0} format={(v) => `${v > 0 ? "+" : ""}${v}`} onChange={(v) => onChange({ dy: v })} />
      );
    case "scale":
      return <Slider label={label} min={0.5} max={2} step={0.01} value={adj.scale ?? 1} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onChange({ scale: v })} />;
    case "fontSize":
      return (
        <Slider
          label={label}
          min={Math.max(8, Math.round(baseFont * 0.5))}
          max={Math.round(baseFont * 1.8)}
          step={1}
          value={adj.fontSize ?? baseFont}
          format={(v) => `${v}px`}
          onChange={(v) => onChange({ fontSize: v })}
        />
      );
    case "opacity":
      return <Slider label={label} min={0} max={1} step={0.01} value={adj.opacity ?? layer.opacity ?? 1} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => onChange({ opacity: v })} />;
    case "letterSpacing":
      return (
        <Slider
          label={label}
          min={-0.05}
          max={0.5}
          step={0.005}
          value={adj.letterSpacing ?? (layer.type === "text" ? (layer.letterSpacing ?? 0) : 0)}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ letterSpacing: v })}
        />
      );
    case "lineHeight":
      return (
        <Slider
          label={label}
          min={0.9}
          max={2.2}
          step={0.01}
          value={adj.lineHeight ?? (layer.type === "text" ? (layer.lineHeight ?? 1.35) : 1.35)}
          format={(v) => v.toFixed(2)}
          onChange={(v) => onChange({ lineHeight: v })}
        />
      );
    case "color": {
      const raw = layer.type === "text" ? layer.color : layer.type === "rect" && typeof layer.fill === "string" ? layer.fill : "#000000";
      const base = resolveColor(raw, values, "#000000");
      const current = adj.color ?? base;
      const hex = /^#[0-9a-fA-F]{6}$/.test(current) ? current : "#000000";
      return (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="w-16 shrink-0 text-[var(--ps-muted)]">{label}</span>
          <div className="flex flex-1 items-center gap-2">
            <input type="color" className="ps-color" value={hex} onChange={(e) => onChange({ color: e.target.value })} aria-label={`${layer.label ?? layer.id} 顏色`} />
            <input className="ps-input font-mono text-xs" value={current} onChange={(e) => onChange({ color: e.target.value })} aria-label={`${layer.label ?? layer.id} 色碼`} />
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-[var(--ps-muted)]">{label}</span>
      <input type="range" className="ps-range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="w-14 shrink-0 text-right tabular-nums">{format(value)}</span>
    </label>
  );
}
