/**
 * 範本設定：這個工具「長什麼樣、要填什麼」全部在這裡。
 *
 * 預設示範採 mono-v1 中性黑白 editorial 標準：紙色底、墨色字、單一強調色，
 * 並用四個尺寸／人數變體示範「同一份資料，多種輸出」。實際專案請以已驗證的來源包取代這份範例。
 */
import type { FieldDef, Layer, ModuleDef, TemplateConfig } from "./types";

const W = 1080;
const FEED_H = 1350;
const STORY_H = 1920;

const monoV1 = {
  id: "mono-v1",
  label: "中性黑白編輯風格 v1",
  tokens: {
    ink: "#171717",
    paper: "#f7f6f2",
    muted: "#6d6a63",
    line: "#d8d5ce",
    accent: "#171717",
    accentInk: "#ffffff",
    preview: "#e8e5de",
  },
} as const;

/* ---------- 共用欄位 ---------- */

const sharedFields: FieldDef[] = [
  {
    id: "title",
    type: "textarea",
    label: "活動名稱",
    group: "內容",
    default: "把複雜的事，說成好懂的事",
    maxLength: 40,
    placeholder: "最多兩行，太長會自動縮小；可以按 Enter 自己斷行",
  },
  {
    id: "subtitle",
    type: "text",
    label: "一句話說明",
    group: "內容",
    default: "把重點整理成易讀的主題內容",
    maxLength: 34,
  },
  { id: "date", type: "date", label: "日期", group: "時間", default: "today" },
  { id: "time", type: "time", label: "開始時間", group: "時間", default: "20:00" },
  {
    id: "cta",
    type: "text",
    label: "報名或觀看方式",
    group: "內容",
    default: "詳細資訊與回放內容請見公告",
    maxLength: 34,
  },
  {
    id: "accent",
    type: "color",
    label: "強調色",
    group: "風格",
    default: monoV1.tokens.accent,
    swatches: ["#171717", "#343434", "#6d6a63", "#b4b0a7"],
    hint: "預設使用 mono-v1 墨色；需要時可換成中性灰階",
  },
  {
    id: "bg_photo",
    type: "image",
    label: "背景圖（選填）",
    group: "風格",
    hint: "會以低透明度、灰階方式壓在紙色底上",
  },
  { id: "host_photo", type: "image", label: "主持人照片", group: "主持人" },
  { id: "host_name", type: "text", label: "主持人名字", group: "主持人", default: "主持人", maxLength: 12 },
  { id: "guest1_photo", type: "image", label: "來賓 1 照片", group: "來賓 1" },
  { id: "guest1_name", type: "text", label: "來賓 1 名字", group: "來賓 1", default: "來賓甲", maxLength: 12 },
  { id: "guest1_title", type: "text", label: "來賓 1 頭銜", group: "來賓 1", default: "品牌設計師", maxLength: 16 },
];

const secondGuestFields: FieldDef[] = [
  { id: "guest2_photo", type: "image", label: "來賓 2 照片", group: "來賓 2" },
  { id: "guest2_name", type: "text", label: "來賓 2 名字", group: "來賓 2", default: "來賓乙", maxLength: 12 },
  { id: "guest2_title", type: "text", label: "來賓 2 頭銜", group: "來賓 2", default: "行銷顧問", maxLength: 16 },
];

function scoped(variantId: string, part: string): string {
  return `${variantId}__${part}`;
}

/* ---------- 版型圖層 ---------- */

