# config.ts 怎麼寫

`app/studio/config.ts` 匯出 `templateConfig: TemplateConfig`。完整型別在 `app/studio/types.ts`，動手前先讀一次；這份只講會影響決策的部分。
生產專案的 config 必須由 Codex 依通過驗證的 Figma source manifest 產生，不讓使用者手寫，也不能在沒有 Frame link 時拿模板範例冒充設計來源。範例 config（匿名固定版型海報，四個變體）只用來說明引擎能力。預設 `mono-v1` 是可辨識、可版本化的中性黑白編輯風格標準。

## Figma 命名到 config 的映射

- `variant:<id>` → `Variant.id` 與 `variant.size`；Frame 寬高就是輸出寬高。
- `field:<id>` → editable `text`／`textarea` field 與 `{fieldId}` TEXT layer。
- `image:<id>` → `image` field 或 asset-backed image layer；資產使用已下載的本地 path。
- `fixed:<id>` → 不綁欄位的固定 layer；不可用 CSS、手刻 SVG 或 AI 圖片重畫。
- `module:<id>` → 只存在自己 variant 的 `ModuleDef`；layerIds 必須指向同一 variant，照片、名字、頭銜保持相對關係。

manifest 內的 hidden／unused node 不進 config。Figma 的 fills、strokes、effects、masks、rotation、opacity 與 z-order 若引擎支援就轉成 layer properties；不支援的複雜 subgroup 才 rasterize，並把原因留在 manifest。`config.version` 在欄位、variant 或 schema 變更時加 1。

## 骨架

```ts
export const templateConfig: TemplateConfig = {
  id: "store-notice",        // 英文小寫與連字號；localStorage 的命名空間
  version: 1,                // 欄位結構有改就 +1，使用者瀏覽器裡的舊資料會被忽略
  name: "店家公告產生器",    // 標題列與檔名
  size: { width: 1080, height: 1080 },
  designSystem: {
    id: "mono-v1", label: "中性黑白編輯風格 v1",
    tokens: { ink: "#171717", paper: "#f7f6f2", muted: "#6d6a63", line: "#d8d5ce",
      accent: "#171717", accentInk: "#ffffff", preview: "#e8e5de" },
  },
  background: "#fff7ed",     // 純色、"{colorFieldId}" 或線性漸層物件
  fields: [...],             // 所有變體共用的欄位
  variants: [{ id: "default", label: "標準", layers: [...] }],
  fonts: { roles: {...}, suggested: [...], localCatalog: false },
  export: { format: "png", filename: "{name}-{date:YYYYMMDD}" },
  ui: { accent: "#171717", subtitle: "填好、按下載就好", designSystemId: "mono-v1" },
};
```

## 欄位（fields）＝ 表單上的輸入

型別：`text`、`textarea`、`image`、`color`、`select`、`date`、`time`、`number`、`toggle`。
共同：`id`（英文）、`label`（繁中）、`group`（表單分組標題，例如「內容」「時間」「來賓」）、`hint`、`placeholder`。

- text／textarea：`default`、`maxLength`（一定要給）
- image：`default` 可指向 `/assets/…` 當預設圖
- color：`default` 必填，`swatches` 給 3 到 6 個
- select：`options: [{ value, label }]`、`default`
- date：`default: "today"` 或 `"YYYY-MM-DD"`；time：`default: "HH:mm"`
- toggle：`default`，搭配 `visibleIf` 控制圖層顯示

變體專屬欄位放 `variant.fields`，共用的放 `config.fields`。所有欄位 id 不可重複。

## 圖層（layers）＝ 畫在圖上的東西，依序由下往上畫

共同：`id`、`label`（顯示在微調面板）、`x y w h`（畫布 px）、`opacity`、`rotate`、`visibleIf`、`adjustable`、`previewOnly`。

- `rect`：`fill`（顏色／`"{colorFieldId}"`／漸層）、`radius`、`stroke`、`shadow`。圓形 = `w === h` 且 `radius = w / 2`。
- `image`：`src` 固定 `"/assets/x.png"` 或綁定 `"{imageFieldId}"`；`fit: cover | contain`；`shape: rect | rounded | circle`；`radius`；`border`；`shadow`；`focalX / focalY / zoom`（固定素材的構圖）；`grayscale`；`placeholder`（預覽提示字）；`emptyFill`（沒圖時的底色）。
- `text`：`text`（可含 `{fieldId}`；日期 `{date:M月D日（ddd）}`；時間 `{time:HH:mm}`）、`font`（`{ role, size }` 或 `{ family, weight, size }`）、`color`（顏色或 `"{colorFieldId}"`）、`align`、`valign`、`lineHeight`（預設 1.35）、`letterSpacing`（em）、`maxLines`、`autoFit`（`true` 或 `{ min }`）、`stroke`、`shadow`、`background`（每行一個圓角色塊，做標籤或日期章）、`vertical`（直排）、`uppercase`。

