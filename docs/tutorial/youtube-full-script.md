# Poster Studio Builder｜YouTube 完整逐字腳本

> 版本：錄製稿 v1.0
> 片長目標：22:30（旁白、停格、示範與轉場合計）
> 受眾：會基本 Figma、第一次使用 Codex 桌面 App 的設計師與內容創作者
> 語言：繁體中文、台灣用語

## 錄製前 UI 名稱 readback gate

以下先用本次預期 IA 寫稿，正式錄影前要以最後可見畫面逐字讀回；名稱不一致時，先替換本檔所有字卡、旁白與字幕，再開拍。

| 區域 | 預期名稱 | 拍攝 gate |
| --- | --- | --- |
| 控制區主 tabs | `內容`、`素材`、`調整`、`匯出` | `拍攝 gate：實際瀏覽器畫面 readback` |
| 預覽區模式 | `目前版型`、`全部版型` | `拍攝 gate：實際預覽區 readback` |
| 變體選擇 | `目前版型` 下拉選單與四個變體卡 | `拍攝 gate：四卡與尺寸 readback` |
| 下載動作 | `下載目前版型`、`下載全部 4 張` | `拍攝 gate：實際下載檔案 readback` |

若最後 UI 的文字略有不同，影片以實際讀回為準，不用本稿預期名稱硬配畫面。公開 repo、匿名 README／repo 可讀、Skill Installer clean install 與 23/23 tests 已讀回；正式 UI、Figma E2E、Sites live URL、輸出與 overlay 尚待拍攝，因此相應位置保留 `PENDING`。

## 使用方式與證據標籤

每一章都包含 `時間碼`、`畫面動作`、`逐字旁白`、`螢幕字卡`、`B-roll／剪輯提示` 與 `證據／pending 標籤`。旁白段落可直接朗讀；括號是給剪輯與錄製者看的指示，不念出來。

- `已讀回`：錄製時已在指定畫面、檔案或設定中看到與說法一致的結果。
- `拍攝 gate`：必須在錄影時取得成品本身的畫面或檔案證據。
- `PENDING`：目前沒有可誠實宣稱完成的證據，保留角標，不用旁白把它說成完成。
- `幕後 verifier`：只拍一張短結果卡，例如「source package validator：PASS」；不把終端機或指令變成觀眾操作教學。

旁白速度以每分鐘約 250–270 個中文字估算；畫面停留、輸入與下載等待已納入 22:30 的剪輯時間，不需要加速到觀眾看不清楚。

## 片頭狀態聲明

這支片使用完全虛構的「示範品牌／每週設計直播」資料。示範主持人、示範來賓 A／B、日期、文案、圖片檔名與網址均為錄製用資料；正式錄影仍要檢查所有視窗、通知、檔案名稱與瀏覽器網址列，確定沒有真實個人或專案資訊。

---

## 章 1｜先看完成品：固定版型如何變成可重複使用的 Site

**時間碼：00:00–00:40（40 秒）**

### 畫面動作

1. 拍攝 gate 通過且取得 live page readback 後，開啟生成 Site，先顯示精修後 UI；控制區停在 `內容` tab，預覽區顯示 `目前版型`。若 gate 尚未通過，改拍 `PENDING` 狀態卡，不使用未驗證畫面。
2. 快切到 `全部版型`，讓四個變體同時出現：IG 貼文一位來賓、IG 貼文兩位來賓、IG 限動一位來賓、IG 限動兩位來賓。
3. 依序點開 `內容`、`素材`、`調整`、`匯出`；在 `匯出` 選 PNG，示範下載目前，再示範下載全部四張，最後用檔案視窗顯示四個明確檔案。
4. 回到 `目前版型`，改一個標題字，讓觀眾看到不是靜態樣張。

### 逐字旁白

> 「先看結果。這不是做完一張海報就結束，而是一個可以重複使用的海報 Site。左邊的控制區分成內容、素材、調整和匯出；右邊可以看目前版型，也可以一次看全部版型。這裡同一份資料會同步對應四個輸出尺寸與來賓版本。最後我可以下載目前這一張，也可以下載全部四張，而且每個檔名都能對回自己的 variant。接下來我會從 Figma 的來源 gate 開始，說明每一步怎麼留下可以驗證的證據。」

### 螢幕字卡

`固定版型`　`可編輯內容`　`四個明確輸出檔`

### B-roll／剪輯提示

- 開場前兩秒用完成品滿版，避免先放 logo 或長片頭。
- 四卡預覽用 1.5 倍速滑過，但每個變體名稱與尺寸至少停留 0.8 秒。
- 下載檔案畫面只顯示虛構檔名，不顯示使用者家目錄或其他檔案。

### 證據／pending 標籤

`PENDING｜拍攝 gate：精修後 UI、四卡預覽、實際下載檔案與 final UI 名稱必須現場 readback。`

---

## 章 2｜痛點與成果：把每週重排，換成一次建立、每次填內容

**時間碼：00:40–01:50（1 分 10 秒）**

### 畫面動作

1. B-roll 顯示兩個對照畫面：左邊是每次複製海報後重新拉文字框，右邊是固定版型 Site 的四卡預覽。
2. 畫面疊出四個角色名稱：`Skill`、`Figma source package`、`template`、`generated Site`。
3. 用簡單流程圖標示：Figma Frame → source package → template engine → generated Site → PNG／JPG。

### 逐字旁白

> 「很多人每週做宣傳圖，真正浪費時間的不是輸入日期，而是重新對齊、重做照片裁切、重新檢查不同尺寸有沒有爆掉。這套工作流把固定的部分留在版型裡，把每週會變的內容變成欄位，讓人把時間放回文案與素材判斷。
>
> 先把四個角色分清楚。Skill 是 Codex 讀得懂的工作規則，負責限制來源、命名、驗證與安全邊界；Figma source package 是這一次來源的可追溯中間包，裡面有 Frame export、變體、圖層資料、字體與本地資產；template 是編輯器引擎，不是沒有來源時拿來冒充設計的樣板；generated Site 才是依這次 source package 產出的實際工具。只看到 template 預覽，不能說生成 Site 已經建立，更不能說它已經部署。」

### 螢幕字卡

`一次確認來源` → `每週只改欄位` → `多尺寸輸出`

### B-roll／剪輯提示

- 左側手動重排畫面只拍虛構資料與模糊化檔案。
- 四個角色分別用不同顏色，但整支片維持最多三種主色。
- 旁白說到「不能說已部署」時，顯示橘色 `PENDING ≠ PASS`。

### 證據／pending 標籤

`已讀回：名詞定義依公開 Skill contract。`

`PENDING｜示範 Site 的 live artifact 仍以拍攝當日 URL、版本與實際頁面 readback 為準。`

---

## 章 3｜從 GitHub 安裝 Skill：在 Codex 對話中提出請求

**時間碼：01:50–03:20（1 分 30 秒）**

### 畫面動作

