import { describe, expect, it } from "vitest";
import { withChecks } from "../data/checklist";
import { visits } from "../data/visits";
import { severityOf } from "../lib/severity";
import type { Visit } from "../types";

function stub(overrides: Partial<Visit>): Visit {
  return {
    id: "t",
    schoolName: "Test school",
    schoolNameKnown: true,
    village: "Test",
    block: null,
    district: "Test",
    state: "Test",
    lat: 0,
    lng: 0,
    coordinatePrecision: "village_approx",
    observedOn: "2026-08-15",
    datePrecision: "day",
    visitor: "Tester",
    sourceKind: "cjp_campaign",
    auditStatus: "completed",
    checklist: withChecks({}),
    summary: "x",
    findings: [],
    unknowns: [],
    criticalNotes: [],
    followUp: "none_reported",
    followUpNote: null,
    sources: [{ title: "t", publisher: "t", url: "https://example.com" }],
    ...overrides,
  };
}

describe("severityOf", () => {
  it("never treats not_mentioned categories as problems", () => {
    const visit = stub({
      checklist: withChecks({ toilets: "problem" }),
    });
    expect(severityOf(visit)).toBe("notable");
  });

  it("returns incomplete when a visit is blocked and nothing was documented", () => {
    const visit = stub({
      auditStatus: "blocked",
      checklist: withChecks({}),
    });
    expect(severityOf(visit)).toBe("incomplete");
  });

  it("keeps later field reporting as critical even if the campaign team was blocked", () => {
    const visit = stub({
      auditStatus: "blocked",
      checklist: withChecks({ safety: "problem" }),
      criticalNotes: ["Classes reported in a livestock shed"],
    });
    expect(severityOf(visit)).toBe("critical");
  });

  it("returns incomplete when findings were not published", () => {
    expect(severityOf(stub({ auditStatus: "findings_unpublished" }))).toBe("incomplete");
  });

  it("returns critical only when a source supplied a critical note", () => {
    const visit = stub({
      checklist: withChecks({ toilets: "problem" }),
      criticalNotes: ["locked since construction"],
    });
    expect(severityOf(visit)).toBe("critical");
  });

  it("returns serious for three flagged items without a critical note", () => {
    const visit = stub({
      checklist: withChecks({
        water: "problem",
        toilets: "problem",
        furniture: "problem",
      }),
    });
    expect(severityOf(visit)).toBe("serious");
  });
});

describe("published visits", () => {
  it("give every record at least one public source", () => {
    for (const visit of visits) {
      expect(visit.sources.length).toBeGreaterThan(0);
      for (const source of visit.sources) {
        expect(source.url.startsWith("http")).toBe(true);
      }
    }
  });

  it("does not invent official school names", () => {
    for (const visit of visits) {
      if (!visit.schoolNameKnown) {
        expect(/name not published|not given|former school/i.test(visit.schoolName)).toBe(true);
      }
    }
  });

  it("keeps every pin inside India", () => {
    for (const visit of visits) {
      expect(visit.lat).toBeGreaterThan(6);
      expect(visit.lat).toBeLessThan(37);
      expect(visit.lng).toBeGreaterThan(68);
      expect(visit.lng).toBeLessThan(98);
    }
  });
});
