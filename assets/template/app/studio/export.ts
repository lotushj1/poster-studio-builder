/**
 * 匯出：用同一套引擎畫到離屏 canvas，輸出 PNG／JPEG。
 */
import { renderTemplate } from "./engine";
import { variantExportInputs, type ExportInput } from "./export-helpers";
export { variantExportIds, variantExportInputs, type ExportInput } from "./export-helpers";

export async function renderToBlob(
  input: ExportInput,
  format: "png" | "jpeg" = "png",
  quality = 0.92,
): Promise<Blob> {
  const { width, height } = input.variant.size ?? input.config.size;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unsupported");
  if (format === "jpeg") {
    // JPEG 沒有透明，先鋪白
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  renderTemplate(ctx, { ...input, mode: "export" });
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, format === "jpeg" ? "image/jpeg" : "image/png", quality),
  );
  if (!blob) throw new Error("export-failed");
  return blob;
}

/** 逐一產生每個變體的 Blob；不引入 ZIP 依賴，交由 UI 觸發多個明確下載。 */
export async function renderAllToBlobs(
  input: ExportInput,
  format: "png" | "jpeg" = "png",
  quality = 0.92,
): Promise<{ variantId: string; blob: Blob }[]> {
  const out: { variantId: string; blob: Blob }[] = [];
  for (const variantInput of variantExportInputs(input)) {
    out.push({ variantId: variantInput.variant.id, blob: await renderToBlob(variantInput, format, quality) });
  }
  return out;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function canCopyImage(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.write === "function" &&
    typeof ClipboardItem !== "undefined"
  );
}

export async function copyBlobToClipboard(blob: Blob | Promise<Blob>): Promise<boolean> {
  if (!canCopyImage()) return false;
  try {
    // 剪貼簿只吃 PNG；Safari 需要在同一個點擊事件內用 Promise 餵給 ClipboardItem
    const item = new ClipboardItem({ "image/png": Promise.resolve(blob) });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