1. 在瀏覽器開啟已驗證的公開 repo：`https://github.com/lotushj1/poster-studio-builder`，用匿名視窗確認 README／repo 可讀，並顯示 default branch `main` 與 release tag `v0.1.0`；不把本機資料夾當成公開頁面。
2. 顯示 repo 的 `SKILL.md`、`references/`、`assets/`、`scripts/` 與 `agents/`，說明這些是公開可審閱的規則與資源。
3. 開啟 Codex 桌面 App 的新對話，直接貼上公開 GitHub URL，說：「請安裝這個公開的 Poster Studio Builder Skill；安裝完成後，下一個 task 再確認它是否可用。」觀眾不需要下載 ZIP，也不需要操作終端機或 Skill 設定頁。
4. 錄下 Codex 的安裝回覆；下一個 task 開始時，再問「請使用 Poster Studio Builder Skill，先回讀 Figma Frame gate」。這個 Codex UI live readback 尚未取得，拍攝時若仍未讀到就顯示 `PENDING`。

**製作備註（不上鏡，不列為觀眾步驟）：** 官方 `skill-installer` 的安裝紀錄已驗證 `repo=lotushj1/poster-studio-builder`、`path=.`、`name=poster-studio-builder`、目的地 `~/.codex/skills`；匿名 README／repo 可讀，clean install 與 23/23 tests 已通過。安裝完成後仍要到下一個 task 確認可用，這個 Codex UI readback 保留為拍攝日 `PENDING`。

### 逐字旁白

> 「先從公開 repo 取得 Skill。這個 repo 已經可以用匿名視窗讀取，default branch 是 main，release tag 是 v0.1.0；幕後的 clean install 與 23/23 tests 也已通過。接著我把公開 GitHub URL 貼進 Codex 桌面 App 的新對話，請 Codex 安裝這個 Skill。安裝完成後不要在同一段對話裡假設它已經可用，下一個 task 再要求使用 Poster Studio Builder，回讀它是否出現。這個 Codex UI live readback 目前仍是拍攝 gate，要保持 PENDING。這一步只是安裝規則，不代表已經有任何 Figma 來源，也不代表 Site 已經產生。
>
> 觀眾只需要操作 GitHub 網頁與 Codex 桌面 App，再進入 Figma 與 Sites；本片不把命令列或設定頁當成主要操作方式。若需要在幕後跑結構驗證，影片只放一張短結果卡，說明哪個 verifier 通過、哪個 gate 還在等，不把技術命令複製貼上變成教學流程。公開 repo 的存在也不等於生成 Site 會公開；Skill、來源包、generated Site 與 Site 權限是不同的角色。」

### 螢幕字卡

`公開 repo：main／v0.1.0`　`clean install／23/23 tests`　`下一個 task UI readback：PENDING`　`先不建置，等 Figma Frame gate`

### B-roll／剪輯提示

- GitHub 畫面遮住帳號頭像、通知數、私人分頁與瀏覽器自動完成資料。
- Codex 安裝回覆與下一個 task 的可用性只留必要文字，不顯示其他工作區名稱。
- 公開 repo 畫面保留匿名視窗、`main`、`v0.1.0` 與 README；Codex 下一個 task 的可用性若沒有 live readback，就保留 `PENDING`。

### 證據／pending 標籤

`已讀回：公開 repo URL、匿名 README／repo 可讀、default branch main、release tag v0.1.0、Skill Installer clean install、23/23 tests。`

`PENDING｜Codex UI 下一個 task 實際讀到 Skill 的 live readback。`

---

## 章 4｜先過 node-specific Figma Design Frame gate

**時間碼：03:20–05:00（1 分 40 秒）**

### 畫面動作

1. 在 Figma 開啟虛構的「每週設計直播」檔案，選取四個真正的 Design Frame：兩個 1080×1350、兩個 1080×1920。
2. 從選取的 Frame 複製 node-specific `/design/` 連結。字卡用安全佔位格式：`https://www.figma.com/design/<file-key>/<file-name>?node-id=<整數>-<整數>`。
3. 在 Codex 對話貼上連結，讓 Codex 先讀取 `get_design_context`；畫面顯示「第一個 Figma MCP 讀取」與目標 Frame 身分、尺寸、權限結果。
4. 反拍三個故意停損的例子：只有檔案連結、`/file/` 連結、沒有明確節點的截圖。三者都停在紅色 Frame gate。
5. 顯示示範資料卡，將這一次影片的內容固定下來。

### 逐字旁白

> 「真正的來源不是一張截圖，也不是我看著畫面手寫座標，而是一個可以存取、指向具體節點的 Figma Design Frame。網址要有 `/design/`、檔案識別、單一而且沒有猜測的 node id，還要真的讀得到目標 Frame。只看網址格式不算通過；Codex 必須先以這個來源讀到 Frame 身分與精確寬高。
>
> 這裡我刻意示範三個不能繞過的情況：只有檔案連結、舊式檔案路徑，以及只有截圖。這些都不能拿來建立 source package。第一個 MCP 讀取必須是 design context；如果沒有權限、節點不存在，或目標不是 Frame，就保留錯誤原因，停在這裡。先把來源說清楚，後面的命名與驗證才有意義。」

### 示範資料卡（畫面停格 8 秒）

| 欄位 | 錄製值 |
| --- | --- |
| 系列 | `每週設計直播` |
| 活動名稱 | `把複雜的事，說成好懂的事` |
| 一句話說明 | `從一個問題開始，找到可行的下一步` |
| 日期／時間 | `2026-09-12`／`20:00` |
| 主持人 | `示範主持人`／`內容策劃` |
| 來賓 1 | `示範來賓 A`／`品牌設計師` |
| 來賓 2 | `示範來賓 B`／`內容編輯` |
| CTA | `直播連結與回放資訊見說明欄` |
| 強調色 | `#D85C3A` |

### 螢幕字卡

`/design/ + 單一 node id + 可讀取 Frame`

`截圖不是 build source`

### B-roll／剪輯提示

- Figma 網址列只保留格式與虛構 key；file key、node id、帳號與分享彈窗中的人員全部遮罩。
- 真實 Figma readback 若尚未取得，不要用游標停在舊畫面假裝成功；以 `PENDING｜Frame access／identity readback` 角標取代。

### 證據／pending 標籤

`拍攝 gate：Figma Frame access、Frame type、四個尺寸與第一個 get_design_context readback。`

`PENDING｜尚未取得上述 live evidence 前，不進入模板安裝或 Site 建立。`

---

## 章 5｜五種 naming contract 與需求 readback

**時間碼：05:00–06:50（1 分 50 秒）**

### 畫面動作

1. Figma 圖層面板 close-up，逐一框選五種命名：
   - `variant:ig-feed-one-guest`
   - `field:event-title`
   - `image:guest-portrait`
   - `fixed:series-mark`
   - `module:guest-one`
2. 將一個錯誤的 `Text 2` 暫時標成紅色，顯示 naming proposal 表格：node ID、type、current name、proposed name、role、confidence、action。
3. 在 Codex 顯示 readback：固定元素、可編輯欄位、圖片資產、模組、字體、匯出與驗收方式。
4. 顯示「確認後才 rename」的 gate；精確 node ID、舊名稱與新名稱都要逐列回讀。

### 逐字旁白

