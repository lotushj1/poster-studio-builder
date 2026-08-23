import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("validator rejects external and broken asset symlinks", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "poster-studio-validator-"));
  try {
    const sourceRoot = path.join(tempRoot, "source-package");
    const assetsRoot = path.join(sourceRoot, "assets");
    const outsideRoot = path.join(tempRoot, "outside");
    fs.mkdirSync(assetsRoot, { recursive: true });
    fs.mkdirSync(outsideRoot, { recursive: true });
    const outsideFile = path.join(outsideRoot, "external.bin");
    fs.writeFileSync(outsideFile, "external test fixture\n");

    try {
      fs.symlinkSync(outsideFile, path.join(assetsRoot, "external-link.bin"));
      fs.symlinkSync("missing.bin", path.join(assetsRoot, "broken-link.bin"));
    } catch (error) {
      t.skip(`平台不允許建立 symlink：${error.message}`);
      return;
    }

    const templatePath = fileURLToPath(new URL("../assets/source-package/manifest.template.json", import.meta.url));
    const manifest = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    manifest.assets = [
      {
        id: "external-link",
        kind: "raw-image",
        path: "assets/external-link.bin",
        nodeId: "<figma-node-id>",
        width: 1,
        height: 1,
        downloadedAt: "2026-08-24T00:00:00Z",
      },
      {
        id: "broken-link",
        kind: "raw-image",
        path: "assets/broken-link.bin",
        nodeId: "<figma-node-id>",
        width: 1,
        height: 1,
        downloadedAt: "2026-08-24T00:00:00Z",
      },
    ];
    const manifestPath = path.join(sourceRoot, "manifest.json");
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const validatorPath = fileURLToPath(new URL("../scripts/validate-source-package.mjs", import.meta.url));
    const result = spawnSync(process.execPath, [validatorPath, manifestPath], { encoding: "utf8" });
    const output = `${result.stdout}\n${result.stderr}`;
    assert.notEqual(result.status, 0, output);
    assert.match(output, /external symlink/);
    assert.match(output, /broken symlink/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
