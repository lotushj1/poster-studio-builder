# Poster Studio Builder

把已經在 Figma 做好的固定海報版型，變成可以反覆使用的網頁工具。之後只要在瀏覽器更新文字、日期、照片等會變動的內容，就能預覽並下載 PNG 或 JPG。

**完整使用說明（Cursor／Claude Code／Codex 都能照做）：** [docs/guide.md](docs/guide.md)

用這個公開 Skill 就能從自己的 Figma Frame 建一座海報產生器網站。請不要去複製別人的現成專案；版面與固定素材來自你自己的 Figma。

## 先知道這三件事

- 它不會替你設計海報，也不是自由排版工具。你要先有一張已完成的 Figma 固定版型。
- 要把版型做成工具，你需要一個能開啟、而且直接指向那張海報的 Figma Frame（完整畫面框）網址，例如 `https://www.figma.com/design/<檔案>/<名稱>?node-id=<節點編號>`。只有截圖、參考圖或一般檔案網址都不夠。
- 使用者上傳的照片留在自己的瀏覽器裡，範本不會把照片上傳到伺服器。Figma 裡的實際圖片、字體、Logo 與使用權，仍要由你逐項檢查。

## 適合誰

這套工具適合已經有固定視覺版型、需要反覆產出圖片的人，例如：

- 設計師把同一套直播課、活動或公告版型交給團隊重複使用。
- 內容創作者每週只需要換標題、日期、來賓照片或說明文字。
- 小型團隊要從同一張 Figma 版型輸出不同尺寸或不同人數的海報。

它的重點是把「固定的設計」和「每次會變的內容」分開。版面與固定素材來自 Figma；使用者只修改被允許修改的欄位。

## 開始前需要準備

