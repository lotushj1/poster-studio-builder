---
name: poster-studio-builder
description: "只在提供可存取且指向具體節點的 Figma Design Frame（/design/...?...node-id=...）時，建立或更新固定版型圖片產生器 Site；抽取 Frame、修復命名、產生 source manifest、套用既有 canvas 模板並驗證多變體 PNG。截圖／參考圖不可作 build source；只產一張圖時改用 carousel-cards。"
metadata:
  short-description: 從 Figma Frame 建立固定版型海報產生器
---

# Poster Studio Builder：Figma Design Frame-only 海報工具

這是 Figma Design Frame-only workflow。產出物不是一張圖，而是一個可以反覆使用的小網站：使用者每次只填會變的欄位，固定元素、版面與素材由 Figma Frame 轉成可追溯的設定，再由內附的 React + canvas 編輯器預覽與匯出。沒有 node-specific `/design/` Frame link 時，截圖、參考圖片、檔案 URL 與手寫幾何都不接受為 build source；只需要一張圖片時改用 `carousel-cards`，不在這裡建立工具。

`assets/template/` 是已實測的 `mono-v1` 中性黑白模板，保留四變體下拉選擇、全部預覽格、目前／全部匯出、variant-specific modules 與預設關閉的本機字體目錄。它是執行引擎，不是沒有 Figma 來源時的海報設計 fallback。

## 開工前的硬閘門

生產型工作必須先確認 verifier、退出條件與最多 3 輪修正：

- verifier：讀 [figma-frame-workflow.md](references/figma-frame-workflow.md)、[figma-naming.md](references/figma-naming.md)、[source-package.md](references/source-package.md) 與 [verify.md](references/verify.md)，再跑命名 readback、source-package validator、模板測試、build、瀏覽器實填與 Figma export 對照。
- 退出條件：Figma node-specific URL 與權限通過；`get_design_context` 成功後，manifest-contract nodes 的命名 audit／必要的使用者確認、精確 ID rename 與唯讀 readback 通過；manifest 資產、欄位、幾何、PNG 尺寸與命名通過；使用者需求確認與 human completeness／fidelity gate 通過；所有變體 PNG 可匯出、無初始文字截斷警告、console 無錯誤；最後完成 overlay／difference 與人眼驗收。命名 gate 未驗證前不得進入 source manifest、config 或模板建置。
- 修正上限：最多 3 輪。相同方向連續兩次修不好就停下找根因，不在同一路徑疊 patch。

### 必要輸入 gate

使用者必須提供可存取的 Figma Design Frame URL：

```text
https://www.figma.com/design/<fileKey>/<fileName>?node-id=<int>-<int>
```

只接受 `/design/`、非空且未猜測的 `node-id` 與能實際讀取的 Frame。檔案 URL、`/file/`、Slides、Board、Make、截圖／參考圖片、無權限、節點不存在、節點不是 Frame、ID 不明或 asset coverage 不完整都 fail closed。先讀 [figma-frame-workflow.md](references/figma-frame-workflow.md) 的前置檢查；在 `get_design_context` 成功前，不得安裝模板、建立 `config.ts`、複製素材、建立 Site 或更新既有 Site。

Figma MCP 只在收到 Frame link 後使用。先載入 `figma-design-to-code`，對目標 node 呼叫 `get_design_context` 並傳 `skillNames: "figma-design-to-code"`；成功後才做命名 contract audit。`get_metadata` 只作結構定位／驗證。若命名缺漏、混用、碰撞或語意不合，進入 [figma-naming.md](references/figma-naming.md) 的 naming-repair mode，不要直接結束；必須先取得使用者明確確認，必要時才用 `figma-use` 的 name-only 寫入路徑並以唯讀 metadata readback 驗證。命名通過後才以 `download_assets` 保存完整 Frame export、原始圖片與 SVG，臨時 URL 立刻下載；若精確 properties 或 manifest 欄位仍不足，載入 `figma-use` 與 plugin API index，以唯讀、結構化回傳補抽取。具體順序與資料欄位以 [figma-frame-workflow.md](references/figma-frame-workflow.md) 與 [figma-naming.md](references/figma-naming.md) 為準。

## 操作模式

### A. 建立新 Site

使用者說明需求並提供 Frame link 後：

