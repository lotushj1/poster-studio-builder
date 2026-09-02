# 驗證清單與迴圈（Figma Frame 是視覺正本）

上限 3 輪。每輪：跑清單 → 列出不過的項目 → 修 → 重跑。第 3 輪還有不過的就停下來報告，附截圖與未過項目。Figma screenshot／full-frame export 用於視覺比對，但不等於 pixel identity 證明。

## 0. 來源包與建置前 gate

- 確認 URL 是可存取的 `/design/<fileKey>/...?node-id=...`，`get_design_context` 是第一個 Figma MCP 讀取，並傳 `skillNames: "figma-design-to-code"`。
- `get_design_context` 成功後先依 [figma-naming.md](figma-naming.md) audit manifest-contract nodes；合規直接通過，缺名／混用／碰撞先完成 approval-gated proposal、必要的 exact-ID name-only rename 與 metadata／read-only structured readback。命名 status 未 `verified` 前，generation gate 保持 blocked。
- 確認 `download_assets` 的完整 Frame export、raw images、SVG 都已立刻下載；raw image 與 SVG 各不超過 20，coverage 不能是 capped／unknown。
- 若 properties 或 manifest 欄位不足，確認已載入 `figma-use` 與 plugin API index，properties-extraction 的唯讀 `use_figma` 傳 `skillNames: "figma-use"`，且 script 只回傳結構化 JSON；核准後命名寫入遵循 [figma-naming.md](figma-naming.md) 的獨立 name-only 路徑。
- 跑 `node scripts/validate-source-package.mjs <manifest>`；安裝模板／寫 config 前再跑 `--require-human-gates`。validator 只能檢查欄位、檔案、PNG IHDR、命名與 geometry，不能證明視覺完整。

## 1. 自動檢查

- `npm test`（含 `tests/studio.test.mjs`：斷行、截斷、自動縮字、直排、日期格式、樣板代入、模組中心縮放、四變體與批次匯出 helper）全綠
- `npm run build` 成功（vinext 會一起編譯 TypeScript）
- 改了引擎或 `text.ts`：補測試再跑

## 2. 瀏覽器實測（`npm run dev`，桌面寬度）

1. 首頁打開 3 秒內看到表單與預覽，console 無錯誤
2. 初次載入預設資料時，四個 variant 的 warning 區都必須是零；不能關閉或放寬 warning detection 來達成。每個文字欄位再填「最長的合理內容」（貼到 maxLength）：合理內容沒有截斷警告、沒有貼邊
3. 每個圖片欄位各上傳一張直式、一張橫式照片：裁切正確、在預覽圖上拖曳可調構圖、縮放滑桿有效、「置中」「移除」正常
4. 變體：下拉選取目前版型；四個變體同時出現在預覽格；逐一確認欄位、尺寸與版面
5. 字體：預設只看到固定繁中安全堆疊，沒有本機清單權限請求；只有設定 `fonts.localCatalog: true` 後，才在 Chrome 測清單／權限，其他瀏覽器測直接輸入名稱
6. 模組：調整一個來賓模組的 x、y、scale，確認照片、名字、頭銜相對位置同步；再用照片拖曳／縮放，確認個別構圖仍有效
7. 微調：每個 adjustable 動一下、重設一下
8. 預設組合：存一組、重新整理、套用，確認模組調整也被保存
9. 匯出：下載目前 PNG 打開看，再按「下載全部 N 張」確認每個變體各有實際檔案；尺寸 = 該變體的 size，內容與預覽一致；JPG 也試一次
10. 重新整理：內容、照片與模組調整都還在
11. 手機寬度（390px）：四格預覽改單欄、表單在下、沒有水平捲動
12. chrome 質感：編輯器看起來是精緻工具（清楚層次、足夠的控制尺寸、黑白中性色），不是後台表單。海報畫面另以第 3 節對 Figma 驗收。Skill 不得交付比展示站明顯陽春的介面。

## 3. Figma Frame／設計規格對照

- 逐個 variant 以 [reference-translation.md](reference-translation.md) 對照 Frame 的網格、層級、字體、色彩、人物處理、間距、z-order、mask、effects 與 module。
- 以 Figma full-frame export／screenshot 作視覺正本，對每張實際輸出 PNG 做 50% overlay 與 difference。確認 exact width／height、文字可編輯、字體／換行／text-fit、圖片裁切、向量、opacity 與模組相對位置。
- overlay／difference 只是一層證據；Figma screenshot 與 MCP 讀取都不能單獨保證 pixel identity。由人逐個變體確認 `humanCompleteness` 與 `humanFidelity`，未通過時只能回報未驗證。

## 4. 對照需求確認單

逐條列「項目｜通過｜備註」：固定元素一條、每個欄位一條、每個變體一條。有一條不通過就不算完成。

## 5. 設計檢查

對著匯出的 PNG 跑 `design-rules.md` 最後的六步；任何一步不過就回 config 調。

## 給自動化用的掛鉤

頁面掛載後有 `window.__posterStudio`：

- `getState()`：目前的 variant、values、adjustments、fontOverrides
- `setValue(id, value)`、`setVariant(id)`：直接改狀態（圖片欄位可給 `{ src, focalX, focalY, zoom }`）
- `exportBlob("png" | "jpeg")`／`exportActiveBlob(...)`：拿到目前選取版型匯出結果
- `exportAllBlobs("png" | "jpeg")`：拿到 `{ variantId, blob }[]`，確認每個 variant 都有匯出結果
- `getState()` 也會回傳 `moduleAdjustments`，可驗證模組變換已保存

```js
const blob = await window.__posterStudio.exportBlob("png");
const bmp = await createImageBitmap(blob); // bmp.width / bmp.height 應等於該變體的尺寸
const files = await window.__posterStudio.exportAllBlobs("png");
// files.map(({ variantId, blob }) => [variantId, blob.size]) 應涵蓋所有 config.variants
```

用 DOM 觸發上傳：建立 `File` → 放進 `new DataTransfer()` → 指定給 `input[type=file].files` → dispatch `change` 事件。

## 回報格式

- 已驗證：列做過的項目（含瀏覽器與裝置）
- 未驗證：沒做到的明講（例如沒有 Chrome 可測字體清單）
- 已知限制：字體跟電腦走、內容只存瀏覽器
