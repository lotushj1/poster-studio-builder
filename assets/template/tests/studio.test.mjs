import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fitText, layoutText, layoutVertical, tokenize, measureRun } from "../app/studio/text.ts";
import { applyTemplate, buildFilename, formatDate, formatTime, allBoundEmpty } from "../app/studio/format.ts";
import { layerGeometry, moduleBounds, transformBoxAround } from "../app/studio/geometry.ts";
import { variantExportIds, variantExportInputs } from "../app/studio/export-helpers.ts";
import { templateConfig } from "../app/studio/config.ts";

const posterStudioSource = fs.readFileSync(new URL("../app/studio/PosterStudio.tsx", import.meta.url), "utf8");
const globalsSource = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** 假量測：中文字 10px、拉丁字母／數字 6px、空白 3px，依字級等比 */
function measurerFor(size) {
  const unit = size / 10;
  return {
    measure(text) {
      let w = 0;
      for (const ch of Array.from(text)) {
        if (ch === " ") w += 3 * unit;
        else if (/[⺀-鿿＀-￯\u3000-ヿ]/.test(ch)) w += 10 * unit;
        else w += 6 * unit;
      }
      return w;
    },
  };
}
const m = measurerFor(10);
const base = { fontSize: 10, lineHeight: 1.5, letterSpacing: 0 };

test("tokenize：中文逐字、英文成詞、空白獨立", () => {
  assert.deepEqual(tokenize("用 AI 做工具"), ["用", " ", "AI", " ", "做", "工", "具"]);
});

test("layoutText：依寬度斷行", () => {
  const l = layoutText("一二三四五六七八", { ...base, maxWidth: 50 }, m);
  assert.deepEqual(
    l.lines.map((x) => x.text),
    ["一二三四五", "六七八"],
  );
  assert.equal(l.totalHeight, 2 * 15);
  assert.equal(l.truncated, false);
});

test("layoutText：英文字不在中間斷開", () => {
  const l = layoutText("AI tool 設計", { ...base, maxWidth: 45 }, m);
  assert.deepEqual(
    l.lines.map((x) => x.text),
    ["AI tool", "設計"],
  );
});

test("layoutText：避頭點，句號掛在行尾", () => {
  const l = layoutText("一二三四五。六", { ...base, maxWidth: 50 }, m);
  assert.equal(l.lines[0].text, "一二三四五。");
  assert.equal(l.lines[1].text, "六");
});

test("layoutText：超過 maxLines 用省略號截斷", () => {
  const l = layoutText("一二三四五六七八九十", { ...base, maxWidth: 50, maxLines: 1 }, m);
  assert.equal(l.truncated, true);
  assert.equal(l.lines.length, 1);
  assert.ok(l.lines[0].text.endsWith("…"));
  assert.ok(l.lines[0].width <= 50);
});

test("layoutText：maxHeight 限制行數", () => {
  const l = layoutText("一二三四五六七八九十", { ...base, maxWidth: 50, maxHeight: 16 }, m);
  assert.equal(l.lines.length, 1);
  assert.equal(l.truncated, true);
});

test("layoutText：換行符號會分段", () => {
  const l = layoutText("第一行\n第二行", { ...base, maxWidth: 200 }, m);
  assert.deepEqual(l.lines.map((x) => x.text), ["第一行", "第二行"]);
});

test("measureRun：字距會累加", () => {
  assert.equal(measureRun("一二三", m, 2), 30 + 4);
});

test("fitText：放不下時縮到放得下的最大字級", () => {
  const l = fitText("一二三四五六七八", { ...base, maxWidth: 50, maxHeight: 15, maxLines: 1 }, measurerFor, 4);
  assert.equal(l.truncated, false);
  assert.equal(l.lines.length, 1);
  assert.ok(l.fontSize < 10 && l.fontSize >= 4, `got ${l.fontSize}`);
  assert.ok(l.lines[0].width <= 50);
});

test("fitText：放得下就維持原字級", () => {
  const l = fitText("一二", { ...base, maxWidth: 50 }, measurerFor, 4);
  assert.equal(l.fontSize, 10);
});

test("layoutVertical：每欄字數依高度決定，欄由右往左", () => {
  const l = layoutVertical("一二三四五六", { ...base, maxWidth: 100, maxHeight: 35 }, m);
  assert.deepEqual(l.lines.map((x) => x.text), ["一二三", "四五六"]);
  assert.equal(l.lineHeightPx, 15);
});

