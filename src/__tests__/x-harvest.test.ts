import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CUTOFF = Date.parse("2026-08-15T00:00:00.000Z");
const TARGET = 600;

function loadJsonl(name: string): Array<Record<string, unknown>> {
  const text = readFileSync(resolve("data/x-harvest", name), "utf8");
  return text
    .split(/\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("X harvest", () => {
  const tweets = loadJsonl("tweets.jsonl");
  const drafts = JSON.parse(readFileSync(resolve("data/x-harvest/drafts.json"), "utf8")) as {
    summary: { pinned?: number; withPlace?: number; locationGroups?: number };
    drafts: Array<{
      ingestStatus: string;
      village?: string | null;
      district?: string | null;
      state?: string | null;
      sourceCount?: number;
      proofUrls?: string[];
      sourceCreatedAt?: string;
      sourceId?: string;
    }>;
  };
  const summary = JSON.parse(readFileSync(resolve("data/x-harvest/summary.json"), "utf8")) as {
    fetched: number;
    invented: number;
    pinned: number;
  };

  it("keeps at most 600 real posts and invents none", () => {
    const ids = tweets.map((row) => String(row.id));
    expect(tweets.length).toBeGreaterThan(0);
    expect(tweets.length).toBeLessThanOrEqual(TARGET);
    expect(new Set(ids).size).toBe(ids.length);
    expect(summary.fetched).toBe(tweets.length);
    expect(summary.invented).toBe(0);
    for (const row of tweets) {
      expect(row.id).toBeTruthy();
      expect(row.url).toMatch(/^https:\/\/x\.com\/[^/]+\/status\/\d+$/);
      expect(row.source).toBe("x_api_v2");
    }
  });

  it("caps every post, including Dipke, to after the 15 August 2026 launch", () => {
    for (const row of tweets) {
      const created = Date.parse(String(row.created_at));
      expect(created).toBeGreaterThanOrEqual(CUTOFF);
    }
    const dipke = tweets.filter((row) => String(row.user).toLowerCase() === "abhijeet_dipke");
    expect(dipke.length).toBeGreaterThan(0);
    for (const row of dipke) {
      expect(Date.parse(String(row.created_at))).toBeGreaterThanOrEqual(CUTOFF);
    }
  });

  it("leaves official 10-point rows as drafts and does not pin them", () => {
    expect(summary.pinned).toBe(0);
    expect(drafts.summary.pinned).toBe(0);
    for (const draft of drafts.drafts) {
      expect(draft.ingestStatus).toBe("draft");
      if (draft.sourceCreatedAt) {
        expect(Date.parse(draft.sourceCreatedAt)).toBeGreaterThanOrEqual(CUTOFF);
      }
    }
  });

  it("groups located drafts into one official-form row per place", () => {
    const keys = drafts.drafts.map(
      (draft) => `${draft.village || ""}|${draft.district || ""}|${draft.state || ""}`.toLowerCase(),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(drafts.summary.locationGroups).toBe(drafts.drafts.length);
    const combinedPosts = drafts.drafts.reduce((sum, draft) => sum + (draft.sourceCount || 1), 0);
    expect(combinedPosts).toBe(drafts.summary.withPlace);
    const rampura = drafts.drafts.filter((draft) =>
      /rampura|kanwarpura/i.test(String(draft.village || "")),
    );
    expect(rampura).toHaveLength(1);
    expect(rampura[0]?.proofUrls?.length).toBeGreaterThan(1);
  });
});