> 「Figma 這裡不是只要看起來漂亮，名稱也要能讓來源包穩定對應。`variant` 是一個完整而且精確尺寸的輸出 Frame；`field` 只給真正可編輯的 TEXT；`image` 代表可替換的圖片填色或圖片節點；`fixed` 是不出現在表單裡的固定元素；`module` 則把要一起移動或縮放的照片、姓名和頭銜綁在一起。
>
> 五種前綴後面的 ID 用有意義的小寫英文 kebab-case，不用圖層順序、任意數字或畫面上偶然出現的一整句文字。這個 `Text 2` 不會被我直接改掉。Codex 先列出 node ID、目前名稱、建議名稱與不確定性，等明確確認；如果要寫入，只做 exact-ID、name-only 的修改，接著再唯讀回讀。命名尚未 verified，就不能產生 manifest、config 或 Site。
>
> 命名通過後才做需求 readback。我會確認用途與平台、每個 variant 的尺寸、固定元素、可填欄位、圖片授權、模組、字體與 fallback、PNG／JPG 檔名，以及最後要怎麼驗收。這張清單是給人確認的，不是把責任藏在一段 prompt 裡。」

### 螢幕字卡

`variant:` 完整輸出　`field:` 真正 TEXT　`image:` 可替換素材

`fixed:` 固定資產　`module:` 成組調整

`命名未 readback verified → generation blocked`

### B-roll／剪輯提示

- 用游標線和五種顏色標出五類，但不要讓色彩本身取代文字名稱。
- proposal 表格中的 node ID 使用虛構遮罩值，如 `<node-id>`，不顯示真實識別資訊。
- 人工確認按鈕要停格一秒；若沒有真正確認 readback，顯示 `PENDING` 而不是剪掉等待。

### 證據／pending 標籤

`拍攝 gate：五種 contract name、proposal confirmation、exact-ID rename（若有）與唯讀 naming readback。`

`PENDING｜需求 readback 與 naming evidence 需使用本次實際 Frame。`

---

## 章 6｜Source package 與建立 new Site

**時間碼：06:50–08:50（2 分鐘）**

### 畫面動作

1. Codex 桌面 App 顯示需求 readback 已確認，再要求使用 Poster Studio Builder 讀取 Figma Frame。
2. 依序顯示工作狀態卡：`get_design_context` → 命名 audit／readback → `get_metadata`（必要時）→ `download_assets` → 唯讀 properties extraction（必要時）。
3. 展開去識別化 source package：

   ```text
   source-package/
   ├── manifest.json
   ├── reference/frame.png
   ├── reference/variants/<variant-id>.png
   └── assets/<asset-id>.<format>
   ```

4. 短暫顯示幕後 verifier 結果卡：`schema／URL／命名／檔案／PNG 尺寸／geometry：PASS 或 PENDING`。不拍命令列教學。
5. 在 Codex 桌面 App 以 Sites 建立 starter Site，套用模板，顯示生成後的控制區與預覽區。
6. 最後停在 Sites 的保存／部署畫面，沒有 live URL readback 就顯示 `PENDING`。

### 逐字旁白

> 「需求確認後，Codex 才把 Figma 讀取結果整理成 source package。它不是要你手寫的設定檔，而是一個把來源 Frame、完整 export、各個 variant、可追溯 layer、字體與已下載資產綁在一起的中間包。暫時下載網址必須立刻保存成專案裡的本地檔案；只留一個會失效的網址，不算資產完成。
>
> 讀取順序也有意義：先拿 design context，命名 gate 通過後，才做結構定位與素材下載；若精確屬性不足，再使用唯讀的 properties extraction。幕後 verifier 可以檢查 schema、命名、檔案存在、PNG 的實際尺寸與 geometry，但它不能單靠 JSON 證明畫面完整，也不能代替人眼對照。
>
> source package 通過、需求 readback 確認後，才在 Codex 桌面 App 用 Sites 建立 new Site，再套用 template。請注意，template 是引擎，generated Site 是這一次由來源包產出的實例。看到本機預覽，不等於 Sites 已儲存、已部署或任何人都能看見；保存版本、部署、URL 與實際頁面都要個別 readback。」

### 螢幕字卡

`Figma source package ≠ template ≠ generated Site`

`validator 只證明結構；成品仍要瀏覽器與人眼驗收`

### B-roll／剪輯提示

- source package 檔名只能用虛構 ID；圖片縮圖可以是抽象色塊或已授權示範圖。
- verifier 結果卡最多停留兩秒，只顯示「檢查項目／結果」，不放 shell prompt、路徑、token 或私密 URL。
- 建立 Sites 的畫面若不是正式新站，標上「示範流程／PENDING live readback」。

### 證據／pending 標籤

`拍攝 gate：source package 本地檔案、validator 結果、new Site identity、保存版本、部署 URL 與 live page readback。`

`PENDING｜本稿不把未讀回的 Sites 畫面稱為已部署。`

---

## 章 7｜更新既有 Site：先確認身份，再做可回溯 diff

**時間碼：08:50–10:30（1 分 40 秒）**

### 畫面動作

1. 開第二個 Codex 對話，顯示一個已存在的示範 Site 與精確的本機專案／Site identity；以遮罩值表示，不顯示私人網址。
2. 貼上新的 node-specific Frame URL，讓 Codex 重新走 design context、naming audit 與 source package。
3. 顯示 diff 表：新增 `variant:ig-story-two-guests`、既有 variant 的 layer／field／asset 差異、未變更 variant 的回歸清單。
4. 示範 schema 有變時顯示 `config.version：1 → 2`；單純視覺微調則保留版本並留下紀錄。
5. 在重新部署前停格於授權確認與 Site 版本 readback。

### 逐字旁白

> 「更新既有 Site，最容易出錯的是目標身份不清楚。『更新上次那個』不是可驗證的指示；我需要精確的本機專案、Site 名稱或 hosting identity，還要有新的 Figma Frame。相似名稱、舊網址或目前工作目錄都不能拿來猜。
>
> 接著不是直接覆蓋 config，而是用五種穩定 ID 做 diff。新增 variant 先列新增計畫；已存在的 variant 把 layer、field、module 與 asset 差異逐項列出；沒有變更的 variant 也要列進回歸檢查。欄位、variant 或 schema 改變時，版本加一，讓舊的瀏覽器資料不會被誤當成新結構。只有視覺微調，才保留版本並寫明原因。
>
> 更新的退出條件是 changed 和 unchanged 都驗證，Site identity、版本與 live page 都讀得回，而且使用者明確授權重新部署。在這些條件以前，畫面即使看起來更新了，我也只說『已製作，等待驗證』。」

### 螢幕字卡

`先確認 identity`　`再做 stable-ID diff`　`最後才重新部署`

### B-roll／剪輯提示

- 用綠色和灰色分別標示 changed／unchanged，避免只拍一個新 variant。
- 版本號、Site URL、帳號名稱與專案路徑用遮罩或虛構值。
- 顯示「需要明確授權」按鈕；不要拍攝任何自動按下部署的動作。

### 證據／pending 標籤

`PENDING｜既有 Site identity、diff、未變更 variant 回歸、版本與重新部署 readback。`

---

## 章 8｜精修後 UI 完整操作：內容、素材、調整、字體與預設組合

**時間碼：10:30–15:10（4 分 40 秒）**

### 畫面動作

#### 10:30–11:35｜`內容` tab 與目前／全部版型

1. 控制區切到 `內容`，依序輸入活動名稱、說明、日期、時間、CTA、主持人與來賓姓名／頭銜。
2. 右側先顯示 `目前版型`，用下拉選單選 `IG 貼文｜1 位來賓`；再切到 `全部版型`，確認四個卡片同步更新。
3. 選 `IG 限動｜2 位來賓`，填入來賓 2，顯示 variant-specific 欄位只在需要的版型出現。

