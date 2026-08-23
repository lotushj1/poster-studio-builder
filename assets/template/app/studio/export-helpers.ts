/** 純函式的批次匯出 helper，與 canvas／DOM 分離，方便測試與除錯掛鉤使用。 */
import type { RenderInput } from "./engine";
import type { Variant } from "./types";

export type ExportInput = Omit<RenderInput, "mode">;

/** 產生所有變體的匯出輸入，保留同一份欄位、照片與調整狀態。 */
export function variantExportInputs(input: ExportInput, variants = input.config.variants): ExportInput[] {
  return variants.map((variant) => ({ ...input, variant }));
}

/** 純函式 helper，讓測試／除錯掛鉤能確認批次匯出涵蓋每個 variant。 */
export function variantExportIds(variants: Variant[]): string[] {
  return variants.map((variant) => variant.id);
}
