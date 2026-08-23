# 部署與交付

部署前提：Figma node-specific Frame gate、source-package validator、requirements readback、`npm test`、`npm run build`、瀏覽器實填、四變體 PNG 與對應 Figma export 的 overlay／difference、human completeness／fidelity 都已通過。Figma link 只在 Codex 工作期間使用，部署出的靜態 Site 不讀 Figma、不保存 Figma credential。

## 路徑 A：Codex app ＋ Sites 外掛（首選）

1. 新專案：先確認 Figma Frame gate 與 source package 已通過，再照 `sites-building` 的流程跑 init 腳本建 vinext starter（保留 `.openai/hosting.json`、package manager、lockfile）。
2. 執行 `bash scripts/install-template.sh <專案目錄>` 前先備份或確認目標檔案。腳本會覆蓋 `app/page.tsx`、`app/layout.tsx`、`app/globals.css` 與 `app/studio/` 的引擎／編輯器檔案，也會更新測試與 `package.json` 的 test 指令；`app/studio/config.ts` 預設保留，只有 `--force` 才覆蓋匿名範例。`app/_sites-preview` 會保留並印警告，檢查後再由使用者手動移除。
3. `npm run dev` 看預覽，照 `verify.md` 驗證；`npm test`、`npm run build` 都要過。
4. 交給 `sites-hosting`：儲存版本、**私人部署**（新建的 Site 預設只有建立者本人登入 ChatGPT 看得到，正好是「個人使用」）。
5. 拿到網址後用 `open_in_codex` 顯示，並回報。

要給店員或合作夥伴用：請使用者到 chatgpt.com/sites 該站的設定改存取範圍（指定成員／工作區／公開）；公開部署前要得到使用者明確同意。
網址可在 Site 設定改成好記的名字（至少 5 字、小寫開頭、小寫字母與數字、單一連字號）。

改版型：改 `config.ts` → 驗證 → 再部署一個版本即可；欄位結構有變就把 `config.version` +1。

## 路徑 B：Codex CLI／IDE／Claude Code（沒有 Sites 工具）

CLI 與 IDE 可以建置與本機測試，但不能直接發布 Sites。做法：

1. 在有 `.openai/hosting.json` 的專案裡完成路徑 A 的第 2、3 步（沒有 starter 可用時，請使用者先在 Codex app 用 Sites 建一個空站，再開那個資料夾）。Figma Frame 仍由 Codex MCP 讀取，不能改成使用者手寫 source package。
2. 請使用者開 Codex app、打開這個專案資料夾，說「用 Sites 部署這個專案」；或到 ChatGPT 的 Sites 畫面手動發布。
3. 完全沒有 Sites 可用、也接受其他主機時：模板本身不依賴 Next／vinext 的 API，可以搬進 Vite + React 專案（`npm create vite@latest -- --template react-ts`，把 `app/studio/` 放到 `src/studio/`，`main.tsx` 渲染 `<PosterStudio config={templateConfig} />`，樣式用 `@tailwindcss/vite` 載入 `globals.css`）。這條路徑**未在本 skill 驗證過**，交付時要明說。

## 更新既有 Site

1. 收到 Figma Frame link 與精確 local project／Site identity；identity 不清楚就停止，不從相似名稱猜目標。
2. 完成同一套 source package 產生與 validator，依 `variant:<id>`、`field:<id>`、`image:<id>`、`fixed:<id>`、`module:<id>` 做 diff。
3. 新 variant 先提出新增；既有 variant 先列出 replace diff，不得靜默覆蓋。欄位／schema 改變時 `config.version` +1。
4. 驗證 changed 與 unchanged variants，只有明確授權才重新部署。

## 交付訊息範本

- 網址（私人，登入同一個 ChatGPT 帳號就能用）
- 怎麼用：左邊填資料、用「目前版型」下拉選取；右側預覽格會同步顯示所有變體；按「下載目前版型」或「下載全部 N 張」；照片可以在圖上拖曳調構圖；常用內容可以存成「預設組合」
- 設計標準：回報目前採用的 id，例如 `mono-v1`，若換品牌標準要在 config 與驗收紀錄同步更新
- 字體：預設使用固定繁中安全字體，不讀取本機清單；只有明確開啟 `fonts.localCatalog` 後，桌面版 Chrome／Edge 才能直接列出電腦字體；其他瀏覽器請輸入字體名稱
- 內容只存在這台電腦的瀏覽器裡，換電腦或清除瀏覽資料就要重填
- 想改版型：直接說「把標題往下移」「多一個價格欄位」，改完重新部署
