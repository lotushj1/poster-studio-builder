# Figma source package 與 manifest

source package 是由執行此 Skill 的 agent 依 Figma MCP 讀取結果產生的中間交付物，不是使用者手寫的設定檔。它把 Figma 來源、Frame screenshot、變體、圖層、字體與已下載資產綁在一起，讓 `config.ts` 有可追溯的正本。manifest-contract 命名必須先在 live Figma 以 [figma-naming.md](figma-naming.md) audit／readback verified；命名 proposal 不需要寫進 schema。

## 目錄建議

```text
source-package/
├── manifest.json
├── reference/
│   ├── frame.png
│   └── variants/<variant-id>.png
└── assets/
    ├── <asset-id>.<format>
    └── ...
```

`manifest.json` 的路徑以 manifest 所在資料夾為根。資產與 PNG 必須在本地存在，不能只留 Figma 回傳的臨時 URL。

## 必要欄位

範本見 `assets/source-package/manifest.template.json`。主要結構如下：

```json
{
  "schemaVersion": 1,
  "generation": {
    "actor": "codex",
    "method": "figma-mcp",
    "capturedAt": "2026-08-21T00:00:00Z"
  },
  "source": {
    "type": "figma",
    "url": "https://www.figma.com/design/fileKey/name?node-id=<int>-<int>",
    "fileKey": "fileKey",
    "nodeId": "<figma-node-id>",
    "frame": { "id": "<figma-node-id>", "name": "Frame", "type": "FRAME", "width": 1080, "height": 1350 }
  },
  "extraction": {
    "designContext": { "tool": "get_design_context", "skillNames": ["figma-design-to-code"], "calledFirst": true, "status": "passed" },
    "metadata": { "tool": "get_metadata", "status": "passed" },
    "assets": { "tool": "download_assets", "status": "passed", "coverage": "complete", "rawImageCount": 0, "svgCount": 0 },
    "properties": { "tool": "use_figma", "skillNames": ["figma-use"], "readOnly": true, "status": "passed" }
  },
  "reference": { "framePng": "reference/frame.png", "width": 1080, "height": 1350 },
  "variants": [
    { "id": "ig-feed", "name": "variant:ig-feed", "frameNodeId": "<figma-node-id>", "width": 1080, "height": 1350, "referencePng": "reference/variants/ig-feed.png" }
  ],
  "fields": [
    { "id": "title", "name": "field:title", "type": "text", "required": true }
  ],
  "layers": [
    {
      "id": "<figma-node-id>",
      "variantId": "ig-feed",
      "name": "field:title",
      "type": "TEXT",
      "editable": true,
      "fieldId": "title",
      "geometry": { "x": 72, "y": 120, "width": 936, "height": 180, "absoluteX": 72, "absoluteY": 120 },
      "zIndex": 3,
      "visible": true,
      "rotation": 0,
      "opacity": 1,
      "fills": [],
      "strokes": [],
      "effects": [],
      "masks": [],
      "parentId": "<figma-node-id>",
      "ancestorIds": ["<figma-node-id>"],
      "text": {
        "characters": "可替換標題",
        "segments": [{ "characters": "可替換標題", "fontFamily": "Noto Sans TC", "fontStyle": "Bold", "fontSize": 88, "lineHeight": 1.2, "letterSpacing": 0, "alignment": "LEFT", "color": "#171717" }]
      }
    }
  ],
  "fonts": [
    { "family": "Noto Sans TC", "style": "Bold", "available": true, "licensed": true }
  ],
  "assets": [],
  "gates": {
    "humanCompleteness": { "status": "pending", "reviewer": null, "evidence": [] },
    "humanFidelity": { "status": "pending", "reviewer": null, "evidence": [] }
  }
}
```

### `source`

`type` 必須為 `figma`。`url` 必須是可存取的 `/design/<fileKey>/...?node-id=...` URL，`fileKey` 與 `nodeId` 必須和 URL 相符。`nodeId` 使用 `:` 正規化。`frame` 要記錄目標 Frame 的 node ID、名稱、類型與精確輸出尺寸。

