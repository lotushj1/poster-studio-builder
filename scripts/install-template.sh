#!/usr/bin/env bash
# 把 Poster Studio 編輯器模板裝進一個 vinext + Cloudflare 專案。
# 新專案請先跑 init-cloudflare-project.sh，不要複製展示站 weekly-live-poster-studio。
# 用法：install-template.sh <目標專案目錄> [--force]
#   --force：連 app/studio/config.ts 也覆蓋（預設保留既有設定）
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$SKILL_DIR/assets/template"
TARGET="${1:-}"
FORCE=0
[[ "${2:-}" == "--force" ]] && FORCE=1

if [[ -z "$TARGET" ]]; then
  echo "用法：$0 <目標專案目錄> [--force]" >&2
  exit 1
fi
if [[ ! -f "$TARGET/package.json" ]]; then
  echo "找不到 $TARGET/package.json。請先跑 scripts/init-cloudflare-project.sh <目錄>，再執行這支腳本。" >&2
  exit 1
fi

mkdir -p "$TARGET/app/studio/controls" "$TARGET/tests" "$TARGET/public/assets"

# 引擎與 UI：一律覆蓋（這是模板程式碼，不該被改；客製都在 config.ts）
for f in types.ts text.ts format.ts geometry.ts engine.ts fonts.ts storage.ts export.ts export-helpers.ts PosterStudio.tsx; do
  cp "$TEMPLATE/app/studio/$f" "$TARGET/app/studio/$f"
done
cp "$TEMPLATE"/app/studio/controls/*.tsx "$TARGET/app/studio/controls/"

# 版型設定：預設保留既有的
if [[ -f "$TARGET/app/studio/config.ts" && $FORCE -eq 0 ]]; then
  echo "保留既有 app/studio/config.ts（要用模板的範例覆蓋請加 --force）"
else
  cp "$TEMPLATE/app/studio/config.ts" "$TARGET/app/studio/config.ts"
  echo "已寫入 app/studio/config.ts（匿名範例），請依需求確認單改寫"
fi

# 頁面、版型、樣式：覆蓋 starter 的骨架
for f in app/page.tsx app/layout.tsx app/globals.css; do
  cp "$TEMPLATE/$f" "$TARGET/$f"
done
echo "已覆蓋 app/page.tsx、app/layout.tsx、app/globals.css（layout 的 title／description 記得改成工具名稱）"

# starter 的預覽骨架已不再被 page.tsx 引用；保留現場，讓使用者先檢查再決定
if [[ -e "$TARGET/app/_sites-preview" || -L "$TARGET/app/_sites-preview" ]]; then
  echo "警告：保留 $TARGET/app/_sites-preview；模板不會使用它。完成頁面檢查後，可由你手動移除。" >&2
fi

# 測試
cp "$TEMPLATE/tests/studio.test.mjs" "$TARGET/tests/studio.test.mjs"

# package.json 的 test 指令：讓 node 能直接跑 .ts 匯入
node - "$TARGET/package.json" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
pkg.scripts = pkg.scripts || {};
const glob = "tests/*.test.mjs";
const cur = pkg.scripts.test || "";
const hasTS = /--experimental-strip-types|--import tsx/.test(cur);
let next = cur;
if (!(cur.includes(glob) && hasTS)) {
  const runner = cur.includes("--import tsx") ? "node --import tsx --test" : "node --experimental-strip-types --test";
  next = (cur.includes("npm run build") ? "npm run build && " : "") + `${runner} ${glob}`;
}
if (next !== cur) {
  pkg.scripts.test = next;
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`已更新 package.json 的 test 指令：${next}`);
} else {
  console.log(`package.json 的 test 指令維持：${cur}`);
}
NODE

cat <<MSG

下一步：
1. 固定素材放 $TARGET/public/assets/，config 用 /assets/檔名 引用
2. 依需求確認單改 app/studio/config.ts（寫法：references/config-guide.md）
3. npm run dev 開預覽；npm test 跑單元測試；npm run build 確認可部署
MSG
