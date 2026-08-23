# Figma manifest-contract 命名修復

這份流程只處理可存取的 Figma Design Frame。它在 `get_design_context` 成功後啟動，且必須在 source manifest、`config.ts`、模板安裝或 Site 建置前完成。截圖、參考圖片與 Frame export 可以作視覺證據，不能作為 layer naming 或 build source 的替代。

## 1. 何時進入 naming-repair mode

先用 `get_design_context` 讀到目標 Frame，再 audit **manifest-contract nodes**；只檢查會進入 manifest 或決定匯出邊界的節點，不要求每個內部 vector descendant 都有名稱。

- 命名已合規、語意穩定且無碰撞：直接通過 naming gate。
- 缺名、混用前綴、無意義的順序／數字 ID、重複 ID、角色不明或跨 variant 語意不一致：進入 naming-repair mode，不要立即結束工作流。
- naming-repair mode 會先產生 proposal 並等待使用者明確確認；在確認、寫入（若需要）與 readback 都完成前，generation gate 保持 `blocked`。
- 若一組內部向量會作為一個固定資產匯出，只需命名該 export-boundary ancestor 為 `fixed:<kebab-id>`；不必替每個向量 descendant 加上 manifest 名稱。

## 2. 命名合約與 audit 範圍

`<kebab-id>` 必須是語意明確、穩定的英文小寫 kebab-case。不要用 node 順序、顯示文字的整句、隨機 node ID 或 `text-2`、`frame-3`、`rectangle-12` 這類無意義數字名稱。角色與命名的對應如下：

| manifest-contract role | 節點條件 | 必須使用的名稱 | 判斷重點 |
| --- | --- | --- | --- |
| output frame | 實際輸出變體的 `FRAME` | `variant:<kebab-id>` | Frame 尺寸就是輸出尺寸；每個 variant ID 穩定且唯一 |
| editable text | 真正的 `TEXT` node | `field:<kebab-id>` | 依語意命名，例如 `field:event-title`、`field:start-time` |
| replaceable image | 圖片填色或可替換圖片／向量 node | `image:<kebab-id>` | 依用途命名，例如 `image:guest-portrait` |
| fixed/export boundary | 不接受表單輸入的固定圖層，或固定資產的匯出邊界 ancestor | `fixed:<kebab-id>` | 內部 descendants 可不命名；邊界必須可追溯 |
| related module | 需一起移動／縮放的來賓、人物、卡片等群組 | `module:<kebab-id>` | 成員與祖先關係要能回讀，不能靠位置猜測 |

Audit 只列入上述角色。每個同一 variant 的 contract name、field ID、image ID、module ID 都要檢查碰撞；node ID 仍以 Figma 的精確 ID 為準。跨 variant 只有在語意真的相同時才沿用同一 field ID（例如每個 variant 都是同一個活動標題）；不同語意即使位置相同也要使用不同 ID。任何角色或語意無法判斷都標成 ambiguity，不能自動命名後假裝通過。

## 3. Proposal 與 requirements readback

以唯讀 metadata／structured readback 建立一張可供確認的表。每一列必須包含以下欄位：

| node ID | type | current name | proposed name | role | confidence／ambiguity | action |
| --- | --- | --- | --- | --- | --- | --- |
| `<figma-node-id>` | `TEXT` | `Text 2` | `field:event-title` | editable text | high；位於標題區，與其他 variant 語意相同 | confirm rename |

建議名稱要從視覺角色、文字內容的語意、相鄰群組與祖先關係推導 English kebab ID；不要從圖層順序或任意數字推導。proposal 至少要另外列出：

`action` 使用 `keep`（已合規）、`confirm rename`（等待核准）、`manual review`（語意或角色不明）或 `blocked`（碰撞／權限／stale）等可執行狀態，不用模糊的「看起來可以」。

- 同一語意在不同 variant 的對應，以及哪些欄位不能共用 ID；
- collision（相同 name、相同 ID、相同 role 的多個候選）與需要人工決策的列；
- 會保留的合規名稱與不需要命名的內部 descendants；
- naming status、audit 範圍、proposal confirmation 與後續 readback evidence。

