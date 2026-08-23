/**
 * 本機儲存：欄位值、字體設定、微調值存 localStorage；圖片存 IndexedDB。
 * 全部只存在使用者自己的瀏覽器，不上傳。
 */
import type { Adjustments, FontOverrides, ModuleAdjustments, StudioState, TemplateConfig, Values } from "./types";
import { isImageValue } from "./format";

const ns = (config: TemplateConfig) => `poster-studio:${config.id}:v${config.version}`;

export interface PersistedState {
  variantId: string;
  values: Values;
  adjustments: Adjustments;
  moduleAdjustments?: ModuleAdjustments;
  fontOverrides: FontOverrides;
  savedAt: number;
}

export function loadState(config: TemplateConfig): PersistedState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ns(config));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 圖片值只留鍵與構圖（blob URL 重新整理後失效） */
function stripImages(values: Values): Values {
  const out: Values = {};
  for (const [k, v] of Object.entries(values)) {
    if (isImageValue(v)) {
      const iv = v as { src: string; focalX: number; focalY: number; zoom: number; key?: string; name?: string };
      out[k] = iv.key || iv.src.startsWith("/") ? { src: iv.key ? "" : iv.src, focalX: iv.focalX, focalY: iv.focalY, zoom: iv.zoom, key: iv.key, name: iv.name } : null;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function saveState(config: TemplateConfig, state: StudioState): void {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: PersistedState = {
      variantId: state.variantId,
      values: stripImages(state.values),
      adjustments: state.adjustments,
      moduleAdjustments: state.moduleAdjustments,
      fontOverrides: state.fontOverrides,
      savedAt: Date.now(),
    };
    localStorage.setItem(ns(config), JSON.stringify(payload));
  } catch {
    /* 容量滿或隱私模式：忽略 */
  }
}

export function clearState(config: TemplateConfig): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(ns(config));
}

/* ---------- 預設組合 ---------- */

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  variantId: string;
  values: Values;
  adjustments: Adjustments;
  moduleAdjustments?: ModuleAdjustments;
  fontOverrides: FontOverrides;
}

export function loadPresets(config: TemplateConfig): Preset[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${ns(config)}:presets`);
    const list = raw ? (JSON.parse(raw) as Preset[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function savePresets(config: TemplateConfig, presets: Preset[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${ns(config)}:presets`, JSON.stringify(presets));
  } catch {
    /* ignore */
  }
}

export function makePreset(name: string, state: StudioState): Preset {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: Date.now(),
    variantId: state.variantId,
    values: stripImages(state.values),
    adjustments: state.adjustments,
    moduleAdjustments: state.moduleAdjustments,
    fontOverrides: state.fontOverrides,
  };
}

/* ---------- IndexedDB 圖片 ---------- */

const DB_NAME = "poster-studio";
const STORE = "images";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no-indexeddb"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putImageBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getImageBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

export async function deleteImageBlob(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export function imageKey(config: TemplateConfig, fieldId: string): string {
  return `${ns(config)}:${fieldId}`;
}
