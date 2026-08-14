export const AUTHORED_MARKS = ["bold", "italic"] as const;
export type AuthoredMark = (typeof AUTHORED_MARKS)[number];

export type AuthoredInline = {
  text: string;
  marks?: AuthoredMark[];
  href?: string;
};

export type AuthoredHeadingBlock = {
  type: "heading";
  level: 1 | 2 | 3;
  content: AuthoredInline[];
};

export type AuthoredParagraphBlock = {
  type: "paragraph";
  content: AuthoredInline[];
};

export type AuthoredListBlock = {
  type: "bulletList" | "orderedList";
  items: AuthoredInline[][];
};

export type AuthoredChecklistBlock = {
  type: "checklist";
  items: Array<{ checked: boolean; content: AuthoredInline[] }>;
};

export type AuthoredTableBlock = {
  type: "table";
  rows: AuthoredInline[][][];
};

export type AuthoredImageBlock = {
  type: "image";
  src: string;
  alt?: string;
};

export type AuthoredBlock =
  | AuthoredHeadingBlock
  | AuthoredParagraphBlock
  | AuthoredListBlock
  | AuthoredChecklistBlock
  | AuthoredTableBlock
  | AuthoredImageBlock;

export type AuthoredBody = {
  type: "doc";
  blocks: AuthoredBlock[];
};

export const DOCUMENT_KINDS = ["file", "authored"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export function isDocumentKind(value: unknown): value is DocumentKind {
  return typeof value === "string" && (DOCUMENT_KINDS as readonly string[]).includes(value);
}

export function emptyAuthoredBody(): AuthoredBody {
  return { type: "doc", blocks: [{ type: "paragraph", content: [{ text: "" }] }] };
}

export function inlineText(content: AuthoredInline[]): string {
  return content.map((part) => part.text).join("");
}

export function flattenAuthoredBody(body: AuthoredBody | null | undefined): string {
  if (!body || body.type !== "doc" || !Array.isArray(body.blocks)) {
    return "";
  }
  const lines: string[] = [];
  for (const block of body.blocks) {
    switch (block.type) {
      case "heading":
        lines.push(`${"#".repeat(block.level)} ${inlineText(block.content)}`);
        break;
      case "paragraph":
        lines.push(inlineText(block.content));
        break;
      case "bulletList":
        for (const item of block.items) {
          lines.push(`• ${inlineText(item)}`);
        }
        break;
      case "orderedList":
        block.items.forEach((item, index) => {
          lines.push(`${index + 1}. ${inlineText(item)}`);
        });
        break;
      case "checklist":
        for (const item of block.items) {
          lines.push(`${item.checked ? "[x]" : "[ ]"} ${inlineText(item.content)}`);
        }
        break;
      case "table":
        for (const row of block.rows) {
          lines.push(row.map((cell) => inlineText(cell)).join(" | "));
        }
        break;
      case "image":
        lines.push(block.alt?.trim() ? `[Image: ${block.alt}]` : "[Image]");
        break;
      default:
        break;
    }
  }
  return lines.join("\n").trim();
}

function isInline(value: unknown): value is AuthoredInline {
  if (!value || typeof value !== "object") return false;
  const row = value as AuthoredInline;
  if (typeof row.text !== "string") return false;
  if (row.href !== undefined && typeof row.href !== "string") return false;
  if (row.marks && !row.marks.every((mark) => (AUTHORED_MARKS as readonly string[]).includes(mark))) {
    return false;
  }
  return true;
}

function isInlineList(value: unknown): value is AuthoredInline[] {
  return Array.isArray(value) && value.every(isInline);
}

const MAX_IMAGE_SRC_CHARS = 1_500_000;

export function parseAuthoredBody(value: unknown): AuthoredBody | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as AuthoredBody;
  if (doc.type !== "doc" || !Array.isArray(doc.blocks)) return null;
  const blocks: AuthoredBlock[] = [];
  for (const block of doc.blocks) {
    if (!block || typeof block !== "object" || !("type" in block)) return null;
    switch (block.type) {
      case "heading":
        if (![1, 2, 3].includes(block.level) || !isInlineList(block.content)) return null;
        blocks.push({ type: "heading", level: block.level, content: block.content });
        break;
      case "paragraph":
        if (!isInlineList(block.content)) return null;
        blocks.push({ type: "paragraph", content: block.content });
        break;
      case "bulletList":
      case "orderedList":
        if (!Array.isArray(block.items) || !block.items.every(isInlineList)) return null;
        blocks.push({ type: block.type, items: block.items });
        break;
      case "checklist":
        if (
          !Array.isArray(block.items) ||
          !block.items.every(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof item.checked === "boolean" &&
              isInlineList(item.content)
          )
        ) {
          return null;
        }
        blocks.push({ type: "checklist", items: block.items });
        break;
      case "table":
        if (
          !Array.isArray(block.rows) ||
          !block.rows.every((row) => Array.isArray(row) && row.every(isInlineList))
        ) {
          return null;
        }
        blocks.push({ type: "table", rows: block.rows });
        break;
      case "image":
        if (typeof block.src !== "string" || block.src.length > MAX_IMAGE_SRC_CHARS) return null;
        if (!block.src.startsWith("data:image/") && !block.src.startsWith("/")) return null;
        blocks.push({
          type: "image",
          src: block.src,
          ...(typeof block.alt === "string" ? { alt: block.alt } : {})
        });
        break;
      default:
        return null;
    }
  }
  return { type: "doc", blocks };
}

export function isAuthoredBody(value: unknown): value is AuthoredBody {
  return parseAuthoredBody(value) !== null;
}
