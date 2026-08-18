import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = join(process.cwd(), "src");
const repoRoot = join(process.cwd(), "../..");

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("AI assistant functionality audit — current shipped surface", () => {
  it("does not ship a chat route, OpenAI client, or conversation store", () => {
    expect(existsSync(join(webRoot, "app/api/ai"))).toBe(false);
    expect(existsSync(join(webRoot, "app/api/assistant"))).toBe(false);
    expect(existsSync(join(webRoot, "app/(app)/assistant"))).toBe(false);

    const files = walkTsFiles(webRoot);
    const offenders = files.filter((file) => {
      const text = readFileSync(file, "utf8");
      return (
        /from ["']openai["']/.test(text) ||
        /from ["']@ai-sdk/.test(text) ||
        /chat\/completions/.test(text) ||
        /process\.env\[["']OPENAI_/.test(text) ||
        /process\.env\.OPENAI_/.test(text)
      );
    });
    expect(offenders).toEqual([]);
  });

  it("does not require an AI provider env in web examples", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    expect(example).not.toMatch(/OPENAI|ANTHROPIC|AI_MODEL|AI_PROVIDER/);
  });

  it("does not create tenant-portal or Master Admin AI routes", () => {
    expect(existsSync(join(webRoot, "app/api/portal/tenant/assistant"))).toBe(false);
    expect(existsSync(join(webRoot, "app/api/admin/assistant"))).toBe(false);
    expect(existsSync(join(webRoot, "app/(app)/admin/assistant"))).toBe(false);
  });

  it("keeps public legal copy free of generative-model processor claims", () => {
    const legal = readFileSync(join(webRoot, "lib/legal/public-legal-copy.ts"), "utf8");
    expect(legal).not.toMatch(/OpenAI|Anthropic|generative model|language model/i);
    expect(legal).toMatch(/Stripe/);
    expect(legal).toMatch(/Supabase/);
  });

  it("does not add an AI-specific migration", () => {
    const migrations = readdirSync(join(repoRoot, "supabase/migrations"));
    expect(migrations.some((name) => /ai_suggestions|ai_conversations|ai_embeddings/.test(name))).toBe(
      false
    );
  });
});
