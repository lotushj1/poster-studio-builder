# Figma Design Frame 工作流

這份文件是 Poster Studio Builder 的 Figma Design Frame-only 讀取正本。海報工具不是從一張截圖猜版面，而是從一個可讀取的 Figma Design Frame 產生規格、素材包與 `config.ts`。沒有通過本文件的前置檢查，不得安裝模板、寫入 `config.ts` 或建立／更新 Site。沒有 node-specific `/design/` Frame link 時，截圖、參考圖片與手寫幾何都不是 build source。

## 1. 唯一可接受的輸入

使用者必須提供一個可存取、指向具體節點的 Figma Design URL，形式為：

```text
https://www.figma.com/design/<fileKey>/<fileName>?node-id=<int>-<int>
```

`node-id` 可以是 `<int>-<int>` 或 `<int>:<int>`，交給 MCP 時統一正規化成 `<int>:<int>`。URL 的 `/design/`、`fileKey`、`node-id` 都必須存在，且只能有一個非空的 `node-id` 參數。

以下一律 fail closed：

- 只有檔案的 URL，沒有 `node-id`，或節點 ID 是猜的。
- `/file/`、`/proto/`、`/slides/`、`/board/`、`/make/` URL。Slides、FigJam、Make 不是這個工具的 Design Frame 輸入。
- 截圖、參考圖片、Frame export 或手寫幾何但沒有 node-specific `/design/` Frame link；它們只能作補充視覺證據，不能取代 build source。
- 不是 `figma.com` 網域、網址格式無法解析、`fileKey` 或節點 ID 不合法。
- `get_design_context` 回報沒有權限、檔案／節點不存在、節點不是 Frame，或回傳內容不完整。

網址格式通過不代表有權限。前置檢查必須真的以該 `fileKey` 與 `nodeId` 呼叫 Figma MCP；只有讀到目標節點、Frame 身分與尺寸後，才算通過。檢查失敗時保留錯誤原因，不能改用截圖、`get_metadata` 或手寫來源包繞過。

## 2. Frame 與命名合約

### Frame 結構與 manifest-contract 節點

- 每個輸出變體一個精確尺寸的 Frame。Frame 尺寸就是 PNG 匯出尺寸，不在程式中偷偷換比例。
- 變體 Frame 可以放在一個 Section 裡，但 Section 不取代 Frame，也不當作輸出變體。
- 每個變體 Frame 名稱為 `variant:<id>`，`<id>` 只用語意明確的小寫英數與連字號，例如 `variant:ig-feed-one-guest`。
- `field:<id>` 只給真正的 editable `TEXT`；`image:<id>` 只給 replaceable image；不接受輸入的固定圖層或固定資產的 export-boundary ancestor 使用 `fixed:<id>`；需要一起移動／縮放的 related group 使用 `module:<id>`。完整的 audit／proposal／核准後 rename／readback 見 [figma-naming.md](figma-naming.md)。
- 同一個 Frame 內的 contract name 與顯式 ID 不得碰撞；跨 Frame 的共同欄位 ID 只有在語意相同時才可相同，每個 Figma node ID 必須全域唯一。
- 隱藏、備份、未使用的圖層不要納入 manifest。要保留的圖層必須可見；故意溢出、遮罩或效果要在 properties 中明確記錄。

只 audit manifest-contract nodes，不要求每個內部 vector descendant 都有名稱。若一組內部向量會以一個固定資產輸出，命名並回讀該 export-boundary ancestor 即可；不能因內部 descendants 未命名就繞過 boundary 的 `fixed:` 命名。

### 可編輯、固定、素材與模組

| Figma 名稱 | 用途 | 必要條件 |
| --- | --- | --- |
| `field:<id>` | 可編輯文字欄位 | 真正的 `TEXT` node，保留完整文字 segments；`id` 對應 config 欄位 |
| `image:<id>` | 可替換圖片 | 真正的圖片填色或圖片／向量 node；保存填色來源、裁切與焦點 |
| `fixed:<id>` | 固定圖層 | 不接受表單輸入；圖形、向量、固定文字可保留原生 node |
| `module:<id>` | 照片／名字／頭銜等一起調整的群組 | 有明確成員 node IDs、祖先關係與變換基準；只在自己的 variant 內使用 |