### `extraction`

`designContext.calledFirst` 必須為 `true`，且 `skillNames` 包含 `figma-design-to-code`。`metadata` 只能作方向或驗證證據。`assets.coverage` 若不是 `complete` 就不能進入建置；超過 20 張 raw images 或 20 個 SVG 時，改讀較小子節點，不能把 capped 當成完整。

如果 design context 已經提供所有可用屬性，`properties.status` 可以是 `not-needed`；只要有任何精確屬性或自動 manifest 欄位不足，就必須有 properties-extraction `use_figma`、`skillNames: ["figma-use"]`、`readOnly: true` 的回傳紀錄。properties-extraction script 要回傳結構化 JSON，不得寫入 Figma；命名 gate 的核准後 name-only `use_figma` 是獨立流程，不改變這筆 read-only extraction 證據。

### `reference`、`variants`、`layers`

`reference.framePng` 是完整 Frame export；每個 variant 都有對應的 reference PNG，且尺寸必須和其 Frame 相等。layers 只放可見、實際使用的節點，不能把隱藏備份層當作固定層。

每個 manifest layer 必須有穩定的 Figma node `id`、variant、符合 contract 的命名、幾何與階層資訊。幾何包含相對與絕對 `x/y/width/height`，並記錄 `zIndex`、`visible`、`rotation`、`opacity`、`fills`、`strokes`、`effects`、`masks`。預設要求邊界落在 variant Frame 內；故意溢出時要寫 `overflowAllowed: true` 與原因。只作為一個 fixed asset 匯出的內部 vector descendants 不必逐一出現在 manifest；其 export-boundary ancestor 必須是 `fixed:<kebab-id>`。

- `field:<id>` 只能對應真正的 `TEXT` node，且 `editable: true`，有完整 text segments。
- `image:<id>` 必須是實際圖片填色或圖片／向量 node，有本地下載資產或明確的可替換欄位。
- `fixed:<id>` 不接受使用者輸入。
- `module:<id>` 透過 `modules` 的 layer IDs 綁定成組，不能跨 variant 共用 module。

同一 variant 內的 layer name、field ID、module ID 不得重複；所有 Figma node ID 與所有 variant ID 必須全域唯一。模組成員必須存在於同一 variant，且 `moduleId` 與 module 清單一致。

### `fonts`、`assets`、`gates`

每一個 text segment 使用的 `family + style` 都要在 `fonts` 找到，並標明 `available: true` 與 `licensed: true`。缺字體、字重或授權狀態不明時停止，不自動換成相似字體。

`assets` 的 `path` 是已下載到 source package 的相對路徑；`kind` 要區分 `raw-image`、`svg`、`raster`、`vector`，保留來源 node ID、格式、尺寸與下載時間。Figma 臨時 URL 可作追溯欄位，但不能取代本地檔案。

`gates.humanCompleteness` 與 `gates.humanFidelity` 必須存在，狀態只能是 `pending`、`passed`、`failed` 或 `blocked`。結構驗證可以接受 `pending`，但建置／部署前必須用 `--require-human-gates` 驗證兩者都是 `passed`，並保存使用者確認或人眼驗收證據。validator 只能證明結構、檔案與幾何，不可能單靠 JSON 證明視覺完整或 pixel identity。

## 驗證命令

在 source package 根目錄執行：

```bash
node /path/to/poster-studio-builder/scripts/validate-source-package.mjs manifest.json
node /path/to/poster-studio-builder/scripts/validate-source-package.mjs manifest.json --require-human-gates
```

第一個命令檢查 schema、URL、資產、PNG IHDR 尺寸、命名與幾何；第二個命令再要求兩個人類 gate 都已通過。失敗時不可安裝模板或部署。此驗證器不會連線 Figma，也不會檢查 screenshot 的像素差異，仍需依 [verify.md](verify.md) 做 overlay／difference 與人工驗收。
