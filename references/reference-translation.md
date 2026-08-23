# Figma Frame 轉成可驗收規格

Figma Design Frame 是固定版型的來源正本。這份文件描述如何把 MCP 讀到的 Frame、Screenshot、node properties 與 assets 翻成 manifest 與需求確認單；不能只看一張圖猜尺寸或手寫另一套版型。

## 來源與目標先記清楚

```text
來源：Figma Design URL、fileKey、nodeId、Frame name、access readback
變體：variant:<id>、Frame node ID、輸出寬高、reference PNG
目標：結構一致／盡量貼近 Figma export
MCP 證據：get_design_context、命名 audit／proposal confirmation／exact-ID readback、get_metadata（orientation）、download_assets、必要時 properties-extraction 唯讀 use_figma；核准後 name-only rename 依 [figma-naming.md](figma-naming.md) 另行記錄
資產：完整 Frame export、raw images、SVG、來源 node ID、下載時間、本地 path
```

「盡量貼近 Figma export」仍不是 pixel identity 保證。缺少字體、權限、原始資產、未支援效果或 MCP coverage 時，保留未知並停止。

## 設計規格表

| 規格面向 | 從 Figma／manifest 記錄什麼 | 驗收問題 |
| --- | --- | --- |
| Frame／網格 | Frame 精確寬高、Section 關係、四邊邊界、欄數、對齊線 | 每個 variant 的 PNG 尺寸是否等於 Frame？主要元素是否沿同一組基準線？ |
| 命名／層級 | `variant:`、`field:`、`image:`、`fixed:`、`module:`、node IDs、z-order、祖先 | 名稱與 ID 是否穩定且不重複？資訊順序是否和 Figma 一致？ |
| 文字 | 真實 TEXT node、characters、segments、family、style、size、line-height、letter-spacing、alignment、color | 文字是否留在 canvas／HTML 可編輯？長中文、數字與標點是否 text-fit？ |
| 色彩／樣式 | fills、strokes、opacity、effects、masks、blend、`mono-v1` 或指定 design-system token | 文字對比、透明度、遮罩與效果是否保留？不支援的效果是否已記錄？ |
| 圖像／人物 | 原始圖片或 SVG 資產、node type、fit、crop、focal、border、module ancestry | 是否使用實際下載資產？不同照片比例能否維持同一構圖語言？ |
| 間距／細節 | 相對／絕對 x/y/w/h、rotation、模組邊界、圓角、分隔線與留白 | 50% overlay／difference 是否在可接受範圍？是否有裁切或重疊？ |
| 字體 | family/style、可用性、授權、fallback、Figma 與輸出環境差異 | 字體是否可用且有授權？若不同電腦 fallback，是否明確標註限制？ |

## 從規格到 config 的映射

- 每個 `variant:<id>` 產生一個完整 `Variant`，`variant.size` 等於 Frame 尺寸。
- `field:<id>` 的真實 TEXT node 產生可編輯 `text`／`textarea` field 與 `{fieldId}` layer；不要以 screenshot 文字代替。
- `image:<id>` 產生 `image` field 或 asset-backed image layer；保留 fit、focal、zoom 與本地素材路徑。
- `fixed:<id>` 產生不綁欄位的固定 layer；固定 logo／icon／向量使用下載資產。
- `module:<id>` 依同一 variant 的 layer IDs 產生 `modules`，照片、名字、頭銜一起移動／縮放，照片仍可個別構圖。
- Figma 的 hidden／unused layer 不寫進 config；故意 rasterize 的 subgroup 只作資產，manifest 要留 `rasterizationReason`。
- 欄位 `maxLength`、`maxLines` 與 `autoFit` 需依 Figma 尺寸和實際最長內容決定，不能以縮小預覽或 hidden overflow 當修正。

## 設計規格小卡

```text
Figma Frame：<variant:<id>>，<width>×<height>
來源／權限：<URL>，get_design_context=<passed>
命名狀態／證據：<compliant|verified|blocked>、manifest-contract audit、proposal confirmation、exact-ID metadata readback
目標：結構一致／盡量貼近 Figma export
網格與留白：
資訊層級：
可編輯欄位：field:<id>、image:<id>
固定與資產：fixed:<id>、local asset path
模組：module:<id> 與 layer IDs
字體：family/style、可用與授權證據
已知取捨：不支援效果、rasterize 範圍、fallback
驗收：PNG exact size、文字可編輯、50% overlay／difference、人工確認
```