#### 11:35–12:35｜`素材` tab、上傳、裁切與模組

1. 在 `素材` 上傳 `demo-host.png`、`demo-guest-a.png`、`demo-guest-b.png` 三張有授權的虛構示範圖。
2. 在目前預覽上拖曳來賓照片調整 focal，使用縮放控制；示範直式與橫式照片各一次。
3. 點擊「置中」或「移除」其中一個動作，讓觀眾看到重設與清除狀態。

#### 12:35–13:30｜`調整` tab、字體與微調

1. 展開 `調整`，只操作被設為 adjustable 的標題字級、顏色、上下位置，以及來賓 module 的左右、上下、整組大小。
2. 在 `字體` 區使用預設安全繁中堆疊；需要展示進階能力時，開啟桌面 Chrome／Edge 的本機字體清單，畫面出現權限提示就停留說明。
3. 改一個來賓照片的個別構圖，再重設模組，確認整組相對關係仍然存在。

#### 13:30–15:10｜預設組合、刷新與收尾

1. 展開 `預設組合`，命名 `週六直播標準版`，儲存目前內容、字體與微調。
2. 刷新瀏覽器，讀回文字、variant、調整與照片；套用預設組合，再把日期換成另一個虛構日期。
3. 回到 `全部版型`，快速檢查四張預覽與每張的警告區。

### 逐字旁白

> 「現在進入每天真正會用到的部分。先在內容 tab 填文字、日期與時間；日期用日期欄位，讓格式固定，不要每週自己打出不同的標點。選取目前版型後，右側的預覽仍然可以切到全部版型，讓同一份資料在四個尺寸一起接受檢查。兩位來賓的欄位只在對應的 variant 出現，這比把第三個人藏起來再硬塞進版面可靠。
>
> 素材 tab 只處理可替換圖片。照片可以在畫布上拖曳構圖，也可以縮放、置中或移除；這些是裁切控制，不是自由變形。固定 logo 與固定向量來自 source package，使用者上傳的照片則留在目前瀏覽器。請使用有權使用的素材，並在鏡頭外確認檔案權利。
>
> 調整 tab 只開放真的需要的控制。這裡我可以把標題往下移、調整字級與顏色，也可以把來賓 module 整組放大或移動。照片仍然可以單獨調構圖，但姓名、頭銜與照片的相對關係不會被拆散。這個工具的價值是穩定輸出，不是把固定版型變成無限制的自由排版器。
>
> 字體預設使用固定的繁中安全堆疊，不會一打開就掃描整台電腦。如果確實需要進階字體清單，桌面 Chrome 或 Edge 才可能在取得權限後列出本機字體；Safari、Firefox 與手機瀏覽器可以輸入家族名稱，但不能假裝支援清單。字體檔不會上傳，換一台沒有同一款字體的電腦，輸出可能使用 fallback，這是要說清楚的限制。
>
> 最後存一個預設組合。預設組合保存的是文字、variant、字體與微調，圖片檔案本身不會被包進這個組合。刷新後我確認資料回來，再只改日期。這樣每週真正要做的事，是檢查內容與成品，而不是重建整個版面。」

### 螢幕字卡

`內容`：文字／日期／時間／CTA

`素材`：上傳、拖曳構圖、縮放、置中

`調整`：指定元素與 module，不是自由排版

`字體與預設組合：保存設定，不上傳字體`

### B-roll／剪輯提示

- 這一章用實際游標操作，不要把表單輸入全部剪成快轉；每個 tab 至少完整展示一次。
- 螢幕錄影前先把示範圖片重新命名為 `demo-*.png`，檔案視窗只開示範資料夾。
- 本機字體權限畫面若未取得正式 readback，改用 `PENDING｜local font permission` 卡，不能剪掉詢問後說成已列出。
- 內容過長時保留 warning，讓觀眾看見 auto-fit／maxLength 的安全網；不要用剪輯遮住問題。

### 證據／pending 標籤

`拍攝 gate：final UI IA、四 variant 同步預覽、圖片構圖、字體設定、module 微調、預設組合刷新 readback。`

`PENDING｜本章各項操作以現場瀏覽器成品與 console 狀態為準。`

---

## 章 9｜PNG／JPG、目前／全部匯出與瀏覽器本機保存

**時間碼：15:10–17:20（2 分 10 秒）**

### 畫面動作

1. 切到 `匯出` tab，顯示格式選擇 `PNG（最清晰）` 與 `JPG（檔案較小）`。
2. 先選 PNG，顯示目前變體檔名，例如 `demo-brand-20260912-ig-feed-one-guest.png`，按 `下載目前版型`。
3. 再按 `下載全部 4 張`，用檔案視窗顯示四個不同 variant ID 的 PNG；明確展示四個可追溯檔案。
4. 改選 JPG，重做目前與全部的匯出，顯示 `.jpg` 檔名與實際檔案。
5. 以瀏覽器內的結果卡或幕後 verifier 顯示每個圖片的實際寬高，四個輸出都要對上各自 Frame 尺寸。
6. 刷新瀏覽器並顯示內容、調整、字體與圖片構圖回來；再顯示清除瀏覽資料會讓本機資料消失的提示。

### 逐字旁白

> 「匯出時，PNG 適合需要清晰度的情況，JPG 則是檔案較小的選項。下載目前只輸出目前選到的 variant；下載全部會產生四個明確檔案，每個檔名帶有示範日期與 variant ID。錄製時要真的在檔案視窗看到檔案，並用圖片的實際寬高確認它等於對應 Frame，不只看下載按鈕有沒有跳 toast。
>
> 這個工具是瀏覽器本機工具。文字、選到的 variant、微調與字體設定放在 localStorage；使用者上傳的圖片 blob 放在 IndexedDB，頁面只保存鍵與構圖資訊。重新整理可以把資料還原，但換電腦、換瀏覽器設定，或清掉瀏覽資料，就要重新填寫與上傳。這不是雲端資料庫，也不是多人同步。
>
> 這個邊界反而很重要：素材不會因為你按下載就自動上傳給別人；但也不能把本機保存誤解成備份。需要長期保留時，請把已核准的輸出檔另行保存，並確認裡面沒有不該分享的內容。」

### 螢幕字卡

`PNG／JPG`　`下載目前版型`　`下載全部 4 張`

`四個檔案／四個 variant`

`localStorage：設定｜IndexedDB：圖片｜不含雲端同步`

### B-roll／剪輯提示

- 檔案視窗只顯示四個虛構檔案；不要拍完整下載資料夾。
- 實際尺寸卡可顯示 `1080×1350`、`1080×1920`，但不顯示任何真實檔案 key。
- 刷新前後做左右 split-screen；清除資料只拍提示，不要真的刪除觀眾工作區的資料。

### 證據／pending 標籤

`拍攝 gate：PNG／JPG 實際檔案、目前／全部數量、檔名、四個 exact dimensions 與 refresh readback。`

`PENDING｜未看到下載檔案與尺寸讀回前，只能說按鈕可見，不能說匯出完成。`

---

## 章 10｜驗證不是看起來正常：瀏覽器成品與 Figma overlay／difference

**時間碼：17:20–19:25（2 分 05 秒）**

### 畫面動作

