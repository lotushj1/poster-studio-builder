"use client";

import { useId, useRef } from "react";
import type { FieldDef, FieldValue, ImageValue } from "../types";
import { isImageValue, todayISO } from "../format";

export interface FieldControlProps {
  field: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
  onImageFile?: (file: File) => void;
  onImageClear?: () => void;
}

export default function FieldControl({ field, value, onChange, onImageFile, onImageClear }: FieldControlProps) {
  const id = useId();
  switch (field.type) {
    case "text":
      return (
        <Labeled id={id} field={field} counter={typeof value === "string" && field.maxLength ? `${value.length}/${field.maxLength}` : undefined}>
          <input
            id={id}
            className="ps-input"
            type="text"
            value={typeof value === "string" ? value : ""}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Labeled>
      );
    case "textarea":
      return (
        <Labeled id={id} field={field} counter={typeof value === "string" && field.maxLength ? `${value.length}/${field.maxLength}` : undefined}>
          <textarea
            id={id}
            className="ps-input"
            rows={2}
            value={typeof value === "string" ? value : ""}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Labeled>
      );
    case "number":
      return (
        <Labeled id={id} field={field}>
          <div className="flex items-center gap-2">
            <input
              id={id}
              className="ps-input"
              type="number"
              value={typeof value === "number" ? value : ""}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            />
            {field.unit ? <span className="text-sm text-[var(--ps-muted)]">{field.unit}</span> : null}
          </div>
        </Labeled>
      );
    case "date":
      return (
        <Labeled id={id} field={field}>
          <div className="flex items-center gap-2">
            <input
              id={id}
              className="ps-input"
              type="date"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
            />
            <button type="button" className="ps-btn ps-btn-sm" onClick={() => onChange(todayISO())}>
              今天
            </button>
          </div>
        </Labeled>
      );
    case "time":
      return (
        <Labeled id={id} field={field}>
          <input
            id={id}
            className="ps-input"
            type="time"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </Labeled>
      );
    case "select":
      return (
        <Labeled id={id} field={field}>
          <select
            id={id}
            className="ps-input"
            value={typeof value === "string" ? value : field.default}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Labeled>
      );
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-3 py-1">
          <label htmlFor={id} className="text-sm font-semibold">
            {field.label}
            {field.hint ? <span className="ps-hint font-normal">{field.hint}</span> : null}
          </label>
          <input
            id={id}
            type="checkbox"
            className="h-5 w-5 accent-[var(--ps-accent)]"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
        </div>
      );
    case "color": {
      const current = typeof value === "string" && value ? value : field.default;
      return (
        <Labeled id={id} field={field}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={id}
              type="color"
              className="ps-color"
              value={toHex(current)}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${field.label} 色彩選擇`}
            />
            {(field.swatches ?? []).map((c) => (
              <button
                key={c}
                type="button"
                className="ps-swatch"
                style={{ background: c }}
                data-active={c.toLowerCase() === current.toLowerCase()}
                aria-label={`色票 ${c}`}
                title={c}
                onClick={() => onChange(c)}
              />
            ))}
            <input
              id={`${id}-hex`}
              name={`${field.id}-hex`}
              className="ps-input w-28 font-mono text-xs"
              value={current}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${field.label} 色碼`}
            />
          </div>
        </Labeled>
      );
    }
    case "image":
      return (
        <ImageControl
          id={id}
          field={field}
          value={isImageValue(value ?? null) ? (value as ImageValue) : null}
          onChange={onChange}
          onFile={onImageFile}
          onClear={onImageClear}
        />
      );
    default:
      return null;
  }
}

function Labeled({
  id,
  field,
  counter,
  children,
}: {
  id: string;
  field: FieldDef;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="ps-label">
          {field.label}
        </label>
        {counter ? <span className="text-xs text-[var(--ps-muted)]">{counter}</span> : null}
      </div>
      {children}
      {field.hint ? <p className="ps-hint">{field.hint}</p> : null}
    </div>
  );
}

function toHex(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000";
}

function ImageControl({
  id,
  field,
  value,
  onChange,
  onFile,
  onClear,
}: {
  id: string;
  field: FieldDef;
  value: ImageValue | null;
  onChange: (v: FieldValue) => void;
  onFile?: (file: File) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = () => inputRef.current?.click();
  const hasImage = !!value?.src;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="ps-label">{field.label}</span>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={`${field.label} 選擇檔案`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && onFile) onFile(f);
          e.target.value = "";
        }}
      />
      <div
        className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--ps-line)] p-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && f.type.startsWith("image/") && onFile) onFile(f);
        }}
      >
        <button
          type="button"
          onClick={pick}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--ps-bg)] text-xs text-[var(--ps-muted)]"
          aria-label={hasImage ? "更換圖片" : "選擇圖片"}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value!.src} alt="" className="h-full w-full object-cover" />
          ) : (
            "＋"
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ps-btn ps-btn-sm" onClick={pick}>
              {hasImage ? "更換圖片" : "選擇圖片"}
            </button>
            {hasImage ? (
              <>
                <button
                  type="button"
                  className="ps-btn ps-btn-sm"
                  onClick={() => onChange({ ...value!, focalX: 0.5, focalY: 0.5, zoom: 1 })}
                >
                  置中
                </button>
                <button type="button" className="ps-btn ps-btn-sm" onClick={() => (onClear ? onClear() : onChange(null))}>
                  移除
                </button>
              </>
            ) : null}
          </div>
          {hasImage ? (
            <label className="mt-2 flex items-center gap-2 text-xs text-[var(--ps-muted)]">
              <span className="shrink-0">縮放</span>
              <input
                type="range"
                className="ps-range"
                min={1}
                max={3}
                step={0.01}
                value={value!.zoom}
                onChange={(e) => onChange({ ...value!, zoom: Number(e.target.value) })}
                aria-label={`${field.label} 縮放`}
              />
              <span className="w-10 text-right tabular-nums">{value!.zoom.toFixed(2)}×</span>
            </label>
          ) : (
            <p className="ps-hint mt-1">{field.hint ?? "可直接把圖片拖進來"}</p>
          )}
        </div>
      </div>
      {hasImage ? <p className="ps-hint">在右邊預覽圖上拖曳照片可以調整構圖</p> : field.hint && hasImage === false ? null : null}
    </div>
  );
}