test("formatDate／formatTime", () => {
  assert.equal(formatDate("2026-08-21", "M月D日（ddd）"), "8月21日（週五）");
  assert.equal(formatDate("2026-08-21", "YYYY/MM/DD dddd"), "2026/08/21 星期五");
  assert.equal(formatTime("20:05", "HH:mm"), "20:05");
  assert.equal(formatTime("20:05", "A h:mm"), "下午 8:05");
  assert.equal(formatDate("not-a-date", "M/D"), "not-a-date");
});

test("applyTemplate：套值、日期格式、缺欄位為空", () => {
  const fields = new Map([
    ["title", { id: "title", type: "text", label: "標題" }],
    ["date", { id: "date", type: "date", label: "日期" }],
    ["kind", { id: "kind", type: "select", label: "類型", options: [{ value: "a", label: "公休" }], default: "a" }],
  ]);
  const values = { title: "測試", date: "2026-08-21", kind: "a" };
  assert.equal(applyTemplate("{title}｜{date:M/D}｜{kind}｜{missing}", values, fields), "測試｜8/21｜公休｜");
  assert.equal(allBoundEmpty("{title}", { title: "" }, fields), true);
  assert.equal(allBoundEmpty("固定文字", {}, fields), false);
});

test("buildFilename：代入名稱、變體並清掉非法字元", () => {
  const fields = new Map([["title", { id: "title", type: "text", label: "標題" }]]);
  const name = buildFilename("{name}-{variant}-{title}", {
    name: "直播海報",
    variant: "two-guests",
    values: { title: "A/B?" },
    fields,
  });
  assert.equal(name, "直播海報-two-guests-A-B-");
});

test("模組變換：以模組基準邊界中心縮放，並同步套用位移", () => {
  const variant = {
    id: "feed-one",
    label: "測試版型",
    layers: [
      { id: "feed-one__photo", moduleId: "feed-one__guest", type: "image", x: 10, y: 10, w: 100, h: 100, src: "{photo}" },
      { id: "feed-one__name", moduleId: "feed-one__guest", type: "text", x: 20, y: 120, w: 80, h: 20, text: "{name}", font: { size: 20 }, color: "#000" },
      { id: "feed-one__title", moduleId: "feed-one__guest", type: "text", x: 20, y: 145, w: 80, h: 20, text: "{title}", font: { size: 10 }, color: "#000" },
    ],
    modules: [{ id: "feed-one__guest", label: "來賓模組", layerIds: ["feed-one__photo", "feed-one__name", "feed-one__title"], adjustable: ["x", "y", "scale"] }],
  };
  const moduleDef = variant.modules[0];
  assert.deepEqual(moduleBounds(variant, moduleDef), { x: 10, y: 10, w: 100, h: 155 });
  assert.deepEqual(transformBoxAround({ x: 20, y: 120, w: 80, h: 20 }, moduleBounds(variant, moduleDef), { scale: 2, dx: 10, dy: -5 }), {
    x: 40,
    y: 225,
    w: 160,
    h: 40,
  });
  const geometry = layerGeometry(variant.layers[1], variant, {}, { [moduleDef.id]: { scale: 2, dx: 10, dy: -5 } });
  assert.equal(geometry.scale, 2);
  assert.deepEqual(geometry.box, { x: 40, y: 225, w: 160, h: 40 });
});

test("範例設定：四個變體與模組 id 都是 variant-specific", () => {
  assert.deepEqual(
    templateConfig.variants.map((variant) => variant.id),
    ["ig-feed-one-guest", "ig-feed-two-guests", "ig-story-one-guest", "ig-story-two-guests"],
  );
  assert.equal(templateConfig.designSystem?.id, "mono-v1");
  assert.equal(templateConfig.fonts?.localCatalog, false);
  const layerIds = new Set();
  const moduleIds = new Set();
  for (const variant of templateConfig.variants) {
    assert.equal(new Set(variant.layers.map((layer) => layer.id)).size, variant.layers.length);
    for (const moduleDef of variant.modules ?? []) {
      assert.ok(moduleDef.id.startsWith(`${variant.id}__`));
      assert.equal(new Set(moduleDef.layerIds).size, moduleDef.layerIds.length);
      assert.ok(moduleDef.layerIds.every((id) => variant.layers.some((layer) => layer.id === id && layer.moduleId === moduleDef.id)));
      assert.ok(!moduleIds.has(moduleDef.id));
      moduleIds.add(moduleDef.id);
    }
    for (const layer of variant.layers) {
      assert.ok(!layerIds.has(layer.id));
      layerIds.add(layer.id);
    }
  }
});