`field:<id>`、`image:<id>`、`fixed:<id>` 與 `module:<id>` 的 `<id>` 必須是明確、穩定且不重複的英文 kebab ID，不使用圖層順序、任意數字或 `text-2` 這類無意義 ID。跨 variant 只有在語意一致時沿用同一 field ID；`module:<id>` 的成員可含 `field:`、`image:` 與 `fixed:` 圖層，但每個成員只能屬於一個模組。

真實 TEXT node 才能成為可編輯文字。不要把文字轉成圖片，也不要只從 screenshot OCR 推回文字。圖片、SVG、向量、遮罩與效果先保留原生 node；只有 canvas／HTML 引擎無法重現的複雜 subgroup 才能整組 rasterize，並在 manifest 的 `rasterizationReason` 寫明原因與範圍。

### 設計檔交付前的 Figma 檢查

- 真正的 TEXT node 仍是 TEXT，文字分段的字元、家族、樣式、字級、行高、字距、對齊與顏色可讀取。
- 圖片／向量仍是圖片填色或原生向量；不得以 CSS、手刻 SVG、通用 icon 或 AI 圖片代替。
- 隱藏／未使用圖層排除；mask、blend、opacity、stroke、effect 有意義且有記錄。
- Frame 尺寸就是輸出尺寸；四邊與模組邊界沒有因匯出設定被裁掉。
- 使用到的字體家族與樣式在 Figma 與本機輸出環境可用，且授權狀態明確。無法證明可用或授權時停止，不用相似字體假裝通過。
- 命名 contract audit 只在 `get_design_context` 成功後進行。命名合規就直接通過；缺名、混用、碰撞或 ambiguity 進入 naming-repair mode，必須經 proposal、明確確認（若要寫入）與 metadata／structured readback 後才可放行。

## 3. Figma MCP 讀取順序

### 第一步，讀 Design Context

先載入並遵守 `figma-design-to-code` Skill，然後對目標 Frame 呼叫 `get_design_context`。這是第一個 Figma MCP 讀取呼叫，不可先呼叫 `get_metadata`、`get_screenshot` 或直接寫程式。呼叫需明確傳入：

```text
get_design_context(
  fileKey: <fileKey>,
  nodeId: <normalized nodeId>,
  skillNames: "figma-design-to-code",
  clientLanguages: "typescript",
  clientFrameworks: "react"
)
```

取得的 code、screenshot 與上下文是參考資料，不是可直接貼上的成品。檢查回傳的目標 node 是否是精確尺寸 Frame，並保存 screenshot 作為每個變體的視覺正本；screenshot 不能證明 layer names。

### 第二步，命名 audit／repair gate

`get_design_context` 成功後，才視需要使用 `get_metadata` 或唯讀 structured readback 做 manifest-contract audit。若命名已合規，記錄 `compliant` 並直接繼續；若缺名、混用、無意義數字 ID、碰撞或語意不明，依 [figma-naming.md](figma-naming.md) 建立 proposal，等使用者明確確認後才可執行精確 ID 的 name-only rename。沒有寫入能力／權限時，提供可複製的手動計畫並等待使用者處理；generation gate 保持 `blocked`。命名寫入每批最多 10 個 node，檢查 audited current name，回傳 old/new name 與 rollback map；任何 stale／partial multi-batch failure 都要停下報告 applied／unapplied，不得默默繼續或自動覆寫。

只有所有 required names 以 metadata／read-only structured readback 驗證為 `verified`，才可進入 source manifest、config 或模板；命名 readback 必須寫入 requirements readback 的 naming status/evidence。

### 第三步，結構定位與素材下載

命名 gate 通過後，才視需要使用 `get_metadata` 做結構方向或驗證。`get_metadata` 只有 node ID、類型、名稱、位置與尺寸，不能代替 design context，也不能代替完整屬性抽取。

接著立即對同一個 Frame 呼叫 `download_assets`，保存三類輸出：

