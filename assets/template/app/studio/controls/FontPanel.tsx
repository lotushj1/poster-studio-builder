"use client";

import { useMemo, useState } from "react";
import type { FontOverride, FontOverrides, TemplateConfig } from "../types";
import {
  availableSuggestedFonts,
  faceStyle,
  faceWeight,
  isFontAvailable,
  pinFace,
  queryLocalFontFamilies,
  supportsLocalFonts,
  WEIGHT_OPTIONS,
  type LocalFontFamily,
} from "../fonts";

interface Props {
  config: TemplateConfig;
  overrides: FontOverrides;
  onChange: (role: string, override: FontOverride | null) => void;
  /** 字體載入完成後要求重新繪製 */
  onFontsChanged: () => void;
}

type Catalog = { status: "idle" | "loading" | "ready" | "denied" | "error"; families: LocalFontFamily[] };

export default function FontPanel({ config, overrides, onChange, onFontsChanged }: Props) {
  const roles = config.fonts?.roles ?? {};
  const roleIds = Object.keys(roles);
  const localCatalogEnabled = config.fonts?.localCatalog === true;
  const [catalog, setCatalog] = useState<Catalog>({ status: "idle", families: [] });
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [supported] = useState(() => localCatalogEnabled && supportsLocalFonts());

  if (roleIds.length === 0) return null;

  const loadCatalog = async () => {
    setCatalog((c) => ({ ...c, status: "loading" }));
    try {
      const families = await queryLocalFontFamilies();
      setCatalog({ status: "ready", families });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      setCatalog({ status: name === "NotAllowedError" ? "denied" : "error", families: [] });
    }
  };

  return (
    <div className="space-y-3">
      {roleIds.map((roleId) => {
        const role = roles[roleId];
        const ov = overrides[roleId];
        const family = ov?.family ?? role.family;
        const weight = ov?.weight ?? role.weight ?? 400;
        const availability = localCatalogEnabled ? isFontAvailable(family) : null;
        const open = openRole === roleId;
        return (
          <div key={roleId} className="rounded-xl border border-[var(--ps-line)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{role.label}</div>
                <div
                  className="truncate text-base"
                  style={{ fontFamily: `"${family}", ${role.fallback ?? "sans-serif"}`, fontWeight: Number(weight) || 400 }}
                  title={family}
                >
                  {family}
                  <span className="ml-2 text-xs text-[var(--ps-muted)]">
                    {availability === null ? "固定繁中安全字體堆疊" : availability ? "已安裝" : "電腦沒有這個字體，會用備援字體"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  className="ps-input w-auto py-1 text-xs"
                  value={String(weight)}
                  aria-label={`${role.label} 字重`}
                  onChange={(e) => {
                    onChange(roleId, { ...(ov ?? { family }), weight: Number(e.target.value) });
                    onFontsChanged();
                  }}
                >
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="ps-btn ps-btn-sm" onClick={() => setOpenRole(open ? null : roleId)}>
                  {open ? "收合" : "進階字體設定"}
                </button>
              </div>
            </div>
            {open ? (
              <FontPicker
                config={config}
                current={family}
                supported={supported}
                localCatalogEnabled={localCatalogEnabled}
                catalog={catalog}
                onLoadCatalog={loadCatalog}
                onPick={async (next) => {
                  onChange(roleId, { ...next, weight: next.weight ?? weight });
                  onFontsChanged();
                }}
                onReset={() => {
                  onChange(roleId, null);
                  onFontsChanged();
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FontPicker({
  config,
  current,
  supported,
  localCatalogEnabled,
  catalog,
  onLoadCatalog,
  onPick,
  onReset,
}: {
  config: TemplateConfig;
  current: string;
  supported: boolean;
  localCatalogEnabled: boolean;
  catalog: Catalog;
  onLoadCatalog: () => void;
  onPick: (o: FontOverride) => void | Promise<void>;
  onReset: () => void;
}) {
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const [pinning, setPinning] = useState<string | null>(null);
  const suggested = useMemo(
    () => (localCatalogEnabled ? availableSuggestedFonts(config.fonts?.suggested ?? []) : []),
    [config, localCatalogEnabled],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? catalog.families.filter(
          (f) => f.family.toLowerCase().includes(q) || f.faces.some((x) => x.fullName.toLowerCase().includes(q)),
        )
      : catalog.families;
    return list.slice(0, 120);
  }, [catalog.families, query]);

  const typedAvailable = typed.trim() ? isFontAvailable(typed.trim()) : null;

  return (
    <div className="mt-3 space-y-3 border-t border-[var(--ps-line)] pt-3">
      {suggested.length > 0 ? (
        <div>
          <div className="ps-section-title mb-2">這台電腦有的常用中文字體</div>
          <div className="flex flex-wrap gap-2">
            {suggested.map((f) => (
              <button
                key={f.family}
                type="button"
                className="ps-chip"
                data-active={f.family === current}
                style={{ fontFamily: `"${f.family}"` }}
                onClick={() => onPick({ family: f.family })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {localCatalogEnabled && supported ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="ps-section-title">電腦裡所有字體</div>
            {catalog.status !== "ready" ? (
              <button type="button" className="ps-btn ps-btn-sm" onClick={onLoadCatalog} disabled={catalog.status === "loading"}>
                {catalog.status === "loading" ? "讀取中…" : "讀取電腦字體"}
              </button>
            ) : (
              <span className="text-xs text-[var(--ps-muted)]">{catalog.families.length} 個字體家族</span>
            )}
          </div>
          {catalog.status === "denied" ? (
            <p className="ps-hint">你拒絕了字體讀取權限。可以在網址列左邊的權限設定重新允許，或直接在下方輸入字體名稱。</p>
          ) : null}
          {catalog.status === "error" ? <p className="ps-hint">讀不到字體清單，請改用下方輸入字體名稱。</p> : null}
          {catalog.status === "idle" ? (
            <p className="ps-hint">第一次會跳出瀏覽器的權限詢問，允許後就能從整台電腦的字體挑選。字體不會被上傳。</p>
          ) : null}
          {catalog.status === "ready" ? (
            <div>
              <input
                className="ps-input mb-2"
                placeholder="搜尋字體名稱"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="搜尋字體"
              />
              <ul className="ps-scroll max-h-64 space-y-1 overflow-auto rounded-lg border border-[var(--ps-line)] p-1">
                {filtered.map((fam) => (
                  <li key={fam.family} className="rounded-md px-2 py-1 hover:bg-[var(--ps-bg)]">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-sm"
                        style={{ fontFamily: `"${fam.family}"` }}
                        title={fam.family}
                        onClick={() => onPick({ family: fam.family })}
                      >
                        {fam.family}
                        <span className="ml-2 font-sans text-xs text-[var(--ps-muted)]">{fam.faces.length} 款</span>
                      </button>
                      {fam.family === current ? <span className="text-xs text-[var(--ps-accent)]">使用中</span> : null}
                    </div>
                    {fam.family === current && fam.faces.length > 1 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {fam.faces.map((face) => (
                          <button
                            key={face.postscriptName}
                            type="button"
                            className="ps-chip"
                            disabled={pinning === face.postscriptName}
                            onClick={async () => {
                              setPinning(face.postscriptName);
                              await pinFace(face);
                              setPinning(null);
                              await onPick({
                                family: face.family,
                                postscriptName: face.postscriptName,
                                weight: faceWeight(face.style),
                                style: faceStyle(face.style),
                              });
                            }}
                          >
                            {face.style}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
                {filtered.length === 0 ? <li className="px-2 py-2 text-sm text-[var(--ps-muted)]">沒有符合的字體</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="ps-hint">
          {localCatalogEnabled
            ? "這個瀏覽器不支援列出電腦字體（桌面版 Chrome 或 Edge 才有）。你仍然可以直接輸入已安裝字體的名稱。"
            : "預設不讀取整台電腦的字體清單，也不會請求權限。需要進階字體清單時，請在設定開啟 fonts.localCatalog；仍可在下方直接輸入字體名稱。"}
        </p>
      )}

      <div>
        <div className="ps-section-title mb-2">直接輸入字體名稱</div>
        <div className="flex gap-2">
          <input
            className="ps-input"
            placeholder="例如 Noto Sans TC、jf open 粉圓 2.0"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim()) onPick({ family: typed.trim() });
            }}
            aria-label="字體名稱"
          />
          <button type="button" className="ps-btn ps-btn-sm" disabled={!typed.trim()} onClick={() => onPick({ family: typed.trim() })}>
            套用
          </button>
        </div>
        {typed.trim() ? (
          <p className="ps-hint" style={{ fontFamily: `"${typed.trim()}"` }}>
            {typedAvailable ? `偵測到「${typed.trim()}」，預覽：永和豆漿 Aa 123` : `找不到「${typed.trim()}」，名稱要跟字體簿／字型設定裡的一樣`}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button type="button" className="ps-btn ps-btn-sm" onClick={onReset}>
          恢復範本預設字體
        </button>
      </div>
    </div>
  );
}
