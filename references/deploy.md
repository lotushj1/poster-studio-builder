# 部署與交付

新站一律用這個 Skill 從頭建，發佈走 **Cloudflare Workers**。不要複製現成專案當起點。

部署前提：Figma node-specific Frame gate、source-package validator、requirements readback、`npm test`、`npm run build`、瀏覽器實填、輸出 PNG 與 Figma export 對照、human completeness／fidelity 都已通過。Runtime 不讀 Figma、不保存 Figma credential。

## 新站（給任何人）

Cursor、Claude Code、Codex CLI 用同一套。不要建 ChatGPT Site。

1. 使用者提供可開啟的 Figma Design Frame URL（含 `node-id`）。
2. 若還沒有專案目錄：
   ```bash
   bash scripts/init-cloudflare-project.sh <新專案目錄> <worker-name>
   bash scripts/install-template.sh <新專案目錄>
   ```
   `worker-name` 用小寫連字號，會變成 `https://<name>.<帳號>.workers.dev`。
3. 通過命名／source package 後，才寫 `app/studio/config.ts` 與 `public/assets/`。
4. `npm run dev`、依 [verify.md](verify.md) 驗證；`npm run lint`、`npm test` 都要過。
5. 使用者人眼確認後：該電腦第一次先 `npx wrangler login`，再 `npm run deploy`。
6. 讀回 wrangler 印出的 workers.dev 網址。免費方案即可；自訂網域或登入牆先標給使用者決定，不要自己買。

既有 vinext 目錄（已有 `package.json`）可跳過 init，只跑 `install-template.sh`。

## 更新既有站

1. 同時拿到 Figma Frame link 與精確 identity：本機絕對路徑，加上 `wrangler.jsonc` 的 `name` 或已驗證的 workers.dev URL。不清楚就停，不從相似名稱猜。
2. 依 `variant:<id>` 做 diff；新 variant 先提案，既有 ID 不得默默覆蓋。schema 變就 `config.version` +1。
3. 驗證變更與未變 variant，使用者授權後才 `npm run deploy`。

## ChatGPT Sites（已停用）

不要當新站預設。只有使用者明確要求沿用舊 Sites 時才處理，且 CLI／IDE 不能直接 deploy Sites。

## 交付時告訴使用者

- 網址（Cloudflare `workers.dev`）
- 左邊填會變的內容，預覽後下載 PNG／JPG；照片只留在自己的瀏覽器
- 想改版型：再給一個含 node-id 的 Figma Frame URL