function editorialLayers(variantId: string, story: boolean, height: number): Layer[] {
  const headerY = story ? 270 : 82;
  const titleY = story ? 390 : 176;
  const titleH = story ? 300 : 230;
  const subtitleY = story ? 735 : 430;
  const dateY = story ? 850 : 535;
  const peopleY = story ? 1055 : 690;
  return [
    {
      id: scoped(variantId, "background-photo"),
      type: "image",
      src: "{bg_photo}",
      x: 0,
      y: 0,
      w: W,
      h: height,
      fit: "cover",
      opacity: 0.12,
      grayscale: true,
      visibleIf: "bg_photo",
    },
    {
      id: scoped(variantId, "frame"),
      type: "rect",
      x: 42,
      y: 42,
      w: W - 84,
      h: height - 84,
      fill: "rgba(0,0,0,0)",
      stroke: { color: monoV1.tokens.ink, width: 2 },
    },
    {
      id: scoped(variantId, "masthead"),
      type: "text",
      label: "系列標籤",
      text: "主題活動／LIVE",
      x: 78,
      y: headerY,
      w: 500,
      h: 52,
      font: { role: "body", size: 28 },
      color: monoV1.tokens.accentInk,
      background: { color: "{accent}", paddingX: 18, paddingY: 8, radius: 2 },
      letterSpacing: 0.04,
    },
    {
      id: scoped(variantId, "index"),
      type: "text",
      text: story ? "直式版型／01" : "貼文版型／01",
      x: W - 380,
      y: headerY + 8,
      w: 300,
      h: 36,
      font: { role: "body", size: 22 },
      color: monoV1.tokens.muted,
      align: "right",
    },
    {
      id: scoped(variantId, "title"),
      type: "text",
      label: "活動名稱",
      text: "{title}",
      x: 78,
      y: titleY,
      w: W - 156,
      h: titleH,
      font: { role: "heading", size: story ? 92 : 88 },
      color: monoV1.tokens.ink,
      lineHeight: 1.16,
      maxLines: 2,
      autoFit: { min: 52 },
      adjustable: ["fontSize", "color", "y"],
    },
    {
      id: scoped(variantId, "subtitle"),
      type: "text",
      label: "一句話說明",
      text: "{subtitle}",
      x: 78,
      y: subtitleY,
      w: W - 156,
      h: 62,
      font: { role: "body", size: 34 },
      color: monoV1.tokens.muted,
      maxLines: 2,
      autoFit: { min: 24 },
    },
    {
      id: scoped(variantId, "date-rule"),
      type: "rect",
      x: 78,
      y: dateY - 18,
      w: W - 156,
      h: 2,
      fill: monoV1.tokens.ink,
      opacity: 0.18,
    },
    {
      id: scoped(variantId, "datetime"),
      type: "text",
      label: "日期時間",
      text: "{date:YYYY.MM.DD}　{time:HH:mm}",
      x: 78,
      y: dateY,
      w: W - 156,
      h: 72,
      font: { role: "heading", size: 50 },
      color: "{accent}",
      letterSpacing: 0.02,
      adjustable: ["fontSize", "color"],
    },
    {
      id: scoped(variantId, "people-label"),
      type: "text",
      text: "參與者",
      x: 78,
      y: peopleY - 62,
      w: 240,
      h: 38,
      font: { role: "body", size: 24 },
      color: monoV1.tokens.muted,
      letterSpacing: 0.08,
    },
  ];
}

function footerLayers(variantId: string, height: number): Layer[] {
  const footerY = height - 118;
  return [
    { id: scoped(variantId, "footer-rule"), type: "rect", x: 78, y: footerY - 22, w: W - 156, h: 2, fill: monoV1.tokens.ink, opacity: 0.18 },
    {
      id: scoped(variantId, "cta"),
      type: "text",
      label: "報名方式",
      text: "{cta}",
      x: 78,
      y: footerY,
      w: W - 156,
      h: 48,
      font: { role: "body", size: 30 },
      color: monoV1.tokens.ink,
      maxLines: 1,
      autoFit: { min: 22 },
    },
    {
      id: scoped(variantId, "footer-note"),
      type: "text",
      text: "系列海報",
      x: W - 380,
      y: footerY,
      w: 300,
      h: 48,
      font: { role: "body", size: 24 },
      color: monoV1.tokens.muted,
      align: "right",
    },
  ];
}

interface PersonResult {
  layers: Layer[];
  module: ModuleDef;
}