1. 讀 [interview.md](references/interview.md)，整理用途、尺寸、固定元素、可變欄位、變體、模組、字體與匯出需求，做 requirements readback。
2. 通過 node-specific URL／權限／Frame 身分 gate，依 Figma MCP 讀取順序抽取 hierarchy、geometry、文字 segments、樣式、assets 與 module ancestry。
3. 在 `get_design_context` 成功後、source manifest／config／模板前，依 [figma-naming.md](references/figma-naming.md) 只 audit manifest-contract nodes。命名已合規就直接通過；缺漏或混用就提出 proposal，等使用者確認後才可 name-only rename，再以 metadata/read-only structured readback 驗證。未驗證前 generation gate 保持 blocked。
4. 由 Codex 產生 source package manifest 與本地資產，跑 `scripts/validate-source-package.mjs`。manifest 不能要求使用者手寫，格式見 [source-package.md](references/source-package.md)。
5. 把 naming status/evidence、manifest 與需求確認單回讀給使用者確認。除非使用者已明確指定直接建置且沒有待決策，確認前不安裝模板或寫 config。
6. 依 [config-guide.md](references/config-guide.md) 將 stable `variant:`、`field:`、`image:`、`fixed:`、`module:` 映射成 `app/studio/config.ts`，把已下載資產放入 `public/assets/`，再執行 `scripts/install-template.sh <project>`。模板能力保持：四變體、同步預覽、variant-specific module、目前／全部 PNG／JPG 匯出與 `fonts.localCatalog: false`。
7. 依 [verify.md](references/verify.md) 做測試、build、瀏覽器實填、每個變體匯出與 Figma Frame 對照，最後才交給 [deploy.md](references/deploy.md) 做私人 Sites 部署。

### B. 更新既有 Site

使用者必須同時提供 Figma Frame link，以及精確的本機專案／Site identity，例如絕對路徑、Site 名稱或可驗證的 hosting identity。相似名稱、舊網址、私有複製連結或目前工作目錄都不能用來猜目標。

先完成同一套 MCP 讀取與命名 audit／readback，再產生 source package，依 stable `variant:<id>` 做 diff：

- 新 `variant:<id>`：提出新增變體計畫，確認尺寸、欄位、assets 與匯出名稱後才加入。
- 已存在的 ID：列出 layer／field／module／asset 差異，提出取代方案；不得默默覆蓋。
- 欄位或 schema 變更：`config.version` 加 1；只改視覺且 schema 不變則保留版本並記錄。
- 更新 local source/assets 後，驗證變更與未變更變體，只有在使用者授權時重新部署。

已部署的靜態 Site 不會在 runtime 接受 Figma link，也不保存 Figma credential。Frame link 只由 Codex 在一次建置／更新工作中使用。

## 參考文件路由

- 需求與確認：先讀 [interview.md](references/interview.md)。
- Figma Design Frame、MCP 與 read-only extraction 邊界：讀 [figma-frame-workflow.md](references/figma-frame-workflow.md)。
- manifest-contract 命名 audit、proposal、核准後精確 ID rename 與 readback：讀 [figma-naming.md](references/figma-naming.md)。
- source package、manifest template 與 validator：讀 [source-package.md](references/source-package.md)。
- Figma 結構轉成可驗收規格：讀 [reference-translation.md](references/reference-translation.md)。
- 設計規則與 `mono-v1`：讀 [design-rules.md](references/design-rules.md)。
- `config.ts`、fields、layers、modules、variants：讀 [config-guide.md](references/config-guide.md)。
- 字體授權、fallback 與本機字體目錄：讀 [fonts.md](references/fonts.md)。
- 測試、瀏覽器、PNG 尺寸、overlay／difference 與人眼驗收：讀 [verify.md](references/verify.md)。
- Sites 初始化、私人部署與更新：讀 [deploy.md](references/deploy.md)。

## 模板能力與限制

能：固定版型多變體、四種同步預覽、下拉選目前版型、目前／全部檔案分開下載、文字 auto-fit、圓形／圓角照片拖曳與縮放、來賓模組整組移動／縮放、日期時間格式化、色票、直排、預設組合、固定繁中安全字體堆疊、PNG／JPG 匯出與瀏覽器保存。

不能：自由拖曳排版、多頁編輯、雲端儲存與多人共用、AI 生圖、上傳字體檔、影片／動圖。全部變體是多個明確下載，不承諾 ZIP。Figma MCP 提升抽取精度但不保證 pixel identity；不支援的效果、缺字體、權限或資產問題都要停下回報。未命名或混用的 manifest-contract nodes 先進入 naming-repair mode；命名 proposal 未經明確確認、寫入未完成或 readback 未通過時，generation gate 保持 blocked。

## 溝通與安全邊界

- 使用者可見文字用繁體中文與台灣用語。
- Figma 既有 logo、icon、圖片與向量使用實際下載資產，不用 CSS、手刻 SVG 或 AI 圖片代替。
- TEXT 在 canvas／HTML 保持可編輯；複雜 subgroup 僅在引擎無法重現時 rasterize，且要寫入 manifest 的取捨原因。
- 使用者上傳的照片留在瀏覽器；只有 Figma source package 下載的固定素材可進 `public/assets/`，並須保留來源與授權證據。
- 若無法取得瀏覽器或 Figma Frame 的成品證據，回報「已製作但未驗證」，不能用 config、節點座標、測試數或代表截圖代替整份成品驗收。