任何 Figma name mutation 都必須等使用者明確確認 proposal。不能把「直接建置」「看起來合理」或一張截圖當作 rename 授權。若沒有 `use_figma` 寫入能力、檔案權限或目前頁面權限，提供含精確 node ID、current name、proposed name 的可複製手動計畫並等待使用者改名；不要宣稱 generator gate 已通過，也不要先產生 config 或建置 Site。

## 4. 核准後的精確 rename path

只有 proposal 被明確確認後，才載入 `figma-use` 及其 plugin API index，並用 `use_figma` 執行 name-only 寫入：

1. 每個 mutation 傳入 audited 的精確 node ID、audited current name 與 confirmed proposed name；不可用名稱搜尋、順序或模糊匹配找 node。
2. `use_figma` 呼叫必須傳 `skillNames: "figma-use"`。先以 exact ID 取得 node，確認其目前 `node.name` 仍等於 audited current name；任何 stale／concurrent change 都要 abort 該 batch，不可覆蓋。
3. 每次最多 10 個 name mutations。唯一允許的畫布變更是 `node.name = proposedName`；不得改文字、geometry、hierarchy、z-order、styles、assets、visibility、content 或其他屬性。
4. 回傳每個實際變更的 node ID 與 old/new name，並在 Codex 外部保留 rollback map（`nodeId`, `oldName`, `newName`）。完成一批後先做 readback，再決定是否送下一批。
5. 多批次中若發生 partial failure、stale ID 或權限錯誤，立即停止並報告 `applied`／`unapplied`、錯誤與 rollback map；不要默默繼續，也不要在可能存在 concurrent edits 時自動 rollback。任何 rollback 都要重新讀取目前名稱並取得新的明確指示。

一批的 `use_figma` script 可採兩階段做法：先以 exact ID 讀取並檢查所有 audited current names，全部一致後才改名；不要在同一批中邊搜尋邊寫入。下列是 10 個以內 proposal 的最小模式，實際執行前要替換成已確認的 exact IDs 與名稱：

```js
const proposals = [
  { nodeId: "<figma-node-id>", currentName: "Text 2", proposedName: "field:event-title" },
]
if (proposals.length > 10) throw new Error("split rename batch: maximum 10 mutations")

const targets = []
for (const proposal of proposals) {
  const node = await figma.getNodeByIdAsync(proposal.nodeId)
  if (!node) throw new Error(`missing node ${proposal.nodeId}`)
  if (node.name !== proposal.currentName) {
    throw new Error(`stale name for ${proposal.nodeId}: expected ${proposal.currentName}, got ${node.name}`)
  }
  targets.push({ node, proposal })
}

const changes = []
for (const { node, proposal } of targets) {
  const oldName = node.name
  node.name = proposal.proposedName
  changes.push({ nodeId: node.id, oldName, newName: node.name })
}
return {
  mutatedNodeIds: changes.map(({ nodeId }) => nodeId),
  changes,
  rollbackMap: changes.map(({ nodeId, oldName, newName }) => ({ nodeId, oldName, newName })),
}
```

這個寫入路徑與 source-package 的 `extraction.properties.readOnly` 不衝突：後者只記錄屬性抽取證據，命名寫入是獨立、事前核准的操作，且不需要改動 manifest schema。

## 5. 命名 readback 與放行條件

rename 後使用 `get_metadata` 或唯讀 `use_figma` structured readback，逐一以 exact node ID 回讀 `type`、`name`、parent／variant ancestry 與必要的 contract role。screenshots 只能證明視覺，不證明 layer names。

只有所有 required contract names 都符合 `variant:`／`field:`／`image:`／`fixed:`／`module:`、ID 語意穩定、沒有碰撞且與 manifest mapping 一致，才可將 naming status 設為 `verified`，接著執行 source-package validator、config 產生與模板 build。readback 不完整、仍有 ambiguity、使用者尚未確認或寫入只完成一部分時，status 必須維持 `blocked`，並在 requirements readback 明確列出下一步與負責人。