1. 顯示一張驗證面板，分成「結構證據」與「成品證據」。
2. 結構區顯示 source package validator、單元測試、build 與 requirements checklist；幕後指令只以結果卡呈現。
3. 成品區逐項拍：桌面瀏覽器、四個 variant 的零 warning、最長合理文字、直式／橫式照片、拖曳、module、預設組合、PNG／JPG、手機 390px 單欄與 console 無錯誤。
4. 顯示 Figma full-frame export 與產出 PNG 的 side-by-side，再切換 50% overlay 與 difference；最後由人眼逐張勾選字體、換行、裁切、mask、opacity、效果、module 相對位置與留白。
5. 顯示三輪修正規則：每輪列出不過項目、修正、重跑；同方向連續兩次失敗就停下找根因。

### 逐字旁白

> 「驗證要分兩層。結構證據可以告訴我們 manifest 的 schema、檔案、命名、PNG IHDR 尺寸、欄位與 geometry 是否合理；測試與 build 可以告訴我們引擎的計算沒有直接報錯。但這些都不是成品本身，不能回答文字有沒有截斷、照片裁切是否合理，或畫面與 Figma 是否真的對得上。
>
> 所以我在實際瀏覽器裡逐個填入最長的合理內容，確認四個 variant 的 warning 都是零；再測直式與橫式照片、拖曳構圖、module、微調、預設組合、PNG 和 JPG，並在 390px 寬度檢查預覽是否改成單欄、沒有水平捲動。console 也要保持乾淨。這些是畫面與行為的證據，不是輸入檔的推論。
>
> 有 Figma Frame 時，再把每個 Frame export 和對應輸出 PNG 做 side-by-side、百分之五十 overlay 與 difference。最後仍然由人逐張看字體、換行、裁切、mask、opacity、效果、module 位置與留白。overlay 是輔助證據，不是 pixel identity 的保證。只要 Figma E2E、成品目檢或人類 completeness／fidelity gate 還沒有 evidence，我會誠實寫『已製作但未驗證』，而不是用一張代表頁或一個 PASS 數字代替整份成品。」

### 螢幕字卡

`結構 PASS ≠ 成品 PASS`

`每個 variant：瀏覽器實填 → 實際輸出 → Figma overlay／difference → 人眼驗收`

`最多 3 輪；同方向兩次失敗先找根因`

### B-roll／剪輯提示

- overlay 畫面使用虛構 Frame export；若真實對照還沒有完成，畫面必須標 `PENDING`，不能剪成綠色 PASS。
- warning、console 與手機畫面都拍成可讀大小，不要用大量縮圖塞在同一張畫面。
- 驗收清單最後保留 reviewer 欄位與日期，等拍攝時填寫。

### 證據／pending 標籤

`拍攝 gate：完整瀏覽器成品、四個輸出、Figma export、50% overlay／difference、人眼 completeness／fidelity。`

`PENDING｜目前沒有本次新 Frame 的完整 Figma E2E readback，不宣稱 fidelity 已通過。`

---

## 章 11｜Sites 權限與 runtime credential boundary

**時間碼：19:25–20:50（1 分 25 秒）**

### 畫面動作

1. 在 Sites 設定頁顯示新 Site 的預設存取範圍為私人；只保留虛構站名與「只有建立者登入後可見」的狀態。
2. 顯示「改成指定成員／工作區／公開」的設定位置，但不實際改成公開；旁邊放 `需要明確同意` 字卡。
3. 用左右圖說明：左邊 Codex 建置／更新期間可讀取 Figma；右邊已部署 Site runtime 不接受 Figma link、不保存 Figma credential。
4. 檢查 prompt、source package、前端程式與影片畫面，顯示沒有 token、密碼或私密 URL。
5. 以 live URL、Site version、access scope、瀏覽器畫面四格 readback 結尾。

### 逐字旁白

> 「Sites 的權限和 Skill 的公開性是兩條線。新 Site 預設可以是私人，只有建立者登入後看得到；要分享給指定成員、工作區或公開使用，必須在設定裡明確改存取範圍，而且先取得內容負責人的同意。GitHub repo 公開，不代表生成 Site 自動公開；私人 Site 也不等於內容已完成或已交付。
>
> 再看 runtime credential boundary。Figma link、MCP 與 source package 只在 Codex 的建置或更新工作期間使用；部署後的靜態 Site 不在 runtime 讀 Figma，也不保存 Figma credential。prompt、manifest、前端程式和錄影畫面都不能放 token、密碼或私密連結。
>
> 最後要把 live URL、版本、存取範圍和實際頁面一起讀回。若只看見 Sites 編輯器裡的預覽，或只看見一個網址，還不能說部署已完成。這一格沒有證據，就保留 PENDING。」

### 螢幕字卡

`Site 權限要明確設定`

`建置可讀 Figma；runtime 不讀 Figma、不存 credential`

### B-roll／剪輯提示

- Sites 權限畫面遮罩帳號、workspace 名稱與任何實際網址，只留下權限選項。
- 不要錄製 token 輸入、瀏覽器密碼管理器或剪貼簿內容。
- 右側 runtime 圖示刻意不放任何登入或 Figma 連線按鈕。

### 證據／pending 標籤

`拍攝 gate：Sites access scope、保存版本、live URL、實際 runtime 頁面與 credential scan。`

`PENDING｜未完成 live readback 前，不宣稱私人部署或公開部署完成。`

---

## 章 12｜常見失敗、Issue 回報與貢獻方式

**時間碼：20:50–22:00（1 分 10 秒）**

### 畫面動作

1. 用紅色停損卡快速輪播失敗情況：
   - 沒有 `/design/` 或缺少 node-specific ID。
   - 沒權限、節點不存在、目標不是 Frame。
   - `field:` 不是 TEXT、ID 碰撞、備份層被納入。
   - 原始圖片／SVG 超過涵蓋上限、只剩臨時網址或授權不明。
   - 字體不可用、文字 warning、照片貼邊或輸出尺寸不符。
   - existing Site identity 不明，或只有預覽沒有 live readback。
2. 開 GitHub 新 Issue 表單，顯示去識別化回報欄位：版本／commit、瀏覽器、重現步驟、預期／實際、錯誤畫面、validator 結果。
3. 顯示 GitHub 網頁的 Fork／編輯／Pull Request 流程；不拍命令列。

### 逐字旁白

> 「遇到問題先停在正確的 gate。缺 node-specific Frame 就補來源；權限、Frame 身分、命名碰撞與資產涵蓋，分別回到對應 gate；字體、warning、裁切或尺寸不符，就回到來源規格或 config。unknown 要留在報告裡，不用替代圖假裝通過。
>
> 回報 issue 時，附版本或 commit、瀏覽器、最小重現、預期／實際、去識別化截圖與 verifier 結果。Figma URL、file key、node ID、帳號、照片與 credential 全部遮罩，不要貼進 issue、prompt 或附件。若要貢獻修正，可從 GitHub 網頁 Fork、編輯、補測試說明，再送 Pull Request，並寫清楚變更範圍與 pending 項目。
>
> 同方向連續兩次修不好，就換路徑找根因；第三輪仍不過，附上失敗項目與成品截圖，不宣稱完成。對開源工具來說，可重現的 unknown 比不可重現的 PASS 更有價值。」

### 螢幕字卡

`停在正確 gate`　`最小重現`　`遮罩 credential`　`附 verifier 結果`

### B-roll／剪輯提示