### 綁定與格式

- 字串裡的 `{欄位id}` 會代入值；找不到的欄位代入空字串。
- 日期 token：`YYYY YY MM M DD D dddd`（星期五）`ddd`（週五）`d`（五）。時間：`HH H mm hh h A`（上午／下午）。
- 綁定的欄位全部是空的文字圖層：預覽顯示淡色的「[欄位名稱]」，匯出時不畫。所以選填欄位不需要額外處理。
- `visibleIf`：`"fieldId"`（有值才顯示）、`"!fieldId"`（沒值才顯示）、`"fieldId=value"`（select／toggle 的指定值）。

### 文字放不下怎麼辦（兩道保險）

1. 欄位 `maxLength` 擋輸入長度
2. 圖層 `maxLines` ＋ `autoFit: { min }` 讓引擎自動縮字到放得下；還是放不下會出現省略號，UI 會顯示警告

標題類一律給 autoFit；名字、頭銜這種短欄位也給（名字有長有短）。

### 可調項（adjustable）

`["fontSize", "color", "x", "y", "scale", "opacity", "letterSpacing", "lineHeight"]`
只開真的需要的：通常是主標的 fontSize／color、照片的 scale／x／y。開太多使用者會把版弄壞。

### 字體角色（fonts.roles）

```ts
fonts: {
  roles: {
    heading: { label: "標題字體", family: "Noto Sans TC", weight: 900, fallback: '"PingFang TC", "Microsoft JhengHei", sans-serif' },
    body: { label: "內文字體", family: "PingFang TC", weight: 500 },
  },
  suggested: ["Noto Sans TC", "jf open 粉圓 2.0", "GenSenRounded TW"],
}
```

圖層用 `font: { role: "heading", size: 88 }`。使用者在 UI 換字體是換整個角色，所有用這個角色的圖層一起換。模板預設 `fonts.localCatalog: false`，只顯示安全堆疊與直接輸入入口；使用者明確需要清單時才設 `true`，再依瀏覽器權限使用 `queryLocalFonts()`。
圖層的 font 不要再寫 `weight`（寫了會蓋掉使用者選的字重）；要特別粗細就另開一個角色。
`suggested` 只是挑選器的快速選項，電腦沒裝的不會顯示。

### 變體（variants）

- 人數不同、直式橫式不同 → 各自一個 variant、各自完整的 `layers`（共用圖層用陣列展開 `...topLayers`）
- `variant.size` 可覆蓋尺寸（同一工具同時出 1080 × 1350 與 1280 × 720）
- `variant.fields` 放這個變體才有的欄位（例如第二位來賓）
- 只有一個變體時 UI 不顯示切換器

### 模組（modules）

模組只存在於自己的 `variant`，不可跨變體共用 id。用 `moduleId` 把照片、名字、頭銜綁成一組，模組調整會以成員圖層的整體邊界中心套用 x、y、scale；照片 layer 的 focal／zoom 與個別調整仍然有效。

```ts
const guestModule = {
  id: "ig-feed-one-guest__guest1-module",
  label: "來賓模組",
  layerIds: ["ig-feed-one-guest__guest1-photo", "ig-feed-one-guest__guest1-name", "ig-feed-one-guest__guest1-title"],
  adjustable: ["x", "y", "scale"],
};

variants: [{
  id: "ig-feed-one-guest",
  label: "IG 貼文｜1 位來賓",
  modules: [guestModule],
  layers: [
    { id: "ig-feed-one-guest__guest1-photo", moduleId: guestModule.id, type: "image", src: "{guest1_photo}", ... },
    { id: "ig-feed-one-guest__guest1-name", moduleId: guestModule.id, type: "text", text: "{guest1_name}", ... },
    { id: "ig-feed-one-guest__guest1-title", moduleId: guestModule.id, type: "text", text: "{guest1_title}", ... },
  ],
}]
```

### 匯出（export）

`format: png | jpeg`、`quality`（jpeg 0 到 1）、`filename` 樣板：`{name}` `{date}` `{date:YYYYMMDD}` `{variant}` `{任一欄位id}`。UI 會下載目前選取變體；有多個變體時另提供「下載全部 N 張」，以多個明確檔案下載，不依賴 ZIP。

### ui

`accent`（介面強調色，不是海報的色）、`subtitle`（標題列副標）、`previewBackground`、`designSystemId`（與 `designSystem.id` 一致，方便驗收讀回）。

