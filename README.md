# Poster Studio Builder

用已驗證的 Figma Design Frame 建立可重複使用的固定版型海報工具。這個公開套件包含一個中性黑白 `mono-v1` React／canvas 範本：填寫內容、放入照片、調整指定元素，接著預覽與匯出目前或全部版型。

> English summary: a Figma Design Frame-only workflow and reusable React/canvas poster editor template. The template is not a design fallback and does not generate artwork or upload user photos.

## 先看這裡

- 生產流程只接受可存取、指向具體節點的 Figma `/design/...?...node-id=...` Frame。
- 截圖、參考圖、一般檔案 URL、手寫幾何或沒有權限的 Frame 都不能當作 build source。
- `assets/template/app/studio/config.ts` 是匿名範例；正式專案必須由通過命名、資產與人眼驗收的 source package 產生 config。
- 範本目前保留四個 variant、目前／全部預覽、文字自動縮放、照片裁切、預設組合、PNG／JPG 匯出與本機字體選項。

## 安裝 Skill

在 Codex Desktop 開新對話，直接貼上以下提示詞：

> 請使用 Skill Installer 安裝公開 GitHub repository。
> Repository URL: https://github.com/lotushj1/poster-studio-builder
> Repository root/path: `.`
> Skill name: `poster-studio-builder`
> 安裝完成後請告訴我；我會在下一個新 task／對話回合使用它。

這等價於 Codex 內建 installer 設定：`repo=lotushj1/poster-studio-builder`、`path=.`、`name=poster-studio-builder`，目的地是預設 `~/.codex/skills`。安裝後請開新的 task／對話回合，因為新 Skill 不會回溯套用到目前回合。不要把本機資料夾直接當作公開安裝來源，也不要把 credentials 放進 repo。

## 把 template 安裝進專案

先準備一個 Sites／Vinext starter，再執行：

```bash
bash /path/to/poster-studio-builder/scripts/install-template.sh /path/to/your-project
```

`app/studio/config.ts` 預設不覆蓋既有設定；要安裝匿名範例才加 `--force`：

```bash
bash /path/to/poster-studio-builder/scripts/install-template.sh /path/to/your-project --force
```

安裝腳本會覆蓋 `app/page.tsx`、`app/layout.tsx`、`app/globals.css`，以及 `app/studio/` 內的引擎與編輯器 UI 檔案（包含 `PosterStudio.tsx`、controls、render／export helpers）；也會更新測試檔與 `package.json` 的 test 指令。`app/studio/config.ts` 預設保留既有內容，只有加上 `--force` 才會以匿名範例覆蓋。模板不會刪除 `app/_sites-preview`：腳本若發現它會印出警告，請完成檢查後再自行手動移除。

安裝後依 `references/config-guide.md` 將通過 Figma gate 的設定與固定資產放入目標專案，再依 `references/verify.md` 驗證。安裝腳本不會把 credentials、Figma token、使用者照片或本機字體拷入專案。

## 開發與驗證

本 repository 要求 Node.js `>=22.6.0`，不含 runtime dependencies。純函式、source invariant 與 validator safety tests 可直接執行：

```bash
npm test
```

若只要跑 template tests，也可以執行 `node --experimental-strip-types --test assets/template/tests/*.test.mjs`。

若要驗證完整安裝，請在隔離的臨時 Sites／Vinext scaffold 執行安裝腳本，再跑：

```bash
npm run lint
npm test
npm run build
```

Runtime gate 必須實際檢查 1440px、1024px 與 390px；確認初始頁、四個主 tab、至少一個 disclosure、目前／全部預覽切換、匯出控制、鍵盤 focus 與 console。測試數量、config、DOM 幾何或代表截圖不能代替實際成品檢查。

## 操作介面

控制側欄使用鍵盤可操作的 ARIA tabs：

1. **內容**：文字、日期、時間、色彩等欄位。
2. **素材**：圖片欄位與字體設定。
3. **調整**：指定圖層微調與可保存的預設組合。
4. **匯出**：PNG／JPG、批次匯出、複製圖片與重設。

預覽預設只顯示目前版型，切到「全部版型」才展開多變體格線。頁首只有一個主要下載動作；格式、批次下載與其他次要選項集中在匯出 tab。

## 資料、憑證與隱私邊界

- Figma 連結、命名 readback、source manifest 與資產授權證據只在一次 build／update 工作中使用；靜態 Site 不保存 Figma credential。
- 使用者輸入與上傳照片只留在瀏覽器的 localStorage／IndexedDB；不由範本上傳到服務端。
- 公開範本與 sample config 不放客戶名稱、個人姓名、私人網址、Figma ID、token、API key、密碼或真實照片。
- `fonts.localCatalog` 預設關閉；開啟後由瀏覽器依權限列出本機字體，字體本身不會被上傳。
- 請不要把秘密放進 `config.ts`、`public/`、source package、issue 或 commit。發現疑似洩漏時依 [SECURITY.md](SECURITY.md) 回報。

## 已知限制

範本不是自由排版工具、不支援多頁編輯、雲端儲存、多人同步、AI 生圖、上傳字體、影片／動圖或 ZIP 批次下載。Figma MCP 提升抽取精度但不保證 pixel identity；缺字體、不支援效果、資產 coverage 不完整或無法完成瀏覽器／人眼驗收時，狀態必須保持未驗證。

## 文件

- [SKILL.md](SKILL.md)：Figma Frame-only 工作流與安全界線。
- [references/config-guide.md](references/config-guide.md)：config 與 variant／field／module 對應。
- [references/verify.md](references/verify.md)：測試、瀏覽器、匯出與人眼驗收清單。
- [CONTRIBUTING.md](CONTRIBUTING.md)：修改與驗證規則。
- [SECURITY.md](SECURITY.md)：秘密與個資回報方式。
