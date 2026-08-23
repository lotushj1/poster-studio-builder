# 字體：固定繁中安全堆疊與選用的本機字體

Figma source manifest 先記錄每一個 TEXT segment 的 family、style、字級、行高與字距，並確認在 Figma 與輸出環境可用且已獲授權。缺字體、字重或授權不明時 fail closed，不用相似字體補洞。

模板預設不掃描整台電腦的字體。`config.fonts.localCatalog` 預設為 `false`，先用固定的繁體中文安全堆疊（例如 `PingFang TC` → `Noto Sans TC` → `Microsoft JhengHei` → `sans-serif`），避免每台電腦的清單與權限提示變成一般使用者的主要流程。使用者明確需要進階清單時，才在 config 設 `localCatalog: true`。

## 運作方式（模板已實作，在 `app/studio/fonts.ts` 與 `controls/FontPanel.tsx`）

1. 用家族名稱就能用：canvas 與 CSS 會依角色的固定安全堆疊取字體，不需要任何權限。匯出的 PNG 就是用當下瀏覽器實際解析到的字體畫的。
2. 進階列出電腦字體：只有 `fonts.localCatalog: true` 且使用者打開「進階字體設定」後，才呼叫 `window.queryLocalFonts()`（Local Font Access API）。只有桌面版 Chrome／Edge 103 以上支援；第一次會跳權限詢問。拒絕或不支援時 UI 退回「輸入字體名稱」。
3. 指定確切字重：從清單選到某一款字型（例如 W6）時，模板用 `FontFace` 把那個字型載進頁面（`pinFace`），canvas 才會精準用到它；重新整理後只靠家族名稱＋字重由瀏覽器配對。
4. 降級：任何瀏覽器都可以直接輸入字體名稱；模板用 canvas 量寬度判斷電腦有沒有那個字體，有就顯示「偵測到」並預覽。
5. 快速選項：`SUGGESTED_ZH_FONTS` 列了台灣常見字體；只有啟用 `localCatalog` 才會做本機可用性篩選並顯示。`config.fonts.suggested` 可加品牌常用字體。

## 限制（交付時要講）

- 字體跟著電腦走：換一台沒有那個字體的電腦，就會用備援字體（角色的 fallback），圖會不一樣。
- Figma 有字體不等於瀏覽器有字體：source package 要保存 family/style 的可用性與授權證據；沒有證據時不能把 fallback 當成精準還原。
- 預設流程不讀取本機清單；若明確啟用 `localCatalog`，Safari、Firefox、手機瀏覽器仍不能列清單，但可以輸入名稱。
- 嵌入式瀏覽器（IDE 內建預覽、App 的 WebView）權限可能直接被拒，這不是 bug；要看清單功能請用真正的 Chrome 開網址。
- 不上傳字體檔、不把字體放進專案：授權與檔案大小都是問題。真的要跨裝置一致，請使用者提供授權允許的網頁字體再另案處理。

## 對使用者怎麼說（範例）

「預設使用固定的繁中安全字體，不會讀取整台電腦。若你需要進階挑字體，開啟設定後，桌面版 Chrome 或 Edge 可以從清單挑；其他瀏覽器請輸入字體名稱（跟字體簿裡顯示的一樣）。字體不會被上傳。」

## 名稱對照（常見坑）

- 粉圓 2.0 的家族名是 `jf open 粉圓 2.0`（舊版 `jf-openhuninn-2.0`、`Huninn`）
- 蘋方 `PingFang TC`、黑體 `Heiti TC`、微軟正黑體 `Microsoft JhengHei`、標楷體 `DFKai-SB`
- 思源黑體：Google 版 `Noto Sans TC`／`Noto Sans CJK TC`，Adobe 版 `Source Han Sans TC`
- 字重不存在時瀏覽器會合成粗體（看起來糊）；角色的預設字重要選字體真的有的

## 驗證

- 預設：字體區顯示固定安全字體堆疊，不出現本機清單權限請求；PNG 與預覽使用同一角色設定。
- 啟用 `localCatalog` 後的 Chrome：字體區 → 進階字體設定 → 讀取電腦字體 → 允許 → 看到清單 → 點一個家族 → 畫布文字立刻換；該家族有多款字型時點其中一款（例如 Bold）→ 字重跟著變
- Safari 或任何瀏覽器：在進階字體設定輸入 `PingFang TC` → 顯示「偵測到」→ 套用 → 畫布換字
- 匯出的 PNG 打開，字體與預覽一致
- 有 Figma Frame 時：每個 variant 的 PNG 要與對應 Frame export 做 50% overlay／difference，再由人確認字型、換行、字距與可讀性；validator 不會自動證明這件事。
