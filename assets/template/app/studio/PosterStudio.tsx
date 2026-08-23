"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Adjustments,
  FieldDef,
  FieldValue,
  FontOverride,
  FontOverrides,
  ImageValue,
  LayerAdjustment,
  ModuleAdjustments,
  StudioState,
  TemplateConfig,
  Values,
  Variant,
} from "./types";
import {
  fieldMap,
  hitTestImage,
  imageDrawRect,
  imageSources,
  renderTemplate,
  textWarnings,
  type RenderInput,
} from "./engine";
import { buildFilename, isImageValue, todayISO } from "./format";
import {
  clearState,
  deleteImageBlob,
  getImageBlob,
  imageKey,
  loadPresets,
  loadState,
  makePreset,
  putImageBlob,
  savePresets,
  saveState,
  type Preset,
} from "./storage";
import { canCopyImage, copyBlobToClipboard, downloadBlob, renderAllToBlobs, renderToBlob } from "./export";
import FieldControl from "./controls/FieldControl";
import FontPanel from "./controls/FontPanel";
import AdjustPanel from "./controls/AdjustPanel";
import PresetPanel from "./controls/PresetPanel";

interface Props {
  config: TemplateConfig;
}

type StudioTab = "content" | "assets" | "adjustments" | "export";
type PreviewMode = "current" | "all";
type HistoryState = { past: StudioState[]; future: StudioState[] };

/* ---------- 工具函式 ---------- */

function allFields(config: TemplateConfig): FieldDef[] {
  const seen = new Set<string>();
  const out: FieldDef[] = [];
  for (const f of [...config.fields, ...config.variants.flatMap((v) => v.fields ?? [])]) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}

function defaultValue(field: FieldDef): FieldValue {
  switch (field.type) {
    case "text":
    case "textarea":
      return field.default ?? "";
    case "image":
      return field.default ? { src: field.default, focalX: 0.5, focalY: 0.5, zoom: 1 } : null;
    case "color":
      return field.default;
    case "select":
      return field.default;
    case "date":
      return field.default === "today" || !field.default ? todayISO() : field.default;
    case "time":
      return field.default ?? "";
    case "number":
      return field.default ?? null;
    case "toggle":
      return field.default ?? false;
    default:
      return null;
  }
}

function defaultValues(config: TemplateConfig): Values {
  const out: Values = {};
  for (const f of allFields(config)) out[f.id] = defaultValue(f);
  return out;
}

function initialState(config: TemplateConfig): StudioState {
  return {
    variantId: config.variants[0]?.id ?? "default",
    values: defaultValues(config),
    adjustments: {},
    moduleAdjustments: {},
    fontOverrides: {},
  };
}

function groupFields(fields: FieldDef[]): { group: string; fields: FieldDef[] }[] {
  const groups: { group: string; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    const g = f.group ?? "內容";
    let entry = groups.find((x) => x.group === g);
    if (!entry) {
      entry = { group: g, fields: [] };
      groups.push(entry);
    }
    entry.fields.push(f);
  }
  return groups;
}

function isImageField(field: FieldDef): boolean {
  return field.type === "image";
}

declare global {
  interface Window {
    __posterStudio?: {
    getState: () => StudioState;
    setValue: (id: string, value: FieldValue) => void;
    setVariant: (id: string) => void;
    exportBlob: (format?: "png" | "jpeg") => Promise<Blob>;
    exportActiveBlob: (format?: "png" | "jpeg") => Promise<Blob>;
    exportAllBlobs: (format?: "png" | "jpeg") => Promise<{ variantId: string; blob: Blob }[]>;
    config: TemplateConfig;
  };
}
}

/* ---------- 主元件 ---------- */

