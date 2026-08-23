#!/usr/bin/env node
/*
 * Validate a Codex-generated Figma source package using Node built-ins only.
 *
 * Usage:
 *   node validate-source-package.mjs <manifest.json>
 *   node validate-source-package.mjs <manifest.json> --require-human-gates
 *
 * This is a structural/file/geometry gate. It does not connect to Figma and
 * cannot prove visual completeness or pixel identity; use verify.md for that.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const manifestArg = args.find((arg) => !arg.startsWith("--"));
const requireHumanGates = args.includes("--require-human-gates");

// Shared primitives are kept at module scope because the detailed validators
// below are intentionally small, standalone functions.
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value) {
  return isFiniteNumber(value) && value > 0;
}

function unique(items) {
  return new Set(items).size === items.length;
}

if (!manifestArg) {
  console.error("用法：node validate-source-package.mjs <manifest.json> [--require-human-gates]");
  process.exitCode = 2;
} else {
  const result = validateManifest(manifestArg, { requireHumanGates });
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    console.error(`source package 驗證失敗：${result.errors.length} 個錯誤`);
    process.exitCode = 1;
  } else {
    console.log(
      `source package 驗證通過：${result.summary.variants} variants、${result.summary.layers} layers、${result.summary.assets} assets、${result.summary.fonts} fonts`,
    );
    if (result.summary.humanGatesPending > 0) {
      console.log("提示：human completeness/fidelity gate 尚未全部通過；建置前請加 --require-human-gates。");
    }
  }
}

function validateManifest(manifestArg, options = {}) {
  const errors = [];
  const warnings = [];
  const manifestPath = path.resolve(manifestArg);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return {
      errors: [`無法讀取或解析 manifest：${manifestPath}（${error.message}）`],
      warnings,
      summary: emptySummary(),
    };
  }
  const root = path.dirname(manifestPath);
  const at = (key, message) => errors.push(`${key}: ${message}`);
  const has = (value) => value !== undefined && value !== null;
  const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
  const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
  const isPositiveNumber = (value) => isFiniteNumber(value) && value > 0;
  const unique = (items) => new Set(items).size === items.length;

  if (!isObject(manifest)) {
    at("manifest", "必須是 JSON object");
    return { errors, warnings, summary: emptySummary() };
  }

  if (manifest.schemaVersion !== 1) at("schemaVersion", "必須為 1");
  if (!isObject(manifest.generation)) at("generation", "必須存在");
  if (manifest.generation?.actor !== "codex") at("generation.actor", "必須是 codex，manifest 由 Codex 產生");
  if (manifest.generation?.method !== "figma-mcp") at("generation.method", "必須是 figma-mcp");
  if (!isNonEmptyString(manifest.generation?.capturedAt)) at("generation.capturedAt", "必須是非空的時間字串");

  const source = manifest.source;
  if (!isObject(source)) {
    at("source", "必須存在");
  } else {
    if (source.type !== "figma") at("source.type", "必須是 figma");
    validateFigmaUrl(source.url, source.fileKey, source.nodeId, at);
    const frame = source.frame;
    if (!isObject(frame)) {
      at("source.frame", "必須存在");
    } else {
      if (!isNonEmptyString(frame.id)) at("source.frame.id", "必須存在");
      else if (normalizeNodeId(frame.id) !== normalizeNodeId(source.nodeId)) {
        at("source.frame.id", "必須與 source.nodeId 相同");
      }
      if (!isNonEmptyString(frame.name)) at("source.frame.name", "必須存在");
      if (frame.type !== "FRAME") at("source.frame.type", "必須是 FRAME");
      if (!isPositiveNumber(frame.width)) at("source.frame.width", "必須是正數");
      if (!isPositiveNumber(frame.height)) at("source.frame.height", "必須是正數");
    }
  }

  validateExtraction(manifest.extraction, at);

  const reference = manifest.reference;
  if (!isObject(reference)) {
    at("reference", "必須存在");
  } else {
    if (!isSafeRelativePath(reference.framePng)) at("reference.framePng", "必須是 source package 內的相對路徑");
    else checkPng(reference.framePng, root, source?.frame?.width, source?.frame?.height, "reference.framePng", at);
    if (!isPositiveNumber(reference.width)) at("reference.width", "必須是正數");
    if (!isPositiveNumber(reference.height)) at("reference.height", "必須是正數");
    if (isPositiveNumber(source?.frame?.width) && reference.width !== source.frame.width) {
      at("reference.width", "必須與 source.frame.width 相同");
    }
    if (isPositiveNumber(source?.frame?.height) && reference.height !== source.frame.height) {
      at("reference.height", "必須與 source.frame.height 相同");
    }
  }

  const variants = Array.isArray(manifest.variants) ? manifest.variants : [];
  if (variants.length === 0) at("variants", "至少要有一個 variant");
  const variantIds = variants.map((variant) => variant?.id);
  if (!unique(variantIds.filter(isNonEmptyString))) at("variants.id", "variant id 不得重複");
  const variantById = new Map();
  const variantFrameNodeIds = new Set();
  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    const key = `variants[${index}]`;
    if (!isObject(variant)) {
      at(key, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(variant.id)) at(`${key}.id`, "必須存在");
    else variantById.set(variant.id, variant);
    if (variant.name !== `variant:${variant.id}`) at(`${key}.name`, `必須正好是 variant:${variant.id}`);
    if (!isNonEmptyString(variant.frameNodeId)) at(`${key}.frameNodeId`, "必須存在");
    else {
      const normalized = normalizeNodeId(variant.frameNodeId);
      if (variantFrameNodeIds.has(normalized)) at(`${key}.frameNodeId`, "variant Frame node ID 不得重複");
      variantFrameNodeIds.add(normalized);
    }
    if (!isPositiveNumber(variant.width)) at(`${key}.width`, "必須是正數");
    if (!isPositiveNumber(variant.height)) at(`${key}.height`, "必須是正數");
    if (!isSafeRelativePath(variant.referencePng)) at(`${key}.referencePng`, "必須是 source package 內的相對路徑");
    else checkPng(variant.referencePng, root, variant.width, variant.height, `${key}.referencePng`, at);
  }

  const fields = Array.isArray(manifest.fields) ? manifest.fields : [];
  const fieldIds = fields.map((field) => field?.id);
  if (!unique(fieldIds.filter(isNonEmptyString))) at("fields.id", "field id 不得重複");
  const fieldById = new Map();
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const key = `fields[${index}]`;
    if (!isObject(field)) {
      at(key, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(field.id)) at(`${key}.id`, "必須存在");
    else fieldById.set(field.id, field);
    if (field.name !== `field:${field.id}` && field.name !== `image:${field.id}`) {
      at(`${key}.name`, "必須是 field:<id> 或 image:<id>");
    }
    if (!isNonEmptyString(field.type)) at(`${key}.type`, "必須存在");
  }

  const layers = Array.isArray(manifest.layers) ? manifest.layers : [];
  if (layers.length === 0) at("layers", "至少要有一個可見 layer");
  const layerIds = layers.map((layer) => normalizeNodeId(layer?.id));
  if (!unique(layerIds.filter(isNonEmptyString))) at("layers.id", "Figma node id 不得重複");
  const layerById = new Map();
  const layerNamesByVariant = new Map();
  const moduleIds = new Set();
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index];
    const key = `layers[${index}]`;
    if (!isObject(layer)) {
      at(key, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(layer.id)) at(`${key}.id`, "必須存在");
    else layerById.set(normalizeNodeId(layer.id), layer);
    if (!variantById.has(layer.variantId)) at(`${key}.variantId`, "必須指向已宣告的 variant");
    const variantNames = layerNamesByVariant.get(layer.variantId) ?? new Set();
    if (!isNonEmptyString(layer.name)) {
      at(`${key}.name`, "必須存在");
    } else if (variantNames.has(layer.name)) {
      at(`${key}.name`, "同一 variant 內不得重複");
    } else {
      variantNames.add(layer.name);
    }
    layerNamesByVariant.set(layer.variantId, variantNames);
    validateLayerName(layer, key, fieldById, at);
    validateLayerGeometry(layer, key, variantById.get(layer.variantId), at);
    validateLayerProperties(layer, key, at);
    if (layer.visible !== true) at(`${key}.visible`, "manifest 只能包含可見、實際使用的 layer");
    if (!isNonEmptyString(layer.parentId)) at(`${key}.parentId`, "必須存在，根 Frame 可使用自己的 Frame node ID");
    if (!Array.isArray(layer.ancestorIds)) at(`${key}.ancestorIds`, "必須是陣列");
    if (!isFiniteNumber(layer.zIndex) || !Number.isInteger(layer.zIndex)) at(`${key}.zIndex`, "必須是整數");
    if (!isFiniteNumber(layer.rotation)) at(`${key}.rotation`, "必須是數字");
    if (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) at(`${key}.opacity`, "必須是 0 到 1");
    if (layer.moduleId !== undefined && layer.moduleId !== null) {
      if (!isNonEmptyString(layer.moduleId)) at(`${key}.moduleId`, "必須是非空字串");
      else moduleIds.add(layer.moduleId);
    }
    if (layer.type === "TEXT" && layer.editable === true) validateTextLayer(layer, key, at);
  }

  const modules = Array.isArray(manifest.modules) ? manifest.modules : [];
  const declaredModuleIds = new Set();
  for (let index = 0; index < modules.length; index += 1) {
    const module = modules[index];
    const key = `modules[${index}]`;
    if (!isObject(module)) {
      at(key, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(module.id)) at(`${key}.id`, "必須存在");
    else {
      if (!module.id.startsWith("module:")) at(`${key}.id`, "必須使用 module:<id> 命名");
      if (declaredModuleIds.has(module.id)) at(`${key}.id`, "module id 不得重複");
      declaredModuleIds.add(module.id);
    }
    if (module.name !== module.id) at(`${key}.name`, "必須與 module.id 相同");
    if (!variantById.has(module.variantId)) at(`${key}.variantId`, "必須指向已宣告的 variant");
    if (!Array.isArray(module.layerIds) || module.layerIds.length === 0) {
      at(`${key}.layerIds`, "至少要有一個 layer member");
    } else {
      if (!unique(module.layerIds)) at(`${key}.layerIds`, "member id 不得重複");
      for (const memberId of module.layerIds) {
        const layer = layerById.get(normalizeNodeId(memberId));
        if (!layer) at(`${key}.layerIds`, `找不到 layer ${memberId}`);
        else {
          if (layer.variantId !== module.variantId) at(`${key}.layerIds`, `${memberId} 不得跨 variant`);
          if (layer.moduleId !== module.id) at(`${key}.layerIds`, `${memberId}.moduleId 必須是 ${module.id}`);
        }
      }
    }
  }
  for (const moduleId of moduleIds) {
    if (!declaredModuleIds.has(moduleId)) at("modules", `layer 指向未宣告的 module ${moduleId}`);
  }

  const fonts = Array.isArray(manifest.fonts) ? manifest.fonts : [];
  const fontKeys = new Set();
  for (let index = 0; index < fonts.length; index += 1) {
    const font = fonts[index];
    const key = `fonts[${index}]`;
    if (!isObject(font)) {
      at(key, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(font.family)) at(`${key}.family`, "必須存在");
    if (!isNonEmptyString(font.style)) at(`${key}.style`, "必須存在");
    const fontKey = `${font.family ?? ""}\u0000${font.style ?? ""}`;
    if (fontKeys.has(fontKey)) at(key, "family + style 不得重複");
    fontKeys.add(fontKey);
    if (font.available !== true) at(`${key}.available`, "必須為 true，否則停止並補齊字體");
    if (font.licensed !== true) at(`${key}.licensed`, "必須為 true，否則停止並確認授權");
  }
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index];
    if (layer?.type !== "TEXT" || layer.editable !== true) continue;
    for (let segmentIndex = 0; segmentIndex < (layer.text?.segments ?? []).length; segmentIndex += 1) {
      const segment = layer.text.segments[segmentIndex];
      const fontKey = `${segment?.fontFamily ?? ""}\u0000${segment?.fontStyle ?? ""}`;
      if (!fontKeys.has(fontKey)) at(`layers[${index}].text.segments[${segmentIndex}]`, "使用的 family + style 不在 fonts 清單");
    }
  }

  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  let rawImageCount = 0;
  let svgCount = 0;
  const assetIds = new Set();
  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    const key = `assets[${index}]`;
    if (!isObject(asset)) {
      at(key, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(asset.id)) at(`${key}.id`, "必須存在");
    else if (assetIds.has(asset.id)) at(`${key}.id`, "asset id 不得重複");
    else assetIds.add(asset.id);
    if (!isNonEmptyString(asset.kind)) at(`${key}.kind`, "必須存在");
    if (!isSafeRelativePath(asset.path)) {
      at(`${key}.path`, "必須是 source package 內的相對路徑");
    } else {
      const fileCheck = resolveContainedFile(root, asset.path);
      if (!fileCheck.ok) at(`${key}.path`, `${fileCheck.reason}：${asset.path}`);
    }
    if (!isNonEmptyString(asset.nodeId)) at(`${key}.nodeId`, "必須指向 Figma node");
    if (!isPositiveNumber(asset.width)) at(`${key}.width`, "必須是正數");
    if (!isPositiveNumber(asset.height)) at(`${key}.height`, "必須是正數");
    if (!isNonEmptyString(asset.downloadedAt)) at(`${key}.downloadedAt`, "必須記錄實際下載時間");
    if (asset.kind === "raw-image") rawImageCount += 1;
    if (asset.kind === "svg") svgCount += 1;
  }
  if (rawImageCount > 20) at("assets", `raw-image ${rawImageCount} 超過 download_assets 上限 20，請分割 child node 重新讀取`);
  if (svgCount > 20) at("assets", `svg ${svgCount} 超過 download_assets 上限 20，請分割 child node 重新讀取`);

  const gates = manifest.gates;
  if (!isObject(gates)) {
    at("gates", "必須包含 humanCompleteness 與 humanFidelity");
  } else {
    const gateNames = ["humanCompleteness", "humanFidelity"];
    for (const gateName of gateNames) {
      const gate = gates[gateName];
      if (!isObject(gate)) {
        at(`gates.${gateName}`, "必須存在");
        continue;
      }
      if (!["pending", "passed", "failed", "blocked"].includes(gate.status)) {
        at(`gates.${gateName}.status`, "只能是 pending、passed、failed 或 blocked");
      }
      if (!Array.isArray(gate.evidence)) at(`gates.${gateName}.evidence`, "必須是陣列");
      if (options.requireHumanGates && gate.status !== "passed") {
        at(`gates.${gateName}.status`, "建置前必須是 passed");
      } else if (gate.status === "pending") {
        warnings.push(`gates.${gateName} 尚未 passed`);
      }
    }
  }

  const summary = {
    variants: variants.length,
    layers: layers.length,
    assets: assets.length,
    fonts: fonts.length,
    humanGatesPending: [gates?.humanCompleteness, gates?.humanFidelity].filter((gate) => gate?.status !== "passed").length,
  };
  return { errors, warnings, summary };
}

function validateFigmaUrl(value, fileKey, nodeId, at) {
  if (!isNonEmptyString(value)) {
    at("source.url", "必須是 node-specific Figma Design URL");
    return;
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    at("source.url", "無法解析");
    return;
  }
  if (url.protocol !== "https:" || !isFigmaHost(url.hostname)) at("source.url", "只接受 https://figma.com 的 URL");
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] !== "design" || segments.length < 3) {
    at("source.url", "必須是 /design/<fileKey>/<fileName> 路徑，不能是 file、Slides、Board 或 Make");
  }
  if (["file", "proto", "slides", "board", "make"].includes(segments[0])) {
    at("source.url", "不接受 file、proto、slides、board 或 make URL");
  }
  const pathFileKey = segments[1] ?? "";
  if (!isNonEmptyString(pathFileKey)) at("source.url", "缺少 fileKey");
  if (!isNonEmptyString(fileKey)) at("source.fileKey", "必須存在");
  else if (fileKey !== pathFileKey) at("source.fileKey", "必須與 URL path 的 fileKey 相同");
  const ids = url.searchParams.getAll("node-id");
  if (ids.length !== 1 || !isNodeId(ids[0])) {
    at("source.url", "必須有一個合法且非空的 node-id 查詢參數，不能猜 node ID");
  } else if (!isNodeId(nodeId) || normalizeNodeId(nodeId) !== normalizeNodeId(ids[0])) {
    at("source.nodeId", "必須與 URL 的 node-id 相同");
  }
}

function validateExtraction(extraction, at) {
  if (!isObject(extraction)) {
    at("extraction", "必須記錄 MCP 讀取路徑");
    return;
  }
  const designContext = extraction.designContext;
  if (!isObject(designContext)) at("extraction.designContext", "必須存在");
  else {
    if (designContext.tool !== "get_design_context") at("extraction.designContext.tool", "必須是 get_design_context");
    if (!Array.isArray(designContext.skillNames) || !designContext.skillNames.includes("figma-design-to-code")) {
      at("extraction.designContext.skillNames", "必須包含 figma-design-to-code");
    }
    if (designContext.calledFirst !== true) at("extraction.designContext.calledFirst", "必須是 true，get_design_context 要先於其他 Figma MCP 讀取");
    if (designContext.status !== "passed") at("extraction.designContext.status", "必須是 passed");
  }
  if (!isObject(extraction.metadata)) at("extraction.metadata", "必須存在，即使只用於 orientation／validation");
  else if (extraction.metadata.tool !== "get_metadata") at("extraction.metadata.tool", "必須是 get_metadata");
  const assets = extraction.assets;
  if (!isObject(assets)) at("extraction.assets", "必須存在");
  else {
    if (assets.tool !== "download_assets") at("extraction.assets.tool", "必須是 download_assets");
    if (assets.status !== "passed") at("extraction.assets.status", "必須是 passed");
    if (assets.coverage !== "complete") at("extraction.assets.coverage", "必須是 complete，capped 或 unknown 不得建置");
    if (!Number.isInteger(assets.rawImageCount) || assets.rawImageCount < 0) at("extraction.assets.rawImageCount", "必須是非負整數");
    if (!Number.isInteger(assets.svgCount) || assets.svgCount < 0) at("extraction.assets.svgCount", "必須是非負整數");
    if (assets.rawImageCount > 20) at("extraction.assets.rawImageCount", "不得超過 20");
    if (assets.svgCount > 20) at("extraction.assets.svgCount", "不得超過 20");
  }
  const properties = extraction.properties;
  if (!isObject(properties)) at("extraction.properties", "必須存在；若 design context 不足就用唯讀 use_figma");
  else if (!["passed", "not-needed"].includes(properties.status)) at("extraction.properties.status", "只能是 passed 或 not-needed");
  else if (properties.status === "passed") {
    if (properties.tool !== "use_figma") at("extraction.properties.tool", "必須是 use_figma");
    if (!Array.isArray(properties.skillNames) || !properties.skillNames.includes("figma-use")) at("extraction.properties.skillNames", "必須包含 figma-use");
    if (properties.readOnly !== true) at("extraction.properties.readOnly", "必須是 true，這條路徑不可寫入 Figma");
  }
}

function validateLayerName(layer, key, fieldById, at) {
  if (!isNonEmptyString(layer.name)) return;
  const match = /^(variant|field|image|fixed|module):([a-zA-Z0-9][a-zA-Z0-9-]*)$/.exec(layer.name);
  if (!match) {
    at(`${key}.name`, "必須使用 variant:<id>、field:<id>、image:<id>、fixed:<id> 或 module:<id>");
    return;
  }
  const [kind, id] = [match[1], match[2]];
  if (["field", "image"].includes(kind)) {
    if (!fieldById.has(id)) at(`${key}.name`, `${layer.name} 沒有對應 fields id`);
    if (layer.fieldId !== id) at(`${key}.fieldId`, `必須是 ${id}`);
  }
  if (kind === "field") {
    if (layer.type !== "TEXT" || layer.editable !== true) at(`${key}`, "field:<id> 必須是真正可編輯的 TEXT node");
  }
  if (kind === "image" && layer.type === "TEXT") at(`${key}`, "image:<id> 不得是 TEXT node");
}

function validateLayerGeometry(layer, key, variant, at) {
  const geometry = layer.geometry;
  if (!isObject(geometry)) {
    at(`${key}.geometry`, "必須包含相對與絕對幾何");
    return;
  }
  for (const name of ["x", "y", "width", "height", "absoluteX", "absoluteY"]) {
    if (!isFiniteNumber(geometry[name])) at(`${key}.geometry.${name}`, "必須是有限數字");
  }
  if (isFiniteNumber(geometry.width) && geometry.width <= 0) at(`${key}.geometry.width`, "必須大於 0");
  if (isFiniteNumber(geometry.height) && geometry.height <= 0) at(`${key}.geometry.height`, "必須大於 0");
  if (!variant || layer.overflowAllowed === true) return;
  const tolerance = 0.5;
  if (isFiniteNumber(geometry.x) && geometry.x < -tolerance) at(`${key}.geometry.x`, "不得超出 variant Frame 左側；若是刻意效果請記錄 overflowAllowed 與原因");
  if (isFiniteNumber(geometry.y) && geometry.y < -tolerance) at(`${key}.geometry.y`, "不得超出 variant Frame 上側；若是刻意效果請記錄 overflowAllowed 與原因");
  if (isFiniteNumber(geometry.width) && isFiniteNumber(geometry.x) && geometry.x + geometry.width > variant.width + tolerance) at(`${key}.geometry`, "不得超出 variant Frame 右側");
  if (isFiniteNumber(geometry.height) && isFiniteNumber(geometry.y) && geometry.y + geometry.height > variant.height + tolerance) at(`${key}.geometry`, "不得超出 variant Frame 下側");
}

function validateLayerProperties(layer, key, at) {
  for (const name of ["fills", "strokes", "effects", "masks"]) {
    if (!Array.isArray(layer[name])) at(`${key}.${name}`, "必須是陣列，保留空陣列代表已檢查且沒有此類效果");
  }
}

function validateTextLayer(layer, key, at) {
  if (!isObject(layer.text)) {
    at(`${key}.text`, "可編輯 TEXT 必須有 text segments");
    return;
  }
  if (!isNonEmptyString(layer.text.characters)) at(`${key}.text.characters`, "必須存在");
  if (!Array.isArray(layer.text.segments) || layer.text.segments.length === 0) {
    at(`${key}.text.segments`, "至少要有一個 segment");
    return;
  }
  for (let index = 0; index < layer.text.segments.length; index += 1) {
    const segment = layer.text.segments[index];
    const keyPrefix = `${key}.text.segments[${index}]`;
    if (!isObject(segment)) {
      at(keyPrefix, "必須是 object");
      continue;
    }
    if (!isNonEmptyString(segment.characters)) at(`${keyPrefix}.characters`, "必須存在");
    if (!isNonEmptyString(segment.fontFamily)) at(`${keyPrefix}.fontFamily`, "必須存在");
    if (!isNonEmptyString(segment.fontStyle)) at(`${keyPrefix}.fontStyle`, "必須存在");
    for (const name of ["fontSize", "lineHeight", "letterSpacing"]) {
      if (!isFiniteNumber(segment[name])) at(`${keyPrefix}.${name}`, "必須是有限數字");
    }
    if (!isNonEmptyString(segment.alignment)) at(`${keyPrefix}.alignment`, "必須存在");
    if (!isNonEmptyString(segment.color) && !isObject(segment.color)) at(`${keyPrefix}.color`, "必須是顏色字串或結構");
  }
}

function checkPng(relativePath, root, expectedWidth, expectedHeight, key, at) {
  const fileCheck = resolveContainedFile(root, relativePath);
  if (!fileCheck.ok) {
    at(key, `${fileCheck.reason}：${relativePath}`);
    return;
  }
  const fullPath = fileCheck.path;
  let dimensions;
  try {
    dimensions = readPngDimensions(fullPath);
  } catch (error) {
    at(key, error.message);
    return;
  }
  if (isPositiveNumber(expectedWidth) && dimensions.width !== expectedWidth) at(key, `PNG 寬度 ${dimensions.width} 不等於 ${expectedWidth}`);
  if (isPositiveNumber(expectedHeight) && dimensions.height !== expectedHeight) at(key, `PNG 高度 ${dimensions.height} 不等於 ${expectedHeight}`);
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) throw new Error(`不是有效 PNG：${filePath}`);
  if (buffer.toString("ascii", 12, 16) !== "IHDR") throw new Error(`PNG 缺少 IHDR：${filePath}`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!width || !height) throw new Error(`PNG IHDR 尺寸無效：${filePath}`);
  return { width, height };
}

function isNodeId(value) {
  return isNonEmptyString(value) && /^\d+[:-]\d+$/.test(value.trim());
}

function normalizeNodeId(value) {
  return isNonEmptyString(value) ? value.trim().replace(/-/g, ":") : "";
}

function isFigmaHost(hostname) {
  return hostname === "figma.com" || hostname === "www.figma.com" || hostname.endsWith(".figma.com");
}

function isSafeRelativePath(value) {
  return isNonEmptyString(value) && !path.isAbsolute(value) && !value.split(/[\\/]/).includes("..") && !value.includes("\0");
}

function safeResolve(root, relativePath) {
  return path.resolve(root, relativePath);
}

function isFileInside(root, relativePath) {
  return resolveContainedFile(root, relativePath).ok;
}

function resolveContainedFile(root, relativePath) {
  if (!isSafeRelativePath(relativePath)) return { ok: false, reason: "必須是 source package 內的相對路徑" };

  const realpathSync = fs.realpathSync.native ?? fs.realpathSync;
  let realRoot;
  try {
    realRoot = realpathSync(path.resolve(root));
  } catch {
    return { ok: false, reason: "找不到 source package 根目錄" };
  }

  const candidate = safeResolve(root, relativePath);
  let realCandidate;
  try {
    realCandidate = realpathSync(candidate);
  } catch {
    try {
      if (fs.lstatSync(candidate).isSymbolicLink()) return { ok: false, reason: "broken symlink：目標不存在" };
    } catch {
      // Missing regular files are reported by the same containment result below.
    }
    return { ok: false, reason: "找不到本地檔案" };
  }

  const relativeToRoot = path.relative(realRoot, realCandidate);
  if (relativeToRoot === ".." || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
    return { ok: false, reason: "external symlink：目標在 source package 外部" };
  }

  try {
    if (!fs.statSync(realCandidate).isFile()) return { ok: false, reason: "本地路徑不是檔案" };
  } catch {
    return { ok: false, reason: "無法讀取本地檔案" };
  }
  return { ok: true, path: realCandidate };
}

function emptySummary() {
  return { variants: 0, layers: 0, assets: 0, fonts: 0, humanGatesPending: 0 };
}

export { readPngDimensions, validateManifest };