- Issue 表單只填虛構版本與示範錯誤；不要按下真正的公開送出。
- Pull Request 畫面停在草稿或預覽狀態，除非拍攝日已有正式 review readback。
- 失敗清單每項最多 1.2 秒，搭配紅色「停下」音效，避免變成嚇人的快速字海。

### 證據／pending 標籤

`已讀回：失敗處理原則依 Skill contract。`

`PENDING｜公開 repo 的 issue／PR 設定與維護者回應，以拍攝當日 readback 為準；repo 公開狀態已讀回。`

---

## 章 13｜收尾：把下一次工作交給可驗證的來源

**時間碼：22:00–22:30（30 秒）**

### 畫面動作

1. 回到章 1 的完成品，重播四卡預覽與四個下載檔案各 1 秒。
2. 顯示三個行動：準備 Frame、確認五種命名、跑完整驗收。
3. 最後一格顯示 `腳本完成 ≠ Codex UI Skill readback／Figma 真實 Frame E2E／Sites 正式部署／影片已錄製、剪輯與上架`。

### 逐字旁白

> 「總結一下：固定版型、可編輯欄位、可追溯 source package，才是這個工作流的核心。你可以先準備一個有權使用的 Figma Design Frame，確認五種 naming contract，再在 Codex 桌面 App 要求需求 readback。公開 repo 已經可以匿名讀取，default branch 是 main，release tag 是 v0.1.0，clean install 與 23/23 tests 也已通過；但 Codex UI 下一個 task 的 Skill readback、真實 Figma Frame E2E、瀏覽器成品與 Sites 權限，仍要在對應畫面讀回後才能改成通過。記得，腳本完成不等於 Codex UI Skill readback、Figma 真實 Frame E2E、Sites 正式部署或影片已錄製、剪輯與上架。」

### 螢幕字卡

`準備 Frame` → `確認命名` → `驗證成品` → `再決定部署`

### B-roll／剪輯提示

- 用開場相同的完成品鏡頭形成 result-first loop。
- 最終狀態句至少停留 3 秒，字幕完整顯示，不用音樂蓋過旁白。

### 證據／pending 標籤

`PENDING｜Codex UI 下一個 task Skill readback、Figma 真實 Frame E2E、Sites 正式部署、影片錄製、剪輯與上架均須另行取得證據。`

---

# Demo data 完整表

以下資料只用於本片虛構示範；錄製者可替換為同等匿名資料，但不可帶入真實客戶、個人或未公開活動。

| 類別 | 欄位 | 示範值 | 顯示規則 |
| --- | --- | --- | --- |
| 內容 | 系列標籤 | `每週設計直播／LIVE` | 固定元素，不進表單或依 Frame 合約確認 |
| 內容 | 活動名稱 | `把複雜的事，說成好懂的事` | 最多兩行；展示 auto-fit |
| 內容 | 一句話說明 | `從一個問題開始，找到可行的下一步` | 兩行內 |
| 時間 | 日期 | `2026-09-12` | 由日期欄位格式化 |
| 時間 | 開始時間 | `20:00` | 由時間欄位格式化 |
| 內容 | CTA | `直播連結與回放資訊見說明欄` | 選填但保留安全長度 |
| 風格 | 強調色 | `#D85C3A` | 只用單一示範色 |
| 主持人 | 姓名／職稱 | `示範主持人`／`內容策劃` | 虛構人物 |
| 來賓 1 | 姓名／職稱 | `示範來賓 A`／`品牌設計師` | 虛構人物 |
| 來賓 2 | 姓名／職稱 | `示範來賓 B`／`內容編輯` | 虛構人物，僅兩位來賓變體顯示 |
| 圖片 | 主持人檔名 | `demo-host.png` | 需有錄製權利確認 |
| 圖片 | 來賓檔名 | `demo-guest-a.png`、`demo-guest-b.png` | 需有錄製權利確認 |
| 變體 | 版型 ID | `ig-feed-one-guest`、`ig-feed-two-guests`、`ig-story-one-guest`、`ig-story-two-guests` | 四個穩定 ID，與 config 對齊 |
| 尺寸 | 版型尺寸 | `1080×1350`、`1080×1920` | 每個 Frame 尺寸即輸出尺寸 |
| 匯出 | 檔名樣板 | `demo-brand-20260912-{variant}.png` | 不含真實帳號或路徑 |

# 匿名化與 credential 遮罩規則

- 人名、品牌名、日期、活動名、來賓資料、照片與網址都使用本稿示範值或明確虛構值。
- Figma file key、node ID、分享成員、帳號 email、workspace 名稱、Site URL、branch 私有名稱與本機絕對路徑全部遮罩；可用 `<file-key>`、`<node-id>`、`<site-url>` 等佔位字。
- 任何 token、密碼、cookie、API key、access code、瀏覽器密碼管理器、剪貼簿內容與環境變數都不入鏡、不放字幕、不放 source package。
- 拍攝前關閉通知、聊天、雲端硬碟同步提示、瀏覽器自動填入、私人分頁與檔案預覽；錄音前清空桌面與下載資料夾中無關檔案。
- issue／PR 範例只放去識別化錯誤；真實 Figma export、照片與素材授權證據不得上傳到公開 issue。
- 影片描述放正式公開 repo URL、已確認的公開文件與通用流程；目前 URL 已 verified，拍攝日若匿名 readback 異常才改用 `PENDING`，不上架私人連結。

# 錄製檔命名與資料夾

使用虛構片名代號 `psb-demo`，不要用個人姓名、客戶名稱或私人專案代號。

```text
psb-demo/
├── 01-screen/
│   ├── psb-demo-01-result-ui-v01.mov
│   ├── psb-demo-02-figma-gate-v01.mov
│   ├── psb-demo-03-codex-readback-v01.mov
│   ├── psb-demo-04-site-operation-v01.mov
│   └── psb-demo-05-validation-v01.mov
├── 02-voice/
│   ├── psb-demo-voice-ch01-take01.wav
│   └── psb-demo-voice-ch13-take01.wav
├── 03-assets/
│   ├── demo-host.png
│   ├── demo-guest-a.png
│   ├── demo-guest-b.png
│   └── psb-demo-fallback-card.png
├── 04-exports/
│   ├── demo-brand-20260912-ig-feed-one-guest.png
│   ├── demo-brand-20260912-ig-feed-two-guests.png
│   ├── demo-brand-20260912-ig-story-one-guest.png
│   └── demo-brand-20260912-ig-story-two-guests.png
├── 05-subtitles/
│   └── psb-demo-zh-Hant-v01.srt
└── 06-qa/
    ├── psb-demo-evidence-log.md
    └── psb-demo-upload-checklist.md
```

命名規則：`<片名代號>-<章節或畫面>-<版本>-<take>.<副檔名>`。每次重錄只增加版本或 take，不覆蓋原始檔；正式交片前保留原始錄音、原始螢幕檔、剪輯工程與最後輸出。

# Shot list

