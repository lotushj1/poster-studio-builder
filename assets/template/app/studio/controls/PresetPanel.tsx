"use client";

import { useState } from "react";
import type { Preset } from "../storage";

interface Props {
  presets: Preset[];
  onSave: (name: string) => void;
  onLoad: (preset: Preset) => void;
  onDelete: (id: string) => void;
}

export default function PresetPanel({ presets, onSave, onLoad, onDelete }: Props) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <p className="ps-hint">把常用的內容存起來（例如「週三公休版」），下次一鍵帶入，只改日期就好。照片不會存進組合。</p>
      <div className="flex gap-2">
        <input
          className="ps-input"
          placeholder="組合名稱"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onSave(name.trim());
              setName("");
            }
          }}
          aria-label="組合名稱"
        />
        <button
          type="button"
          className="ps-btn ps-btn-sm"
          disabled={!name.trim()}
          onClick={() => {
            onSave(name.trim());
            setName("");
          }}
        >
          儲存目前內容
        </button>
      </div>
      {presets.length > 0 ? (
        <ul className="space-y-1">
          {presets.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ps-line)] px-3 py-2">
              <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-[var(--ps-accent)]" onClick={() => onLoad(p)} title="套用這組內容">
                {p.name}
                <span className="ml-2 text-xs font-normal text-[var(--ps-muted)]">{new Date(p.createdAt).toLocaleDateString("zh-TW")}</span>
              </button>
              <button type="button" className="ps-btn ps-btn-sm" onClick={() => onLoad(p)}>
                套用
              </button>
              <button type="button" className="ps-btn ps-btn-sm" aria-label={`刪除組合 ${p.name}`} onClick={() => onDelete(p.id)}>
                刪除
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