## 座標心法

- 先把畫布切成：上緣標籤區、標題區、資訊列、主體（照片或公告內容）、底部 CTA；每區給 y 與 h
- 左右留白統一（例如 80），文字盒 `w = 寬 − 160`
- 同一排多個人像：尺寸與間距用算的（3 個 290px 圓＋ 25 間隙 = 920）
- 重複的圖層用 TypeScript 常數與小函式產生（範例 config 的 `person()`），不要複製三份

## 三個片段

### 店家公告（單一變體，select 換標籤）

```ts
fields: [
  { id: "kind", type: "select", label: "公告類型", group: "內容", default: "closed",
    options: [{ value: "closed", label: "公休" }, { value: "hours", label: "營業時間異動" }, { value: "news", label: "新消息" }] },
  { id: "dateText", type: "text", label: "日期", group: "內容", default: "8/25（一）", maxLength: 20 },
  { id: "body", type: "textarea", label: "說明", group: "內容", maxLength: 60, placeholder: "兩三行以內" },
  { id: "note", type: "text", label: "補充（選填）", group: "內容", maxLength: 30 },
],
layers: [
  { id: "logo", type: "image", src: "/assets/logo.png", x: 80, y: 80, w: 160, h: 160, fit: "contain" },
  { id: "kindTag", type: "text", text: "{kind}", x: 80, y: 300, w: 920, h: 70, font: { role: "body", size: 40 },
    color: "#ffffff", background: { color: "#c2410c", paddingX: 24, paddingY: 10, radius: 999 }, letterSpacing: 0.08 },
  { id: "date", type: "text", text: "{dateText}", x: 80, y: 420, w: 920, h: 160, font: { role: "heading", size: 120 },
    color: "#1c1917", autoFit: { min: 64 }, maxLines: 1 },
  { id: "body", type: "text", text: "{body}", x: 80, y: 620, w: 920, h: 220, font: { role: "body", size: 44 },
    color: "#44403c", lineHeight: 1.5, maxLines: 3, autoFit: { min: 30 } },
  { id: "note", type: "text", text: "{note}", x: 80, y: 880, w: 920, h: 60, font: { role: "body", size: 30 }, color: "#78716c", visibleIf: "note" },
  { id: "footer", type: "text", text: "○○咖啡 · 台北市○○路 1 號 · 02-1234-5678", x: 80, y: 960, w: 920, h: 40,
    font: { role: "body", size: 26 }, color: "#a8a29e" },
]
```

### YouTube 封面（橫式，主標自動縮字，去背人像）

```ts
size: { width: 1280, height: 720 },
layers: [
  { id: "bg", type: "rect", x: 0, y: 0, w: 1280, h: 720,
    fill: { type: "linear", angle: 120, stops: [{ offset: 0, color: "#111827" }, { offset: 1, color: "#1f2937" }] } },
  { id: "portrait", type: "image", src: "{portrait}", x: 780, y: 60, w: 460, h: 660, fit: "contain", focalY: 1, placeholder: "上傳去背人像" },
  { id: "title", type: "text", text: "{title}", x: 70, y: 150, w: 690, h: 330, font: { role: "heading", size: 112 },
    color: "#ffffff", lineHeight: 1.15, maxLines: 3, autoFit: { min: 72 }, stroke: { color: "rgba(0,0,0,0.45)", width: 3 }, valign: "middle" },
  { id: "badge", type: "text", text: "{badge}", x: 70, y: 70, w: 400, h: 56, font: { role: "body", size: 34 }, color: "#111827",
    background: { color: "#facc15", paddingX: 20, paddingY: 8, radius: 10 }, visibleIf: "badge" },
  { id: "ep", type: "text", text: "EP.{episode}", x: 70, y: 590, w: 300, h: 60, font: { role: "heading", size: 44 }, color: "#facc15", visibleIf: "episode" },
]
```

### 多尺寸變體（同內容出直式與橫式）

```ts
variants: [
  { id: "ig", label: "IG 1080×1350", layers: igLayers },
  { id: "yt", label: "YouTube 1280×720", size: { width: 1280, height: 720 }, layers: ytLayers },
]
```

## 常見錯誤

- 忘了 autoFit／maxLines → 使用者多打幾個字就破版
- 圖層 font 寫了 weight 又希望使用者能換字重 → 拿掉 weight
- 用 AI 生圖做底圖再當固定素材 → 不要，除非使用者要求
- 改了欄位 id 沒有 version +1 → 使用者瀏覽器留著舊資料
- 固定素材放在 `app/` 用 import → 改放 `public/assets/` 用路徑
