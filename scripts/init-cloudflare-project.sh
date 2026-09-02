#!/usr/bin/env bash
# 為新站建立 Cloudflare vinext 專案。
# 不要複製現成專案當起點。
# 用法：init-cloudflare-project.sh <新專案目錄> [worker-name]
set -euo pipefail

TARGET="${1:-}"
WORKER_NAME="${2:-}"

if [[ -z "$TARGET" ]]; then
  echo "用法：$0 <新專案目錄> [worker-name]" >&2
  exit 1
fi
if [[ -e "$TARGET" && -n "$(ls -A "$TARGET" 2>/dev/null || true)" ]]; then
  echo "目錄已存在且非空：$TARGET。請換路徑，或對既有 vinext 專案改跑 install-template.sh。" >&2
  exit 1
fi

if [[ -z "$WORKER_NAME" ]]; then
  WORKER_NAME="$(basename "$TARGET" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"
fi
if [[ -z "$WORKER_NAME" ]]; then
  echo "無法從目錄名稱得到 worker name，請顯式傳第二個參數。" >&2
  exit 1
fi

npx --yes create-vinext-app "$TARGET" \
  --platform cloudflare \
  --data-cache none \
  --image-optimization none \
  --yes \
  --use-npm \
  --disable-git

node - "$TARGET" "$WORKER_NAME" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const name = process.argv[3];
for (const file of ["wrangler.jsonc", "wrangler.json", "wrangler.toml"]) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  let text = fs.readFileSync(full, "utf8");
  if (file.endsWith(".toml")) {
    text = text.replace(/^name\s*=\s*".*"/m, `name = "${name}"`);
  } else {
    text = text.replace(/"name"\s*:\s*"[^"]*"/, `"name": "${name}"`);
  }
  fs.writeFileSync(full, text);
  console.log(`已把 ${file} 的 name 設成 ${name}`);
}
const pkgPath = path.join(root, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = name;
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts.deploy) {
    pkg.scripts.deploy = "npm run build && wrangler deploy --config dist/server/wrangler.json";
    console.log("已補上 package.json 的 deploy script");
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
NODE

cat <<MSG

專案已建在 $TARGET（Cloudflare Workers，worker name：$WORKER_NAME）
下一步：
  bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/install-template.sh" "$TARGET"
  再依 Figma Frame 寫 app/studio/config.ts 與 public/assets/
  npx wrangler login   # 該電腦第一次
  npm run deploy
MSG