/** 來賓模組：照片、名字、頭銜共用一組移動／縮放，照片仍能個別拖曳構圖。 */
function person(
  variantId: string,
  prefix: "host" | "guest1" | "guest2",
  opts: { x: number; y: number; size: number; roleLabel: string; nameSize: number; titleText?: string },
): PersonResult {
  const { x, y, size, roleLabel, nameSize } = opts;
  const moduleId = scoped(variantId, `${prefix}-module`);
  const photoId = scoped(variantId, `${prefix}-photo`);
  const nameId = scoped(variantId, `${prefix}-name`);
  const titleId = scoped(variantId, `${prefix}-title`);
  const layers: Layer[] = [
    {
      id: photoId,
      moduleId,
      type: "image",
      label: `${roleLabel}照片`,
      src: `{${prefix}_photo}`,
      x,
      y,
      w: size,
      h: size,
      fit: "cover",
      shape: "circle",
      grayscale: true,
      border: { color: monoV1.tokens.ink, width: 7 },
      emptyFill: "#e1ded6",
      placeholder: `上傳${roleLabel}照片`,
      focalX: 0.5,
      focalY: 0.36,
      adjustable: ["scale", "x", "y"],
    },
    {
      id: nameId,
      moduleId,
      type: "text",
      label: `${roleLabel}名字`,
      text: `{${prefix}_name}`,
      x,
      y: y + size + 26,
      w: size,
      h: nameSize * 1.3,
      font: { role: "heading", size: nameSize },
      color: monoV1.tokens.ink,
      align: "center",
      maxLines: 1,
      autoFit: { min: 24 },
    },
    {
      id: titleId,
      moduleId,
      type: "text",
      label: `${roleLabel}頭銜`,
      text: opts.titleText ?? `{${prefix}_title}`,
      x,
      y: y + size + 26 + nameSize * 1.3 + 4,
      w: size,
      h: 40,
      font: { role: "body", size: 25 },
      color: monoV1.tokens.muted,
      align: "center",
      maxLines: 1,
      autoFit: { min: 19 },
    },
  ];
  return {
    layers,
    module: { id: moduleId, label: `${roleLabel}模組`, layerIds: [photoId, nameId, titleId], adjustable: ["x", "y", "scale"] },
  };
}

function makeVariant(
  id: string,
  label: string,
  height: number,
  story: boolean,
  guestCount: 1 | 2,
): TemplateConfig["variants"][number] {
  const peopleY = story ? 1055 : 690;
  const people =
    guestCount === 1
      ? [
          person(id, "host", { x: 105, y: peopleY, size: story ? 410 : 380, roleLabel: "主持人", nameSize: story ? 42 : 40, titleText: "主持人" }),
          person(id, "guest1", { x: 565, y: peopleY, size: story ? 410 : 380, roleLabel: "來賓", nameSize: story ? 42 : 40 }),
        ]
      : [
          person(id, "host", { x: 78, y: peopleY, size: story ? 300 : 280, roleLabel: "主持人", nameSize: 34, titleText: "主持人" }),
          person(id, "guest1", { x: 390, y: peopleY, size: story ? 300 : 280, roleLabel: "來賓 1", nameSize: 34 }),
          person(id, "guest2", { x: 702, y: peopleY, size: story ? 300 : 280, roleLabel: "來賓 2", nameSize: 34 }),
        ];
  return {
    id,
    label,
    size: { width: W, height },
    fields: guestCount === 2 ? secondGuestFields : undefined,
    layers: [...editorialLayers(id, story, height), ...people.flatMap((personData) => personData.layers), ...footerLayers(id, height)],
    modules: people.map((personData) => personData.module),
  };
}

/* ---------- 整份設定 ---------- */

export const templateConfig: TemplateConfig = {
  id: "poster-studio-example",
  // 3 invalidates older persisted examples whose two-guest titles could
  // render with truncation warnings; the engine warning remains enabled.
  version: 3,
  name: "固定版型海報產生器",
  description: "mono-v1 中性黑白編輯風格海報範本，示範貼文／限時動態與一／兩位參與者四種版型。",
  size: { width: W, height: FEED_H },
  designSystem: monoV1,
  background: monoV1.tokens.paper,
  fields: sharedFields,
  variants: [
    makeVariant("ig-feed-one-guest", "IG 貼文｜1 位來賓", FEED_H, false, 1),
    makeVariant("ig-feed-two-guests", "IG 貼文｜2 位來賓", FEED_H, false, 2),
    makeVariant("ig-story-one-guest", "IG 限動｜1 位來賓", STORY_H, true, 1),
    makeVariant("ig-story-two-guests", "IG 限動｜2 位來賓", STORY_H, true, 2),
  ],
  fonts: {
    roles: {
      heading: {
        label: "標題字體",
        family: "PingFang TC",
        weight: 700,
        fallback: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      },
      body: {
        label: "內文字體",
        family: "PingFang TC",
        weight: 400,
        fallback: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
      },
    },
    suggested: ["PingFang TC", "Noto Sans TC", "Microsoft JhengHei"],
    localCatalog: false,
  },
  export: { format: "png", filename: "{name}-{date:YYYYMMDD}-{variant}" },
  ui: {
    accent: monoV1.tokens.accent,
    subtitle: "選版型、填資料，預覽並下載指定格式",
    previewBackground: monoV1.tokens.preview,
    designSystemId: monoV1.id,
  },
};