1. 整個 Frame 的 export，作為 `reference.framePng`。
2. 子樹中原始上傳的圖片，依回傳的實際 `format` 存檔，不猜副檔名。
3. 適合保留為 SVG 的向量資產，例如 logo、icon、簡單插畫。

下載回傳 URL 是臨時 URL，拿到後立刻下載到專案 source package，再用本地路徑放入 manifest。raw images 上限 20 張，SVG assets 上限 20 張。若超過上限，不能宣稱完整涵蓋；改對較小的 child node／subframe 分批讀取並記錄 coverage，仍無法涵蓋就停止。

`download_assets` 的完整 Frame export、原始圖片與 SVG 都要保存。只保存 design context 內出現的單一 URL，或只保存 screenshot，都不算素材包完成。

### 第四步，必要時用唯讀 `use_figma` 抽取屬性

若 design context 與 metadata 尚不足以建立精確 manifest，先載入 `figma-use` 與它的 `references/plugin-api-standalone.index.md`，再用 `use_figma` 執行唯讀 properties-extraction script，並傳入 `skillNames: "figma-use"`。這個 properties-extraction 路徑不得寫入、改名、刪除、移動或建立 Figma node；核准後的命名寫入是獨立流程，規則見 [figma-naming.md](figma-naming.md)。

唯讀 script 必須用 `return` 回傳結構化 JSON，不能用 `console.log()` 當輸出。至少抽取：

- hierarchy、parent／祖先、variant／module ancestry。
- absolute 與 relative `x/y/w/h`、z-order、visibility、rotation、opacity。
- fills、strokes、effects、masks，以及需要保留的 blend／裁切資訊。
- TEXT segments：`characters`、font family、style、size、line-height、letter-spacing、alignment、color。
- image fills、圖片來源、裁切焦點與向量 node 身分。

任何 properties-extraction `use_figma` script 都必須是讀取用途，回傳 node IDs 與欄位資料，不能呼叫會改變畫布的 API。遇到 error 先停止讀錯誤，不要重試或假設讀取成功。

## 4. 產生 source package 與 config

Codex 依 MCP 回傳資料產生 manifest 與本地素材，不讓使用者手動編輯 manifest 來宣稱完成。schema、範本與 Node 內建 validator 見：

- [source-package.md](source-package.md)
- `assets/source-package/manifest.template.json`
- `scripts/validate-source-package.mjs`

產生順序是：成功的 `get_design_context` → manifest-contract 命名 audit／必要的 proposal、核准後 rename 與 readback → Frame export 與資產下載 → 結構化 manifest → validator → naming status/evidence 與 requirements readback → 使用者確認 → 安裝模板與寫入 `config.ts`。`config.ts` 由 manifest 的穩定命名與 geometry 產生，所有 TEXT 映射成 editable text，圖片／向量映射成本地 assets；不能手寫另一套與 Figma 無關的版型當 fallback。既有 source manifest schema 維持向後相容，不為 naming proposal 增加非必要欄位。

## 5. 視覺正本與誠實邊界

Figma screenshot／full-frame export 是視覺正本，MCP 精準讀取會提升 geometry、text 與 asset fidelity，但不等於 pixel identity。以下任一項都要 fail closed：不支援的 blend／effect、缺少權限、無法下載的資產、資產數量超過上限、缺字體或授權不明、Frame 尺寸不一致。未命名、混用、碰撞或語意不明的 manifest-contract nodes 先進入 naming-repair mode；proposal 未確認、寫入未完成或 naming readback 未 verified 時，generation 保持 blocked，不把截圖當作 layer-name 證據。

交付前逐個變體輸出 PNG，與對應 Figma Frame export 做 50% overlay 與 difference，比對：

- exact width／height；
- 文字是否仍可編輯、字體與 text-fit 是否可接受；
- 圖片裁切、向量、mask、opacity、effects 與模組相對位置；
- 未改動變體是否仍和原本一致。

overlay／difference 是輔助證據，不取代人眼驗收。人要確認每個變體；未完成 `humanCompleteness` 或 `humanFidelity` gate 時，不得宣稱完成或部署。
