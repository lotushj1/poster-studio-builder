# 需求訪談：Frame 與命名 gate 通過後再簽收需求

目標：把每次要做的圖片拆成固定元素與變動欄位，精確到可以由 Figma source manifest 產生 `config.ts`。問句要白話、一次只問一組；訪談不能取代 Figma 讀取，也不能讓使用者手寫 manifest。

## 第 0 步：收 node-specific Figma Design Frame

- 請使用者提供可存取的 Figma Design Frame URL：`https://www.figma.com/design/<fileKey>/<fileName>?node-id=<int>-<int>`。
- 檔案 URL、`/file/`、Slides、Board、Make、缺 `node-id`、node ID 不明或無權限都停止，不能以參考圖片、截圖或手寫幾何替代。沒有 node-specific `/design/` Frame link 時，參考圖片與截圖不接受為 build source。
- 執行此 Skill 的 agent 先依 [figma-frame-workflow.md](figma-frame-workflow.md) 載入 `figma-design-to-code`，呼叫 `get_design_context`，確認目標確實是 Frame 並讀到尺寸。未通過前不安裝模板、不寫 `config.ts`。
- Frame 是視覺正本。另外確認目標是「結構一致」還是「盡量貼近 Figma export」。後者仍需原始素材、字體、overlay／difference 與人工驗收，不能承諾 pixel identity。

## 第 0.5 步：`get_design_context` 成功後先完成命名 gate

- 只 audit [figma-naming.md](figma-naming.md) 定義的 manifest-contract nodes：輸出 Frame、editable TEXT、replaceable image、fixed／export-boundary ancestor 與 related module group。內部 vector descendants 若會作一個固定資產匯出，不必全部命名。
- 命名已是 `variant:<kebab-id>`、`field:<kebab-id>`、`image:<kebab-id>`、`fixed:<kebab-id>`、`module:<kebab-id>` 且語意穩定、無碰撞時直接通過；缺名、混用、無意義數字 ID 或 ambiguity 進入 naming-repair mode，不要直接結束。
- 先把 node ID、type、current name、proposed name、role、confidence／ambiguity、action 的 proposal 回讀給使用者。未獲得明確確認前不得改 Figma 名稱；沒有寫入權限時提供可複製的手動計畫並維持 generation blocked。
- 命名寫入若獲確認，依 [figma-naming.md](figma-naming.md) 使用 exact node IDs 的 `use_figma` name-only batches，再用 metadata／structured readback 驗證。截圖不能證明命名通過；readback 未完整通過前不產生 source manifest、`config.ts` 或模板。

## 第 1 步：類型與尺寸比例

1. 這張圖是做什麼用的？影片封面、直播課海報、來賓宣傳、店家公告、活動資訊或其他？
2. 發在哪裡？IG 貼文、IG 限動、YouTube、FB、LINE、Threads 或列印？對照 [design-rules.md](design-rules.md) 與 Figma Frame 尺寸確認主要輸出。
3. 需不需要第二種尺寸？同一活動不同輸出必須是各自精確尺寸的 Frame 與 variant，不能在程式中硬裁比例。

記錄：用途、平台、主要尺寸、其他尺寸、每個 variant 的 Frame identity 與 reference PNG。

## 第 2 步：固定不變的元素

1. 哪些東西每張都一樣？背景、品牌名／logo、標題樣式、顏色、固定句子、版權列、QR？
2. Figma 裡哪些 layer 是 `fixed:<id>`？若一組內部向量會作一個固定資產匯出，哪個 ancestor 是 export boundary？素材是否已由 `download_assets` 下載並保存到 source package？
3. 有固定人物嗎？固定人像在 source package 與 `public/assets/` 內使用實際資產，不用 AI 重畫。
4. Figma 的 mask、blend、opacity、stroke、effect、向量與固定文字是否要保留？引擎不支援的 subgroup 需記錄 rasterization trade-off。

記錄：固定 layer 名稱與 node ID、素材來源、尺寸、品牌色、字體 family/style、授權與可用性。

## 第 3 步：版面資訊結構與模組

1. 每次會換哪些資訊？活動名、副標、日期、時間、地點、來賓姓名／頭銜／照片、價格、報名方式、公告內容。
2. 真正可編輯文字是否都是 `field:<id>` TEXT node？可替換圖片是否都是 `image:<id>`，固定內容是否是 `fixed:<id>`，需一起調整的群組是否是 `module:<id>`？ID 不可用順序、任意數字或顯示文字整句猜。
3. 人數結構固定嗎？數量會變就做不同 variant，不要用隱藏第三位硬塞。
4. 每個文字欄位大概多長？決定 `maxLength`、`maxLines`、`autoFit` 與安全邊界。
5. 哪些東西偶爾才有？選填欄位加 `visibleIf`，但 Figma 來源仍須有可驗證的對應 layer 或明確的 optional mapping。
6. 想自己調哪些？字級、顏色、照片縮放與位置才開 `adjustable`，沒有需求不要開放自由改版。
7. 日期時間怎麼顯示？統一成固定格式，例如 `2026.08.21　20:00`，不要要求使用者手打格式。
8. 照片、名字、頭銜要不要一起移動／縮放？要就用 variant-specific `module:<id>`，保留照片個別拖曳與縮放。

記錄：欄位表、型別、必填／選填、長度、預設值、variant 清單、模組成員與可調項目。這份記錄要能和 manifest 逐項對照。

## 第 4 步：遺漏確認與建置授權

把整理好的清單與命名 proposal 貼出來，問：「以上是我整理的固定元素、可填欄位、變體、模組與命名。有沒有漏掉圖上一定要有的東西？命名 proposal 是否確認？」

命名 readback verified 且使用者確認需求後，執行此 Skill 的 agent 產生 requirements readback 與 Figma manifest，先跑：

```bash
node scripts/validate-source-package.mjs <source-package>/manifest.json
```

只有 URL、權限、命名 readback、assets、manifest 與需求都通過，才可以安裝模板。建置前再以 `--require-human-gates` 確認 completeness／fidelity 狀態為 `passed`；不能以訪談回覆或 screenshot 代替 Figma Frame 與成品驗收。

## 需求確認單格式

```text
工具名稱：
來源：Figma Design Frame URL、fileKey、nodeId、Frame name
目標：結構一致／盡量貼近 Figma export（不承諾 pixel identity）
用途／平台：
變體：每個 variant:<id>、Frame 尺寸、reference PNG
固定元素：fixed:<id>、素材與授權
可填欄位：field:<id>／image:<id>、型別、必填、長度、預設
模組：module:<id>、成員 node／layer IDs、可整組調整項
字體：family／style、可用性、授權狀態、fallback
匯出：PNG／JPG、檔名規則
命名狀態／證據：`compliant`／`verified`／`blocked`、audit／proposal confirmation、exact-ID readback（截圖不算命名證據）
驗收：source validator、npm test、npm run build、瀏覽器四變體、每張 PNG 與 Figma export 對照、人工確認
```
