# Changelog

## Unreleased

- 產品分工：展示站是品質標竿；凱文與其他人一律用這個 Skill 建站。新站預設建在 Cloudflare Workers，不再走 ChatGPT Sites。
- 新增 `scripts/init-cloudflare-project.sh`；Cursor／Claude Code／Codex 都可安裝使用。
- 新增公開使用說明 [docs/guide.md](docs/guide.md)。
- 已知缺口：Skill 模板 chrome 尚未回寫展示站（36px header、圖層排序、icon 按鈕）。下一次要把展示站編輯器回寫進 `assets/template/`，不含 PressPlay config／素材。

## v0.1.0 — 2026-08-24

- 建立可公開、匿名的 Poster Studio Builder Skill package。
- 將 template 操作介面整理為內容、素材、調整、匯出四個可鍵盤操作的 ARIA tabs。
- 預覽預設聚焦目前版型，保留全部版型切換、批次匯出與既有 canvas 行為。
- 頁首集中主要下載動作，加入復原／重做；格式、批次下載、複製與重設移至匯出 tab。
- 加入 disclosure、focus-visible、四個主 tab 同時可見、reduced-motion 與 source invariant tests。
- 強化 source-package validator 的 realpath containment，拒絕外部與 broken symlink。
- installer 不再刪除 `app/_sites-preview`，改為保留並提示人工檢查；新增 Node 22 CI 與 MIT package metadata。