test("範例預設資料：文字欄位不超過上限，避免初始截斷警告", () => {
  const fields = [...templateConfig.fields, ...templateConfig.variants.flatMap((variant) => variant.fields ?? [])];
  for (const field of fields) {
    if (!(field.type === "text" || field.type === "textarea")) continue;
    if (typeof field.default !== "string" || field.maxLength === undefined) continue;
    assert.ok(
      Array.from(field.default).length <= field.maxLength,
      `${field.id} default exceeds maxLength and may show an initial truncation warning`,
    );
  }
  for (const id of ["guest1_title", "guest2_title"]) {
    const field = fields.find((candidate) => candidate.id === id);
    assert.ok(field, `${id} should exist in the two-guest sample`);
    assert.ok(Array.from(field.default ?? "").length <= (field.maxLength ?? Infinity));
  }
});

test("批次匯出 helper：涵蓋全部變體且沿用同一份資料與調整", () => {
  const variants = [{ id: "a", label: "甲", layers: [] }, { id: "b", label: "乙", layers: [] }];
  const input = {
    config: { id: "test", version: 1, name: "測試", size: { width: 1, height: 1 }, fields: [], variants },
    variant: variants[0],
    values: { title: "同一份內容" },
    adjustments: { "a__guest": { dx: 12 } },
    moduleAdjustments: { "a__guest": { scale: 1.2 } },
    fontOverrides: {},
    images: new Map(),
  };
  assert.deepEqual(variantExportIds(variants), ["a", "b"]);
  const inputs = variantExportInputs(input, variants);
  assert.deepEqual(inputs.map((candidate) => candidate.variant.id), ["a", "b"]);
  assert.deepEqual(inputs.map((candidate) => candidate.values), [input.values, input.values]);
  assert.deepEqual(inputs.map((candidate) => candidate.moduleAdjustments), [input.moduleAdjustments, input.moduleAdjustments]);
});

test("UI source invariant：主控制列使用 tabs、tabpanel 與 ARIA 關聯", () => {
  assert.match(posterStudioSource, /role="tablist"/);
  assert.match(posterStudioSource, /role="tab"/);
  assert.match(posterStudioSource, /aria-selected=\{selected\}/);
  assert.match(posterStudioSource, /aria-controls=\{`poster-panel-\$\{tab\.id\}`\}/);
  assert.match(posterStudioSource, /role="tabpanel"/);
  assert.match(posterStudioSource, /ArrowRight/);
  assert.match(posterStudioSource, /tabIndex=\{selected \? 0 : -1\}/);
});

test("UI source invariant：目前版型預覽與全部版型預覽分開呈現", () => {
  assert.match(posterStudioSource, /type PreviewMode = "current" \| "all"/);
  assert.match(posterStudioSource, /目前版型/);
  assert.match(posterStudioSource, /全部版型/);
  assert.match(posterStudioSource, /previewMode === "current" \? \[variant\] : config\.variants/);
});

test("UI source invariant：不使用 transition all，且提供 reduced-motion 規則", () => {
  assert.doesNotMatch(globalsSource, /transition\s*:\s*all\b/);
  assert.match(globalsSource, /prefers-reduced-motion/);
  assert.match(globalsSource, /:focus-visible/);
});

test("UI source invariant：四個主 tab 以等寬欄位同時顯示", () => {
  for (const label of ["內容", "素材", "調整", "匯出"]) assert.match(posterStudioSource, new RegExp(`label: "${label}"`));
  assert.doesNotMatch(posterStudioSource, /ps-scroll-hint/);
  assert.match(globalsSource, /\.ps-tabs\s*\{[\s\S]*display:\s*grid/);
  assert.match(globalsSource, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(globalsSource, /\.ps-tabs\s*\{[\s\S]*overflow-x\s*:/);
});