export default function PosterStudio({ config }: Props) {
  const [state, setState] = useState<StudioState>(() => initialState(config));
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [tick, setTick] = useState(0);
  const [warningsByVariant, setWarningsByVariant] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">(config.export?.format ?? "png");
  const [cursor, setCursor] = useState<"default" | "grab" | "grabbing">("default");
  const [activeTab, setActiveTab] = useState<StudioTab>("content");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("current");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ fonts: false, adjust: false, presets: false });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });

  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const objectUrlsRef = useRef(new Set<string>());
  const dragRef = useRef<{
    fieldId: string;
    startX: number;
    startY: number;
    startFocalX: number;
    startFocalY: number;
    overflowX: number;
    overflowY: number;
    historyStart: StudioState;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const latestState = useRef(state);
  const historyRef = useRef(history);
  useEffect(() => {
    latestState.current = state;
  }, [state]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const variant: Variant = useMemo(
    () => config.variants.find((v) => v.id === state.variantId) ?? config.variants[0],
    [config, state.variantId],
  );
  const size = variant.size ?? config.size;
  const fields = useMemo(() => fieldMap(config, variant), [config, variant]);
  const visibleFields = useMemo(() => [...config.fields, ...(variant.fields ?? [])], [config, variant]);
  const groups = useMemo(() => groupFields(visibleFields), [visibleFields]);
  const contentGroups = useMemo(
    () => groups.map((group) => ({ ...group, fields: group.fields.filter((field) => !isImageField(field)) })).filter((group) => group.fields.length > 0),
    [groups],
  );
  const assetGroups = useMemo(
    () => groups.map((group) => ({ ...group, fields: group.fields.filter(isImageField) })).filter((group) => group.fields.length > 0),
    [groups],
  );

  // The canvas cache is intentionally shared with the render engine and is mutated by image-load handlers.
  const renderInputs = useMemo<RenderInput[]>(
    () =>
      // eslint-disable-next-line react-hooks/refs
      config.variants.map((previewVariant) => ({
        config,
        variant: previewVariant,
        values: state.values,
        adjustments: state.adjustments,
        moduleAdjustments: state.moduleAdjustments,
        fontOverrides: state.fontOverrides,
        images: imagesRef.current,
        mode: "preview",
      })),
    [config, state.values, state.adjustments, state.moduleAdjustments, state.fontOverrides],
  );
  const input = useMemo<RenderInput>(
    () => renderInputs.find((candidate) => candidate.variant.id === variant.id) ?? renderInputs[0],
    [renderInputs, variant.id],
  );
  const latestInput = useRef(input);
  useEffect(() => {
    latestInput.current = input;
  }, [input]);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const pushHistory = useCallback((before: StudioState) => {
    const current = latestState.current;
    if (before === current) return;
    const next = {
      past: [...historyRef.current.past, before].slice(-40),
      future: [],
    } satisfies HistoryState;
    historyRef.current = next;
    setHistory(next);
  }, []);

  const commitState = useCallback(
    (updater: StudioState | ((current: StudioState) => StudioState)) => {
      const before = latestState.current;
      const next = typeof updater === "function" ? updater(before) : updater;
      if (next === before) return;
      latestState.current = next;
      const nextHistory = {
        past: [...historyRef.current.past, before].slice(-40),
        future: [],
      } satisfies HistoryState;
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setState(next);
    },
    [],
  );

  const setValueImmediate = useCallback((id: string, value: FieldValue) => {
    const next = { ...latestState.current, values: { ...latestState.current.values, [id]: value } };
    latestState.current = next;
    setState(next);
  }, []);

  const undo = useCallback(() => {
    const current = latestState.current;
    const entry = historyRef.current.past.at(-1);
    if (!entry) return;
    const next = {
      past: historyRef.current.past.slice(0, -1),
      future: [current, ...historyRef.current.future].slice(0, 40),
    } satisfies HistoryState;
    historyRef.current = next;
    latestState.current = entry;
    setHistory(next);
    setState(entry);
    showToast("已復原上一個變更");
  }, [showToast]);

  const redo = useCallback(() => {
    const current = latestState.current;
    const entry = historyRef.current.future[0];
    if (!entry) return;
    const next = {
      past: [...historyRef.current.past, current].slice(-40),
      future: historyRef.current.future.slice(1),
    } satisfies HistoryState;
    historyRef.current = next;
    latestState.current = entry;
    setHistory(next);
    setState(entry);
    showToast("已重做上一個變更");
  }, [showToast]);

  // The mounted flag intentionally gates browser-only canvas and storage work.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  /* ----- 還原上次內容 ----- */
  useEffect(() => {
    const persisted = loadState(config);
    const base = initialState(config);
    if (persisted) {
      const values: Values = { ...base.values };
      for (const [k, v] of Object.entries(persisted.values ?? {})) {
        if (k in values || allFields(config).some((f) => f.id === k)) values[k] = v;
      }
      const restoredState = {
        variantId: config.variants.some((v) => v.id === persisted.variantId) ? persisted.variantId : base.variantId,
        values,
        adjustments: persisted.adjustments ?? {},
        moduleAdjustments: persisted.moduleAdjustments ?? {},
        fontOverrides: persisted.fontOverrides ?? {},
      } satisfies StudioState;
      latestState.current = restoredState;
      // Hydration reconciles browser storage into the initial React state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(restoredState);
      // 從 IndexedDB 還原照片
      for (const [k, v] of Object.entries(values)) {
        if (isImageValue(v) && v.key && !v.src) {
          getImageBlob(v.key).then((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.add(url);
            setState((s) => {
              const cur = s.values[k];
              if (!isImageValue(cur) || cur.src) return s;
              const next = { ...s, values: { ...s.values, [k]: { ...cur, src: url } } };
              latestState.current = next;
              return next;
            });
          });
        }
      }
    }
    setPresets(loadPresets(config));
    setHydrated(true);
  }, [config]);

  /* ----- 自動儲存 ----- */
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => saveState(config, state), 300);
    return () => window.clearTimeout(t);
  }, [config, state, hydrated]);

  /* ----- 預載圖片：所有預覽變體都要能立即重畫 ----- */
  const allImageSources = useMemo(() => {
    const sources = new Set<string>();
    for (const candidate of renderInputs) {
      for (const src of imageSources(candidate)) sources.add(src);
    }
    return Array.from(sources);
  }, [renderInputs]);

  useEffect(() => {
    const cache = imagesRef.current;
    for (const src of allImageSources) {
      if (cache.has(src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.onload = bump;
      img.onerror = () => {
        cache.delete(src);
        showToast("圖片載入失敗");
      };
      img.src = src;
      cache.set(src, img);
    }
  }, [allImageSources, bump, showToast]);

  /* ----- 字體載好重畫 ----- */
  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    document.fonts.ready.then(bump);
    const handler = () => bump();
    document.fonts.addEventListener("loadingdone", handler);
    return () => document.fonts.removeEventListener("loadingdone", handler);
  }, [bump]);

  /* ----- 繪製 ----- */
  useEffect(() => {
    const nextWarnings: Record<string, string[]> = {};
    for (const candidate of renderInputs) {
      const canvas = canvasRefs.current.get(candidate.variant.id);
      if (!canvas) continue;
      const candidateCtx = canvas.getContext("2d");
      if (!candidateCtx) continue;
      renderTemplate(candidateCtx, candidate);
      nextWarnings[candidate.variant.id] = textWarnings(candidateCtx, candidate);
    }
    // Canvas measurement is an external browser side effect; retain its warnings for the UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWarningsByVariant(nextWarnings);
  }, [renderInputs, variant.id, tick]);

  /* ----- 給測試與除錯用的掛鉤 ----- */
  useEffect(() => {
    const exportActiveBlob = (format: "png" | "jpeg" = "png") =>
      renderToBlob(latestInput.current, format, config.export?.quality ?? 0.92);
    const exportAllBlobs = (format: "png" | "jpeg" = "png") =>
      renderAllToBlobs(latestInput.current, format, config.export?.quality ?? 0.92);
    window.__posterStudio = {
      config,
      getState: () => latestState.current,
      setValue: (id, value) => commitState((s) => ({ ...s, values: { ...s.values, [id]: value } })),
      setVariant: (id) => commitState((s) => ({ ...s, variantId: id })),
      exportBlob: exportActiveBlob,
      exportActiveBlob,
      exportAllBlobs,
    };
    return () => {
      delete window.__posterStudio;
    };
  }, [config, commitState]);

  /* ----- 清理 object URL ----- */
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, []);

  /* ----- 事件處理 ----- */
  const setValue = useCallback(
    (id: string, value: FieldValue) => {
      commitState((s) => ({ ...s, values: { ...s.values, [id]: value } }));
    },
    [commitState],
  );

  const onImageFile = useCallback(
    (fieldId: string, file: File) => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.add(url);
      const key = imageKey(config, fieldId);
      putImageBlob(key, file).catch(() => undefined);
      setValue(fieldId, { src: url, focalX: 0.5, focalY: 0.5, zoom: 1, name: file.name, key });
    },
    [config, setValue],
  );

  const clearImage = useCallback(
    (fieldId: string) => {
      const cur = state.values[fieldId];
      if (isImageValue(cur) && cur.key) deleteImageBlob(cur.key);
      setValue(fieldId, null);
    },
    [state.values, setValue],
  );

  const setAdjustment = useCallback((layerId: string, patch: LayerAdjustment | null) => {
    commitState((s) => {
      const next: Adjustments = { ...s.adjustments };
      if (patch === null) delete next[layerId];
      else next[layerId] = { ...(next[layerId] ?? {}), ...patch };
      return { ...s, adjustments: next };
    });
  }, [commitState]);

  const setModuleAdjustment = useCallback((moduleId: string, patch: LayerAdjustment | null) => {
    commitState((s) => {
      const next: ModuleAdjustments = { ...s.moduleAdjustments };
      if (patch === null) delete next[moduleId];
      else next[moduleId] = { ...(next[moduleId] ?? {}), ...patch };
      return { ...s, moduleAdjustments: next };
    });
  }, [commitState]);

  const setFontOverride = useCallback((role: string, override: FontOverride | null) => {
    commitState((s) => {
      const next: FontOverrides = { ...s.fontOverrides };
      if (override === null) delete next[role];
      else next[role] = override;
      return { ...s, fontOverrides: next };
    });
  }, [commitState]);

  const resetAll = useCallback(() => {
    if (!window.confirm("要清空所有內容、回到範本預設值嗎？")) return;
    for (const v of Object.values(state.values)) if (isImageValue(v) && v.key) deleteImageBlob(v.key);
    clearState(config);
    commitState(initialState(config));
    showToast("已回到預設值");
  }, [config, state.values, commitState, showToast]);

  const filename = useMemo(
    () =>
      buildFilename(config.export?.filename ?? "{name}-{date}", {
        name: config.name,
        variant: variant.id,
        values: state.values,
        fields,
      }),
    [config, variant.id, state.values, fields],
  );

  const doDownload = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await renderToBlob(latestInput.current, exportFormat, config.export?.quality ?? 0.92);
      downloadBlob(blob, `${filename}.${exportFormat === "jpeg" ? "jpg" : "png"}`);
      showToast("已下載圖片");
    } catch {
      showToast("匯出失敗，請再試一次");
    } finally {
      setBusy(false);
    }
  }, [exportFormat, config, filename, showToast]);

  const doDownloadAll = useCallback(async () => {
    setBusy(true);
    try {
      const files = await renderAllToBlobs(latestInput.current, exportFormat, config.export?.quality ?? 0.92);
      for (const file of files) {
        const fileVariant = config.variants.find((candidate) => candidate.id === file.variantId) ?? config.variants[0];
        const fileName = buildFilename(config.export?.filename ?? "{name}-{date}", {
          name: config.name,
          variant: fileVariant.id,
          values: state.values,
          fields: fieldMap(config, fileVariant),
        });
        downloadBlob(file.blob, `${fileName}.${exportFormat === "jpeg" ? "jpg" : "png"}`);
      }
      showToast(`已下載全部 ${files.length} 個版型`);
    } catch {
      showToast("批次匯出失敗，請再試一次");
    } finally {
      setBusy(false);
    }
  }, [config, exportFormat, showToast, state.values]);

  const doCopy = useCallback(async () => {
    setBusy(true);
    try {
      const ok = await copyBlobToClipboard(renderToBlob(latestInput.current, "png"));
      showToast(ok ? "已複製圖片，可直接貼到聊天室或貼文" : "這個瀏覽器不支援複製圖片，請改用下載");
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  /* 預設組合 */
  const savePreset = useCallback(
    (name: string) => {
      const next = [makePreset(name, state), ...presets].slice(0, 30);
      setPresets(next);
      savePresets(config, next);
      showToast(`已儲存「${name}」`);
    },
    [config, presets, state, showToast],
  );
  const loadPreset = useCallback(
    (p: Preset) => {
      commitState((s) => {
        const values: Values = { ...s.values };
        for (const [k, v] of Object.entries(p.values)) {
          if (isImageValue(s.values[k]) || (v !== null && typeof v === "object")) continue; // 照片不套用
          values[k] = v;
        }
        return {
          variantId: config.variants.some((v) => v.id === p.variantId) ? p.variantId : s.variantId,
          values,
          adjustments: p.adjustments ?? {},
          moduleAdjustments: p.moduleAdjustments ?? s.moduleAdjustments,
          fontOverrides: p.fontOverrides ?? s.fontOverrides,
        };
      });
      showToast(`已套用「${p.name}」`);
    },
    [commitState, config, showToast],
  );
  const deletePreset = useCallback(
    (id: string) => {
      const next = presets.filter((p) => p.id !== id);
      setPresets(next);
      savePresets(config, next);
    },
    [config, presets],
  );

  /* 拖曳照片構圖 */
  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * size.width,
      y: ((e.clientY - rect.top) / rect.height) * size.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvasPoint(e);
    const hit = hitTestImage(latestInput.current, p.x, p.y);
    if (!hit) return;
    const v = latestInput.current.values[hit.fieldId];
    if (!isImageValue(v)) return;
    const img = imagesRef.current.get(v.src);
    if (!img || !img.naturalWidth) return;
    const draw = imageDrawRect(img.naturalWidth, img.naturalHeight, hit.box, hit.layer.fit ?? "cover", v.focalX, v.focalY, v.zoom);
    dragRef.current = {
      fieldId: hit.fieldId,
      startX: p.x,
      startY: p.y,
      startFocalX: v.focalX,
      startFocalY: v.focalY,
      overflowX: draw.w - hit.box.w,
      overflowY: draw.h - hit.box.h,
      historyStart: latestState.current,
    };
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    setCursor("grabbing");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvasPoint(e);
    const d = dragRef.current;
    if (!d) {
      setCursor(hitTestImage(latestInput.current, p.x, p.y) ? "grab" : "default");
      return;
    }
    const cur = latestInput.current.values[d.fieldId];
    if (!isImageValue(cur)) return;
    const next: ImageValue = { ...cur };
    if (Math.abs(d.overflowX) > 0.5) next.focalX = clamp01(d.startFocalX - (p.x - d.startX) / d.overflowX);
    if (Math.abs(d.overflowY) > 0.5) next.focalY = clamp01(d.startFocalY - (p.y - d.startY) / d.overflowY);
    setValueImmediate(d.fieldId, next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      const historyStart = dragRef.current.historyStart;
      dragRef.current = null;
      pushHistory(historyStart);
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    setCursor("default");
  };

  const toggleSection = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const accent = config.ui?.accent ?? config.designSystem?.tokens.accent ?? "#171717";
  const tokens = config.designSystem?.tokens ?? {
    ink: "#171717",
    paper: "#f7f6f2",
    muted: "#6d6a63",
    line: "#d8d5ce",
    accent: "#171717",
    accentInk: "#ffffff",
    preview: "#e8e5de",
  };
  const themeStyle = {
    ["--ps-ink" as string]: tokens.ink,
    ["--ps-bg" as string]: tokens.paper,
    ["--ps-panel" as string]: tokens.paper,
    ["--ps-muted" as string]: tokens.muted,
    ["--ps-line" as string]: tokens.line,
    ["--ps-accent" as string]: accent,
    ["--ps-accent-ink" as string]: tokens.accentInk,
    ["--ps-preview-bg" as string]: config.ui?.previewBackground ?? tokens.preview,
  } as React.CSSProperties;
  const hasFontRoles = Object.keys(config.fonts?.roles ?? {}).length > 0;
  const hasAdjustables =
    variant.layers.some((l) => l.adjustable && l.adjustable.length > 0) ||
    (variant.modules ?? []).some((module) => (module.adjustable ?? []).length > 0);
  const tabs: { id: StudioTab; label: string }[] = [
    { id: "content", label: "內容" },
    { id: "assets", label: "素材" },
    { id: "adjustments", label: "調整" },
    { id: "export", label: "匯出" },
  ];
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    window.requestAnimationFrame(() => document.getElementById(`poster-tab-${nextTab.id}`)?.focus());
  };
  const toggleGroup = (key: string) => setOpenGroups((groupsState) => ({ ...groupsState, [key]: !groupsState[key] }));
  const isGroupOpen = (key: string, fallback: boolean) => openGroups[key] ?? fallback;

  // 整個工具都在瀏覽器端運作（canvas、本機字體、localStorage），掛載前只畫外框，避免 SSR 與瀏覽器內容不一致
  if (!mounted) {
    return (
      <div className="min-h-screen" style={themeStyle}>
        <header className="sticky top-0 z-20 border-b border-[var(--ps-line)] bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-[1440px] px-4 py-3">
            <h1 className="text-base font-bold leading-tight">{config.name}</h1>
            <p className="text-xs text-[var(--ps-muted)]">
              {config.size.width} × {config.size.height} px
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-6 text-sm text-[var(--ps-muted)]">載入中…</main>
      </div>
    );
  }

  const renderFieldGroups = (fieldGroups: { group: string; fields: FieldDef[] }[], prefix: string) =>
    fieldGroups.map((group, index) => {
      const disclosureId = `${prefix}-${index}`;
      const open = isGroupOpen(disclosureId, index === 0);
      return (
        <Collapsible
          key={disclosureId}
          id={disclosureId}
          title={group.group}
          hint={`${group.fields.length} 項`}
          open={open}
          onToggle={() => toggleGroup(disclosureId)}
        >
          <div className="space-y-4">
            {group.fields.map((field) => (
              <FieldControl
                key={field.id}
                field={field}
                value={state.values[field.id]}
                onChange={(value) => setValue(field.id, value)}
                onImageFile={(file) => onImageFile(field.id, file)}
                onImageClear={() => clearImage(field.id)}
              />
            ))}
          </div>
        </Collapsible>
      );
    });

  const renderTabPanel = () => {
    if (activeTab === "content") {
      return (
        <div id="poster-panel-content" role="tabpanel" aria-labelledby="poster-tab-content" tabIndex={0}>
          {contentGroups.length > 0 ? renderFieldGroups(contentGroups, "content-group") : <EmptyState text="這個版型沒有可編輯的文字欄位。" />}
        </div>
      );
    }
    if (activeTab === "assets") {
      return (
        <div id="poster-panel-assets" role="tabpanel" aria-labelledby="poster-tab-assets" tabIndex={0}>
          {assetGroups.length > 0 ? renderFieldGroups(assetGroups, "asset-group") : <EmptyState text="這個版型沒有圖片欄位。" />}
          {hasFontRoles ? (
            <Collapsible
              id="font-settings"
              title="字體"
              open={openSections.fonts}
              onToggle={() => toggleSection("fonts")}
              hint="使用電腦已安裝的字體"
            >
              <FontPanel config={config} overrides={state.fontOverrides} onChange={setFontOverride} onFontsChanged={bump} />
            </Collapsible>
          ) : null}
        </div>
      );
    }
    if (activeTab === "adjustments") {
      return (
        <div id="poster-panel-adjustments" role="tabpanel" aria-labelledby="poster-tab-adjustments" tabIndex={0}>
          {hasAdjustables ? (
            <Collapsible
              id="adjustment-settings"
              title="版面微調"
              open={openSections.adjust}
              onToggle={() => toggleSection("adjust")}
              hint="位置、大小與顏色"
            >
              <AdjustPanel
                config={config}
                variant={variant}
                values={state.values}
                adjustments={state.adjustments}
                moduleAdjustments={state.moduleAdjustments}
                onChange={setAdjustment}
                onModuleChange={setModuleAdjustment}
              />
            </Collapsible>
          ) : (
            <EmptyState text="目前版型沒有可調整的元素。" />
          )}
          <Collapsible
            id="preset-settings"
            title="預設組合"
            open={openSections.presets}
            onToggle={() => toggleSection("presets")}
            hint={presets.length ? `${presets.length} 組已儲存` : "可選填"}
          >
            <PresetPanel presets={presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset} />
          </Collapsible>
        </div>
      );
    }
    return (
      <div id="poster-panel-export" role="tabpanel" aria-labelledby="poster-tab-export" tabIndex={0}>
        <section className="ps-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="ps-section-title">檔案設定</h2>
              <p className="mt-1 text-sm text-[var(--ps-muted)]">目前版型：{variant.label}</p>
            </div>
            <span className="ps-export-format-badge">{exportFormat.toUpperCase()}</span>
          </div>
          <label className="mt-4 block text-sm font-semibold" htmlFor="poster-export-format">
            檔案格式
            <select
              id="poster-export-format"
              name="exportFormat"
              className="ps-input mt-2"
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value as "png" | "jpeg")}
            >
              <option value="png">PNG（最清晰）</option>
              <option value="jpeg">JPG（檔案較小）</option>
            </select>
          </label>
          <p className="ps-file-name mt-3" title={filename}>
            檔名：{filename}.{exportFormat === "jpeg" ? "jpg" : "png"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.variants.length > 1 ? (
              <button type="button" className="ps-btn ps-btn-primary" onClick={doDownloadAll} disabled={busy}>
                {busy ? "處理中…" : `下載全部 ${config.variants.length} 張`}
              </button>
            ) : null}
            {canCopyImage() ? (
              <button type="button" className="ps-btn" onClick={doCopy} disabled={busy}>
                複製圖片
              </button>
            ) : null}
            <button type="button" className="ps-btn" onClick={resetAll}>
              全部重設
            </button>
          </div>
          <p className="ps-hint mt-3">內容只存在你的瀏覽器裡，下次打開會自動帶回來。主要下載按鈕固定在頁首。</p>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={themeStyle}>
      <header className="ps-header sticky top-0 z-20 border-b border-[var(--ps-line)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-tight">{config.name}</h1>
            <p className="truncate text-xs text-[var(--ps-muted)]">
              {size.width} × {size.height} px
              {config.ui?.subtitle ? ` · ${config.ui.subtitle}` : ""}
            </p>
          </div>
          {config.variants.length > 1 ? (
            <label className="ps-header-variant text-xs text-[var(--ps-muted)]">
              <span className="whitespace-nowrap">目前版型</span>
              <select
                id="poster-variant"
                name="variantId"
                className="ps-input ps-header-select"
                value={variant.id}
                onChange={(event) => commitState((current) => ({ ...current, variantId: event.target.value }))}
                aria-label="目前版型"
              >
                {config.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} · {(v.size ?? config.size).width}×{(v.size ?? config.size).height}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="ps-header-actions">
            <button type="button" className="ps-btn ps-btn-secondary" onClick={undo} disabled={history.past.length === 0} aria-label="復原上一個變更">
              復原
            </button>
            <button type="button" className="ps-btn ps-btn-secondary" onClick={redo} disabled={history.future.length === 0} aria-label="重做上一個變更">
              重做
            </button>
            <button type="button" className="ps-btn ps-btn-primary" onClick={doDownload} disabled={busy}>
              {busy ? "處理中…" : "下載目前版型"}
            </button>
          </div>
        </div>
      </header>

      <main className="ps-workspace mx-auto grid max-w-[1440px] gap-8 px-4 py-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="ps-controls order-2 min-w-0 lg:order-1">
          <div className="ps-control-intro">
            <div>
              <p className="ps-kicker">編輯工具</p>
              <p className="mt-1 text-sm text-[var(--ps-muted)]">依序填寫內容、整理素材，再調整與匯出。</p>
            </div>
          </div>
          <div className="ps-tabs" role="tablist" aria-label="海報編輯工具">
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`poster-tab-${tab.id}`}
                  type="button"
                  className="ps-tab"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`poster-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  data-active={selected}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={handleTabKeyDown}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="ps-tab-panel">{renderTabPanel()}</div>
        </aside>

        <section className="ps-preview-area order-1 min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-[92px]">
            <div className="ps-preview-toolbar">
              <div>
                <p className="ps-kicker">即時預覽</p>
                <p className="mt-1 text-sm text-[var(--ps-muted)]">選取目前版型後，可在預覽上拖曳照片調整構圖。</p>
              </div>
              <span className="ps-design-token">{config.ui?.designSystemId ?? config.designSystem?.id ?? "mono-v1"}</span>
            </div>
            <div className="ps-preview-mode-tabs" role="tablist" aria-label="預覽範圍">
              <button
                type="button"
                className="ps-tab"
                role="tab"
                aria-selected={previewMode === "current"}
                aria-controls="poster-preview-current"
                data-active={previewMode === "current"}
                onClick={() => setPreviewMode("current")}
              >
                目前版型
              </button>
              <button
                type="button"
                className="ps-tab"
                role="tab"
                aria-selected={previewMode === "all"}
                aria-controls="poster-preview-all"
                data-active={previewMode === "all"}
                onClick={() => setPreviewMode("all")}
              >
                全部版型（{config.variants.length}）
              </button>
            </div>
            <div id={`poster-preview-${previewMode}`} role="tabpanel" className={previewMode === "current" ? "ps-preview-current" : "ps-preview-grid"}>
              {(previewMode === "current" ? [variant] : config.variants).map((previewVariant) => {
                const previewSize = previewVariant.size ?? config.size;
                const isActive = previewVariant.id === variant.id;
                const variantWarnings = warningsByVariant[previewVariant.id] ?? [];
                return (
                  <article key={previewVariant.id} className="ps-preview-card" data-active={isActive}>
                    <button
                      type="button"
                      className="ps-preview-heading"
                      aria-pressed={isActive}
                      onClick={() => commitState((current) => ({ ...current, variantId: previewVariant.id }))}
                    >
                      <span className="min-w-0 truncate text-sm font-semibold">{previewVariant.label}</span>
                      <span className="shrink-0 text-[11px] text-[var(--ps-muted)]">{previewSize.width}×{previewSize.height}</span>
                    </button>
                    <div className="ps-preview-surface">
                      <canvas
                        ref={(node) => {
                          if (node) canvasRefs.current.set(previewVariant.id, node);
                          else canvasRefs.current.delete(previewVariant.id);
                        }}
                        width={previewSize.width}
                        height={previewSize.height}
                        className="ps-canvas ps-preview-canvas"
                        style={{ cursor: isActive ? cursor : "default" }}
                        aria-label={`${previewVariant.label} 預覽`}
                        role="img"
                        onClick={() => {
                          if (!isActive) commitState((current) => ({ ...current, variantId: previewVariant.id }));
                        }}
                        onPointerDown={isActive ? onPointerDown : undefined}
                        onPointerMove={isActive ? onPointerMove : undefined}
                        onPointerUp={isActive ? onPointerUp : undefined}
                        onPointerCancel={isActive ? onPointerUp : undefined}
                        onPointerLeave={
                          isActive
                            ? (event) => {
                                if (!dragRef.current) setCursor("default");
                                else onPointerUp(event);
                              }
                            : undefined
                        }
                      />
                    </div>
                    {variantWarnings.length > 0 ? (
                      <ul className="mt-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-900" role="status">
                        {variantWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {toast ? (
        <div className="ps-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Collapsible({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  return (
    <section className="ps-card ps-disclosure">
      <button
        id={buttonId}
        type="button"
        className="ps-disclosure-trigger"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>
          <span className="ps-section-title">{title}</span>
          {hint ? <span className="ps-disclosure-hint">{hint}</span> : null}
        </span>
        <span className="ps-disclosure-state" aria-hidden="true">
          {open ? "收合" : "展開"}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="ps-disclosure-content" role="region" aria-labelledby={buttonId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="ps-empty-state">{text}</p>;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