| Shot | 內容 | 證據要求 |
| --- | --- | --- |
| S01 | 精修後 UI 滿版 | final UI readback、`拍攝 gate` |
| S02 | `目前版型`／`全部版型` 切換 | 四卡、變體名稱、尺寸 |
| S03 | PNG 目前／全部下載 | 實際四檔、檔名可追溯 |
| S04 | GitHub 公開 repo | 正式 URL、branch/tag、公開狀態 |
| S05 | Codex 安裝對話與下一個 task | 安裝回覆、Skill 可用性 readback |
| S06 | Figma 四個 Frame | Frame type、尺寸、權限 |
| S07 | node-specific URL | `/design/` 與單一 node id，個資遮罩 |
| S08 | 命名 contract close-up | 五種前綴與 kebab ID |
| S09 | naming proposal | exact node ID、確認 action、readback |
| S10 | requirements readback | 固定、可變、variant、module、字體、匯出 |
| S11 | source package | manifest、reference、variants、assets |
| S12 | validator 結果卡 | 結構結果，不拍 CLI 教學 |
| S13 | new Site 建立 | generated Site identity、版本 |
| S14 | existing Site diff | changed／unchanged variant、版本變更 |
| S15 | `內容` tab 操作 | 文字、日期、時間、CTA |
| S16 | `素材` tab 操作 | 上傳、拖曳、縮放、置中、移除 |
| S17 | `調整` tab 操作 | layer 與 module、重設 |
| S18 | 字體操作 | 安全堆疊；local font 權限若有需 readback |
| S19 | 預設組合 | 儲存、刷新、套用 |
| S20 | PNG／JPG | 目前／全部、檔名、尺寸 |
| S21 | 本機保存 | refresh 還原、資料邊界說明 |
| S22 | 驗證清單 | browser、console、mobile、warning |
| S23 | Figma 對照 | side-by-side、50% overlay／difference |
| S24 | Sites 權限 | private scope、live URL、runtime boundary |
| S25 | issue／PR | 去識別化欄位、不可送出真實資料 |
| S26 | 收尾 loop | 開場結果再現、誠實狀態句 |

# B-roll 清單

- Figma 圖層樹、Frame 邊界、尺寸標尺與四個變體的縮圖。
- GitHub 公開 repo 的檔案樹、Skill 名稱與 references 目錄。
- Codex 桌面 App 的安裝對話、下一個 task 的 Skill 可用性、需求 readback 與確認 gate。
- source package 目錄的平移鏡頭；檔名全為虛構 ID。
- 「停下」紅色字卡：缺 URL、沒權限、不是 Frame、命名碰撞、asset coverage 不完整、字體未知、warning、Site identity 不明。
- `內容`、`素材`、`調整`、`匯出` 四個 tab 的滑鼠操作 close-up。
- 直式與橫式照片在同一個裁切框中的差異。
- 預覽畫布上拖曳照片、模組滑桿、重設按鈕與預設組合刷新。
- PNG／JPG 檔案視窗、尺寸 readback 卡與四檔下載結果。
- 手機 390px 寬度的單欄預覽與無水平捲動證據。
- Figma export、產出 PNG 的 side-by-side、50% overlay／difference 與人工勾選。
- Sites private scope、runtime 不讀 Figma 的圖示化流程。
- GitHub issue／Pull Request 草稿，遮住所有私人欄位。

# 字幕詞彙表

字幕第一次出現時保留中英對照，之後固定使用下列寫法，不要自行改成簡體或混用同義詞。

| 詞彙 | 固定字幕寫法 | 口語說法備註 |
| --- | --- | --- |
| Skill | `Skill` | 說「工作規則」時仍保留 Skill 名稱 |
| template | `template／模板` | 指編輯器引擎，不等於生成 Site |
| generated Site | `generated Site／生成 Site` | 指這一次來源產出的工具實例 |
| source package | `source package／來源包` | 不翻成「素材夾」 |
| Design Frame | `Design Frame／設計 Frame` | 不用截圖代替 |
| naming contract | `naming contract／命名合約` | 五種前綴固定保留半形符號 |
| readback | `readback／回讀` | 指畫面、檔案或設定的再次確認 |
| variant | `variant／變體` | ID 保留原文 |
| module | `module／模組` | 指成組移動／縮放 |
| field | `field／欄位` | 只對應真正可編輯 TEXT |
| localStorage | `localStorage` | 不翻成雲端保存 |
| IndexedDB | `IndexedDB` | 圖片本機保存位置 |
| overlay／difference | `overlay／difference 對照` | 不是 pixel identity 保證 |
| private Site | `私人 Site` | 存取範圍需另行 readback |
| credential boundary | `credential boundary／憑證邊界` | 不說「完全安全」 |
| pending | `PENDING／待驗證` | 未有證據時固定保留 |
| pass | `PASS／通過` | 只在對應證據存在時使用 |
| issue | `issue／問題單` | 包含重現資料與遮罩規則 |
| pull request | `Pull Request／合併請求` | 需附驗證範圍 |

# YouTube 章節時間戳

```text
00:00 先看完成品：四個變體的海報 Site
00:40 痛點與成果：一次建立、每週只改內容
01:50 從 GitHub 安裝 Skill
03:20 node-specific Figma Design Frame gate
05:00 五種 naming contract 與需求 readback
06:50 source package 與建立 new Site
08:50 更新既有 Site與 stable-ID diff
10:30 精修後 UI：內容、素材、調整、字體與預設組合
15:10 PNG／JPG、目前／全部匯出與本機保存
17:20 驗證、Figma overlay／difference 與人工 acceptance
19:25 Sites 權限與 runtime credential boundary
20:50 常見失敗、issue 回報與貢獻
22:00 收尾：從來源到可驗證輸出
```

# YouTube 標題候選

1. `會用 Figma 就能做海報工具？用 Codex 建立可重複使用的 Site`
2. `一個 Figma Design Frame，變成四種海報輸出：Codex + Sites 完整流程`
3. `別再每週重排海報：從 Figma 命名、來源包到 PNG／JPG 驗證`

# 縮圖方向

1. **方向 A｜一個 Frame → 四個輸出**：左側是 Figma Frame 與五種命名，右側是四張海報預覽；中央大字「一次建立，每週只改內容」。
2. **方向 B｜四個控制 tabs**：完成品海報作背景，前景放 `內容／素材／調整／匯出` 四個 UI 卡，大字「固定版型，快速輸出」。
3. **方向 C｜先驗證，再部署**：左側橘色 `PENDING` 的 Frame gate，右側綠色但有證據標記的 PNG 對照；大字「看起來完成，不等於驗證」。

禁止在縮圖寫「一鍵像素級還原」「自動公開」「完全不需要檢查」等無法由成品證據承諾的句子。

# YouTube 描述草稿

這支影片示範如何把 Figma 的固定版型整理成可重複使用的海報 Site：先用 node-specific Design Frame 作為唯一 build source，再用 `variant:`、`field:`、`image:`、`fixed:`、`module:` 建立可追溯的命名合約。接著由 Codex 桌面 App 整理 source package、建立或更新 generated Site，最後在瀏覽器實填、匯出 PNG／JPG，並用 Figma export 做 overlay／difference 與人工驗收。

影片案例完全使用虛構的「示範品牌／每週設計直播」資料，包含 1080×1350 與 1080×1920 的四種 variant、主持人與兩位示範來賓。你會看到內容、素材、調整、匯出四個控制 tabs、目前／全部預覽、圖片構圖、字體安全堆疊、預設組合、localStorage／IndexedDB 本機保存、私人 Sites 與 runtime credential boundary。

重要提醒：截圖、預覽、測試數或看似成功的按鈕都不能取代實際成品與 live readback。影片中標記 `PENDING` 的 Codex UI 下一個 task readback、Figma E2E、Sites URL、輸出檔案或 overlay，需要在拍攝日取得對應證據後才能改成 PASS。不要在公開影片、Issue 或 source package 放入 token、密碼、私人 URL 或未授權素材。

