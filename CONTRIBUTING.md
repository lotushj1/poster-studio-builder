# 貢獻指南

這個套件的核心邊界是「Figma Design Frame-only、可追溯、可驗證」。提交修改前請先讀 [SKILL.md](SKILL.md) 與 [references/verify.md](references/verify.md)。

## 修改原則

- 只在明確範圍內修改；不要把私人 source package、Figma URL、客戶資料、照片、token 或本機字體加入公開資料夾。
- UI 修改應維持 monochrome token、現有 rendering／geometry／manifest schema 與 export output contract。
- 互動控制使用原生 button／input／select；tabs 必須保留 `role="tablist"`、`role="tab"`、`aria-selected`、`aria-controls` 與鍵盤操作。
- 所有可見控制要有清楚的繁中 label、focus-visible 狀態與足夠的操作尺寸；不要使用 `transition: all`。
- 不要用 CSS 插畫、假素材或手刻 SVG 代替 Figma 來源資產。

## 驗證清單

開發環境需要 Node.js `>=22.6.0`；本 package 不使用 runtime dependencies。

```bash
npm test
```

`npm test` 會執行 22 個 template tests 與 validator safety tests。若只修改 template pure behavior，也可以單獨執行：

```bash
node --experimental-strip-types --test assets/template/tests/*.test.mjs
```

完整交付還需要用 `scripts/init-cloudflare-project.sh` 建乾淨的 Cloudflare vinext 專案、再裝範本，跑 `npm run lint`、`npm test`、`npm run build`，並用瀏覽器實測 1440×1000、1024×900、390×844 的實際成品。不要 clone 現成專案當起點。若無法完成 runtime 或人眼檢查，請明確標示「已製作但未驗證」。

每次修改最多三輪自我修正；同方向連續兩次失敗時，停止堆 patch，回頭檢查根因與驗收邊界。
