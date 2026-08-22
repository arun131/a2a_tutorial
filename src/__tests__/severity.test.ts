import { describe, expect, it } from "vitest";
import { withAnswers } from "../data/checklist";
import { visits } from "../data/visits";
import { severityOf } from "../lib/severity";
import type { Visit } from "../types";

function stub(overrides: Partial<Visit>): Visit {
  return {
    id: "t",
    schoolName: "Test school",
    schoolNameKnown: true,
    udiseCode: null,
    village: "Test",
    gramPanchayat: null,
    block: null,
    district: "Test",
    state: "Test",
    classesCovered: null,
    studentCount: null,
    teacherCount: null,
    lat: 0,
    lng: 0,
    coordinatePrecision: "village_approx",
    observedOn: "2026-08-15",
    timeOfVisit: null,
    datePrecision: "day",
    visitor: "Tester",
    contact: null,
    sourceKind: "cjp_campaign",
    auditStatus: "completed",
    answers: withAnswers({}),
    overallCondition: "not_mentioned",
    evidencePhotos: "not_mentioned",
    topConcerns: [null, null, null],
    additionalComments: null,
    agentReasoning: null,
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
  it("never treats not_mentioned questions as problems", () => {
    const visit = stub({
      answers: withAnswers({ q2_toilets: "no" }),
    });
    expect(severityOf(visit)).toBe("notable");
  });

  it("returns incomplete when a visit is blocked and nothing was documented", () => {
    const visit = stub({
      auditStatus: "blocked",
      answers: withAnswers({}),
    });
    expect(severityOf(visit)).toBe("incomplete");
  });

  it("keeps later field reporting as critical even if the campaign team was blocked", () => {
    const visit = stub({
      auditStatus: "blocked",
      answers: withAnswers({ q15_safety: "no" }),
      criticalNotes: ["Classes reported in a livestock shed"],
    });
    expect(severityOf(visit)).toBe("critical");
  });

  it("returns incomplete when findings were not published", () => {
    expect(severityOf(stub({ auditStatus: "findings_unpublished" }))).toBe("incomplete");
  });

  it("returns critical only when a source supplied a critical note", () => {
    const visit = stub({
      answers: withAnswers({ q2_toilets: "no" }),
      criticalNotes: ["locked since construction"],
    });
    expect(severityOf(visit)).toBe("critical");
  });

  it("returns serious for three official-form items marked NO without a critical note", () => {
    const visit = stub({
      answers: withAnswers({
        q1_water: "no",
        q2_toilets: "no",
        q3_electricity: "no",
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

  it("uses the official 20-question form on every record", () => {
    for (const visit of visits) {
      expect(Object.keys(visit.answers)).toHaveLength(20);
    }
  });
});
