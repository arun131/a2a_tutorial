import { describe, expect, it } from "vitest";
import { emptyChecklist } from "../data/checklist";
import { draftToVisit, emptyDraft, validateDraft } from "../lib/leads";

describe("validateDraft", () => {
  it("rejects a lead with no source link", () => {
    const draft = emptyDraft();
    draft.schoolName = "ZP School";
    draft.district = "Hingoli";
    draft.state = "Maharashtra";
    draft.summary = "No drinking water.";
    expect(validateDraft(draft)).toContain(
      "A public link is required — Instagram, X, or a news article.",
    );
  });

  it("allows an unnamed school if that box is checked", () => {
    const draft = emptyDraft();
    draft.schoolNameKnown = false;
    draft.district = "Pakur";
    draft.state = "Jharkhand";
    draft.summary = "Building looks unsafe.";
    draft.sourceUrl = "https://www.instagram.com/p/example";
    expect(validateDraft(draft)).toEqual([]);
  });
});

describe("draftToVisit", () => {
  it("marks the record as a local lead that is not yet on the map", () => {
    const visit = draftToVisit(
      {
        schoolName: "Test",
        schoolNameKnown: true,
        village: "A",
        district: "B",
        state: "C",
        observedOn: "2026-08-20",
        visitor: "Me",
        summary: "Toilets locked.",
        sourceUrl: "https://example.com/post",
        sourceTitle: "Post",
        checklist: { ...emptyChecklist(), toilets: "problem" },
      },
      0,
    );
    expect(visit.recordKind).toBe("local_lead");
    expect(visit.lat).toBe(0);
    expect(visit.unknowns.some((line) => /not sit on the map/i.test(line))).toBe(true);
  });
});
