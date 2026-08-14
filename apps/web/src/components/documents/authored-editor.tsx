"use client";

import { useEffect, useRef, useState } from "react";
import {
  emptyAuthoredBody,
  type AuthoredBlock,
  type AuthoredBody,
  type AuthoredInline
} from "@mpa/shared";
import { Button, Input } from "@mpa/ui";

type Props = {
  title: string;
  body: AuthoredBody | null;
  saving?: boolean;
  onChange: (next: { title: string; body: AuthoredBody; checkpoint?: boolean }) => void;
  onDelete?: () => void;
};

function textOf(content: AuthoredInline[]) {
  return content.map((part) => part.text).join("");
}

function inline(text: string): AuthoredInline[] {
  return [{ text }];
}

export function AuthoredEditor({ title, body, saving, onChange, onDelete }: Props) {
  const [draftTitle, setDraftTitle] = useState(title);
  const [draft, setDraft] = useState<AuthoredBody>(body ?? emptyAuthoredBody());
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      onChange({ title: draftTitle, body: draft });
    }, 800);
    return () => window.clearTimeout(handle);
  }, [draft, draftTitle, onChange]);

  function updateBlock(index: number, block: AuthoredBlock) {
    setDraft((current) => ({
      type: "doc",
      blocks: current.blocks.map((item, itemIndex) => (itemIndex === index ? block : item))
    }));
  }

  function addBlock(type: AuthoredBlock["type"]) {
    const next: AuthoredBlock =
      type === "heading"
        ? { type: "heading", level: 2, content: inline("") }
        : type === "bulletList"
          ? { type: "bulletList", items: [inline("")] }
          : type === "orderedList"
            ? { type: "orderedList", items: [inline("")] }
            : type === "checklist"
              ? { type: "checklist", items: [{ checked: false, content: inline("") }] }
              : type === "table"
                ? {
                    type: "table",
                    rows: [
                      [inline("Column"), inline("Value")],
                      [inline(""), inline("")]
                    ]
                  }
                : { type: "paragraph", content: inline("") };
    setDraft((current) => ({ type: "doc", blocks: [...current.blocks, next] }));
  }

  async function addImage(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 750_000) return;
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const src = `data:${file.type};base64,${btoa(binary)}`;
    setDraft((current) => ({
      type: "doc",
      blocks: [...current.blocks, { type: "image", src, alt: file.name }]
    }));
  }

  return (
    <div className="space-y-3">
      <Input
        value={draftTitle}
        onChange={(event) => setDraftTitle(event.target.value)}
        aria-label="Document title"
        className="min-h-11 font-display text-lg font-semibold"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => addBlock("heading")}>
          Heading
        </Button>
        <Button type="button" onClick={() => addBlock("paragraph")}>
          Paragraph
        </Button>
        <Button type="button" onClick={() => addBlock("bulletList")}>
          List
        </Button>
        <Button type="button" onClick={() => addBlock("checklist")}>
          Checklist
        </Button>
        <Button type="button" onClick={() => addBlock("table")}>
          Table
        </Button>
        <label className="inline-flex min-h-10 cursor-pointer items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm font-medium">
          Image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void addImage(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button type="button" onClick={() => onChange({ title: draftTitle, body: draft, checkpoint: true })}>
          Save version
        </Button>
        {onDelete ? (
          <Button type="button" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
        {saving ? (
          <span className="self-center text-xs text-[var(--mpa-color-text-secondary)]">Saving…</span>
        ) : null}
      </div>
      <div className="space-y-2">
        {draft.blocks.map((block, index) => (
          <div key={`${block.type}-${index}`}>
            {block.type === "heading" ? (
              <input
                className="w-full border-0 bg-transparent font-display text-xl font-semibold outline-none"
                value={textOf(block.content)}
                onChange={(event) =>
                  updateBlock(index, { ...block, content: inline(event.target.value) })
                }
                aria-label={`Heading ${index + 1}`}
              />
            ) : null}
            {block.type === "paragraph" ? (
              <textarea
                className="min-h-16 w-full resize-y rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={textOf(block.content)}
                onChange={(event) =>
                  updateBlock(index, { ...block, content: inline(event.target.value) })
                }
                aria-label={`Paragraph ${index + 1}`}
              />
            ) : null}
            {block.type === "bulletList" || block.type === "orderedList" ? (
              <textarea
                className="min-h-20 w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={block.items.map((item) => textOf(item)).join("\n")}
                onChange={(event) =>
                  updateBlock(index, {
                    ...block,
                    items: event.target.value.split("\n").map((line) => inline(line))
                  })
                }
                aria-label={`${block.type} ${index + 1}`}
              />
            ) : null}
            {block.type === "checklist" ? (
              <ul className="space-y-1">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) => {
                        const items = block.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, checked: event.target.checked } : entry
                        );
                        updateBlock(index, { ...block, items });
                      }}
                    />
                    <input
                      className="min-h-10 flex-1 rounded-md border border-[var(--mpa-color-border-default)] px-2"
                      value={textOf(item.content)}
                      onChange={(event) => {
                        const items = block.items.map((entry, entryIndex) =>
                          entryIndex === itemIndex ? { ...entry, content: inline(event.target.value) } : entry
                        );
                        updateBlock(index, { ...block, items });
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            {block.type === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border border-[var(--mpa-color-border-default)] p-1">
                            <input
                              className="w-full bg-transparent px-1 py-1 outline-none"
                              value={textOf(cell)}
                              onChange={(event) => {
                                const rows = block.rows.map((entry, entryIndex) =>
                                  entryIndex === rowIndex
                                    ? entry.map((current, currentIndex) =>
                                        currentIndex === cellIndex ? inline(event.target.value) : current
                                      )
                                    : entry
                                );
                                updateBlock(index, { ...block, rows });
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {block.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.src} alt={block.alt ?? "Document image"} className="max-h-56 rounded-md" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