1. 一個可讀取的 Figma 海報 Frame 網址，網址中要有 `/design/` 和 `node-id=`。
2. 讀取該 Frame 以及使用其中圖片、Logo、字體的權限。能打開連結，不代表所有素材都能公開或商業使用。
3. 一份簡單的清單：哪些文字和照片會換、哪些內容必須固定，以及要輸出哪些尺寸。
4. Cursor、Claude Code 或 Codex，以及一個免費 [Cloudflare](https://dash.cloudflare.com/sign-up) 帳號（用來發佈網站）。

如果手上只有截圖，請先回到 Figma 找到對應的完整 Frame 和節點網址；不要用截圖猜出版面或圖層位置。

## 安裝這個 Skill

對 Cursor、Claude Code 或 Codex 開新對話，貼：

> 請安裝公開 Skill：https://github.com/lotushj1/poster-studio-builder  
> Skill 名稱 `poster-studio-builder`。安裝後請告訴我，我會在下一則訊息用它。

Codex Desktop 也可以只貼 GitHub 網址，請它用內建 Skill Installer 安裝。安裝後開新對話，讓規則生效。不要把密碼或私人 Figma 連結放進公開 GitHub。

## 請別人幫你做站時，貼這段

```
請使用 poster-studio-builder，用這個 Figma Frame 做一個海報產生器網站：
https://www.figma.com/design/<檔案>/<名稱>?node-id=<數字>-<數字>
發佈到 Cloudflare Workers（免費 workers.dev）。
```

對方會得到**自己的**網站：自己的 Figma、自己的網址。

## 四步開始使用

### 1. 確認 Figma 版型

先在 Figma 整理好固定海報，並確認 Frame 網址可以實際開啟。把固定元素、可修改欄位、使用的圖片與字體列出來；如果缺少權限或素材來源不清楚，先停在這一步。

### 2. 把需求和網址交給 AI

告訴 Cursor／Claude Code／Codex 這張海報的用途，貼上精確的 Figma Frame 網址，並說明哪些文字、日期、照片會變動。它會依這張版型整理可重複使用的工具；你要先查看它讀到的版面、欄位和固定素材是否正確。

### 3. 在瀏覽器填寫與預覽

打開產生的工具，依序填寫內容、放入照片，必要時在預覽圖上拖曳或縮放照片。若有多個版型，可以先看「目前版型」，再切到「全部版型」檢查不同尺寸或人數版本。

### 4. 下載成品並檢查

在「匯出」頁選 PNG 或 JPG，下載目前版型，或分別下載全部版型。請實際打開下載的檔案，確認文字沒有被截斷、照片裁切正確、尺寸符合用途；一張截圖或測試數字不能代替成品檢查。

## 四個操作頁籤

1. **內容**：填寫標題、說明、日期、時間、顏色等文字或欄位。
2. **素材**：上傳或更換照片，調整照片在框內的構圖；需要時選擇字體。
3. **調整**：只調整設計者開放的項目，例如文字大小、顏色、照片位置或整組來賓的位置；也可以保存常用內容。
4. **匯出**：選 PNG 或 JPG，下載目前版型、分別下載全部版型、複製圖片或全部重設。

預覽區可以在「目前版型」和「全部版型」之間切換。全部版型會分別下載多個檔案，不會打包成 ZIP。

## 隨附範例模板能做什麼

這個公開 GitHub 專案內的匿名範例用來展示編輯器能力，不是你的正式設計。它目前示範四種版型、同步預覽、文字放不下時自動縮小、照片裁切與拖曳、常用內容保存，以及 PNG／JPG 下載。也可以選擇是否讓瀏覽器列出本機字體；這個選項預設關閉，開啟時仍要依瀏覽器權限操作。

正式專案的版面、固定圖片和可編輯欄位，必須從你有權使用的 Figma Frame 重新整理，不能直接把匿名範例當成客戶設計。

## 照片、資料與使用權

- 使用者輸入和上傳照片只暫存在目前的瀏覽器，不會由這個範本上傳到伺服器，也不會自動同步到其他裝置。清除瀏覽器資料或換裝置前，請先保留需要的成品。
- Figma 的 Logo、圖片、向量和字體可能有不同的使用限制。請確認擁有者、授權範圍和目標發布渠道；連結能讀取不等於可以公開使用。
- 不要把 Figma 登入資訊、密碼、服務金鑰、私人網址或真實個人照片放進公開 GitHub 專案、問題回報或程式提交。
- 如果版型缺少字體、效果或固定素材，或無法在瀏覽器實際檢查，請標示為尚未確認，不要宣稱它和 Figma 完全相同。

## 目前不支援的事情

這不是自由拖曳排版工具，目前也不支援多頁編輯、雲端儲存、多人同步、AI 生圖、上傳字體檔、影片或動圖。不同版型會各自下載成圖片，不提供 ZIP 批次下載。固定版型能否完整重現，仍取決於 Figma 的字體、效果、素材和權限是否可用。

想看完整的示範口播與拍攝提醒，可讀 [YouTube 完整腳本](docs/tutorial/youtube-full-script.md)。

<details>
<summary>給開發者：安裝模板、覆蓋範圍與驗證</summary>

以下內容給要建新站、或把模板放進既有 vinext 專案的人；一般使用者不需要執行這些命令。

### 新專案（給其他人的站）

新站請用這個 Skill 從頭建，不要複製別人的現成專案。在本 repo 根目錄執行：

```bash
bash scripts/init-cloudflare-project.sh /path/to/new-project <worker-name>
bash scripts/install-template.sh /path/to/new-project
```

`worker-name` 用小寫連字號，之後會變成 `https://<name>.<帳號>.workers.dev`。

### 把模板放進既有 vinext 專案

目標專案需要先有 `package.json`。在本 repo 根目錄執行：

```bash
bash /path/to/poster-studio-builder/scripts/install-template.sh /path/to/your-project
```

安裝腳本會覆蓋目標專案的 `app/page.tsx`、`app/layout.tsx`、`app/globals.css`，以及 `app/studio/` 裡的編輯器程式；也會加入測試檔並更新 `package.json` 的測試指令。執行前請先備份或確認這些檔案可以被替換。

`app/studio/config.ts` 是版型設定檔，告訴工具有哪些欄位、照片和版型；它預設會保留目標專案原有內容。若要改用 repo 內的匿名範例設定，才加上 `--force`：

```bash
bash /path/to/poster-studio-builder/scripts/install-template.sh /path/to/your-project --force
```

腳本不會刪除目標專案的 `app/_sites-preview`；如果發現它，會印出警告，請完成檢查後再自行決定是否移除。

### Node 與測試

本 repo 要求 Node.js `>=22.6.0`，目前可直接執行：

```bash
npm test
```

完整安裝到目標網站後，依目標專案提供的設定再執行：

```bash
npm run lint
npm test
npm run build
```

命令與測試只能確認程式的一部分；版型是否正確，仍要在瀏覽器填入內容、實際下載圖片並打開檔案檢查。

### 技術文件

- [介紹與使用說明](docs/guide.md)：給第一次使用的人，Cursor／Claude Code／Codex 都能照做。
- [SKILL.md](SKILL.md)：給 AI 使用的來源、建置與安全規則。
- [Figma Frame 工作流程](references/figma-frame-workflow.md)：如何確認精確的 Figma Frame。
- [來源資料格式](references/source-package.md)：Figma 讀取結果與固定素材的資料格式。
- [版型設定說明](references/config-guide.md)：`config.ts` 的欄位、圖層、尺寸與字體設定。
- [驗證清單](references/verify.md)：程式、瀏覽器、下載圖片與人工檢查方式。
- [部署說明](references/deploy.md)：把模板放進網站專案時的注意事項。
- [CONTRIBUTING.md](CONTRIBUTING.md)：修改 repo 的規則。
- [SECURITY.md](SECURITY.md)：回報密碼、個資或其他安全問題的方式。

</details>