公開 repo：`https://github.com/lotushj1/poster-studio-builder`（default branch：`main`；release tag：`v0.1.0`；匿名 README／repo 可讀；Skill Installer clean install、23/23 tests 已通過）

# 置頂留言草稿

這支影片的判斷順序是：先確認 Figma Design Frame，再確認五種命名，接著回讀 source package，最後才驗證瀏覽器成品與 Sites 權限。若你只拿到截圖、缺 node-specific URL、沒有資產授權，請先停在對應 gate，不要把預覽當成完成。

公開 repo 已通過匿名讀取、main／v0.1.0 與 clean install／23/23 tests readback；若要在其中建立去識別化 issue，附版本、瀏覽器、最小重現、預期／實際與 verifier 結果，並遮掉 file key、node ID、帳號、私人 URL、照片與所有 credential。影片中的示範資料都是虛構值，請換成你有權使用的來源。

# CTA

影片口播 CTA：

> 「先準備一個你有權使用、而且可以讀回的 Figma Design Frame；再確認五種命名前綴與需求清單。公開 repo 已經可匿名讀取，default branch 是 main，release tag 是 v0.1.0；把 URL 貼給 Codex 桌面 App，請它安裝 Skill，再於下一個 task 要求 readback。看到完整來源、成品與權限證據，再決定是否部署。若遇到問題，請等 issue 入口可用後，用去識別化資料回報，讓下一個人可以重現。」

描述欄 CTA：

`準備好 node-specific Frame → 讀回命名與 source package → 在瀏覽器驗證四個 variant → 取得 Sites 與輸出檔案 readback → 再分享或部署。`

# 素材清單

## 必要來源與畫面

- 已驗證 GitHub 公開 repo：`https://github.com/lotushj1/poster-studio-builder`、default branch `main`、release tag `v0.1.0`、匿名 README／repo 可讀、Skill Installer clean install、23/23 tests。
- Codex 桌面 App 的安裝對話與下一個 task 的可用性畫面。
- 虛構 Figma 檔案、四個 Design Frame、五種命名 contract 與需求 readback。
- 完整 source package：manifest、Frame export、每個 variant export、圖片／SVG 本地資產。
- generated Site 的 final UI、四卡預覽、控制 tabs、匯出畫面與下載結果。
- existing Site 的精確 identity、diff、版本與未變更 variant 回歸畫面。
- Sites 保存、私人權限、版本、live URL 與實際 runtime readback。
- source package validator、測試、build、瀏覽器實填、手機寬度與 console 結果卡。
- Figma export 與每個輸出 PNG 的 side-by-side、50% overlay／difference。

## 必要示範資產

- `demo-host.png`、`demo-guest-a.png`、`demo-guest-b.png`：已確認可錄製授權的虛構示範圖。
- `demo-brand-20260912-*.png` 與 `*.jpg`：四個 variant 的實際輸出。
- `psb-demo-zh-Hant-v01.srt`：完整繁中字稿，保留英文 ID 與 PENDING 字樣。
- 橘色 `PENDING`、綠色 `PASS`、紅色 `停下` 狀態卡。
- 開場與收尾相同的完成品 hero frame。

## 錄音與剪輯資源

- 安靜、乾燥的繁中旁白錄音環境；另備一條無旁白的乾淨螢幕音軌。
- 滑鼠點擊、鍵盤輸入、下載完成與停損提示的低音量音效。
- 不蓋過文字與尺寸的背景音樂；驗證段降低音樂音量。
- 螢幕錄影游標放大、字體放大、瀏覽器與 Figma 只使用示範工作區。

# 錄音／剪輯／上片 QA

## 錄音前

- [ ] 用 final UI 實際畫面逐字 readback `內容／素材／調整／匯出`、`目前版型／全部版型` 與下載按鈕名稱。
- [ ] 拍攝日重新確認正式 GitHub repo 可匿名讀取、default branch `main`、release tag `v0.1.0`；若讀回異常，畫面才標 PENDING，不用本機畫面替代。
- [ ] 確認 Figma Frame 的權限、Frame type、四個尺寸、node-specific URL 與命名 readback；所有未知項目列在 evidence log。
- [ ] 確認示範人物、日期、品牌、圖片、輸出檔名與網址全為虛構或已獲錄製授權。
- [ ] 關閉通知、聊天、私人分頁、密碼管理器與自動填入；清理桌面與下載視窗。
- [ ] 建立一份拍攝 gate 表，標出 final UI、source package、new Site、existing Site、export、overlay、Sites scope 的負責人與證據位置。
- [ ] 只預備必要示範資料；不要在為了展示流程而新增真實資料。

## 錄影中

- [ ] 00:00–00:40 直接展示精修後 UI、目前／全部預覽、四個 tabs 與多檔輸出。
- [ ] 每個章節都有可讀時間碼、字卡、B-roll 和 evidence／PENDING 角標。
- [ ] 五種命名前綴全部清楚出現，錯誤命名有 proposal 與停損畫面。
- [ ] new Site 與 existing Site 分開，existing Site 有精確 identity、diff、版本與重新部署授權台詞。
- [ ] 不把 CLI 當觀眾步驟；幕後 verifier 只拍短結果卡。
- [ ] 不在沒有 live readback 時說「已部署」「已公開」「已更新」「像素一致」或「全部驗證通過」。
- [ ] 下載目前與全部都拍到實際檔案，不只拍按鈕或 toast。
- [ ] 字體權限、本機保存、credential boundary 與清除資料限制都有旁白與字卡。

## 剪輯後

- [ ] 頭尾形成 result-first loop，開場與收尾成果畫面一致但不重複整段旁白。
- [ ] 章節時間碼連續，總長仍為 22:30 ± 20 秒；快轉不影響 UI 名稱與證據閱讀。
- [ ] 字幕為繁體中文；英文 ID、前綴、檔名、PENDING、PASS 保留半形字元。
- [ ] 所有私密字串、個人資料、token、密碼、檔案路徑、瀏覽器自動填入與未授權素材已遮罩或移除。
- [ ] 所有「已讀回／拍攝 gate／PENDING」標籤與實際 evidence log 一一相符。
- [ ] 成品 UI、source package、Figma export、下載檔、Sites scope 與 overlay 畫面沒有用代表頁代替完整範圍。
- [ ] 音量、游標、字卡、字幕、畫面裁切與手機觀看都做一次人工目檢。

## 上片前

- [ ] 標題、縮圖、描述、置頂留言、章節時間戳與 CTA 互相一致。
- [ ] 用無登入視窗重新確認公開 repo URL、`main`、`v0.1.0` 與 README／repo 可讀；若拍攝日 readback 異常，描述與置頂留言才標 PENDING。
- [ ] 影片資訊沒有私人 Figma URL、Site URL、帳號 email、commit 私有資訊或 credential。
- [ ] 下載字幕檔與影片在獨立播放器中重看；搜尋一次所有敏感名稱禁用項目與課內語彙。
- [ ] 上片後只宣稱影片已發布；不要把影片畫面自動升級為 Figma E2E 或 Sites 部署證據。

# 最終狀態欄

`腳本完成不等於 Codex UI Skill readback、Figma 真實 Frame E2E、Sites 正式部署或影片已錄製、剪輯與上架。`
