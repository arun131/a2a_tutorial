import { emptyChecklist } from "../data/checklist";
import type { AuditAnswers, FormAnswer, Visit } from "../types";

const STORAGE_KEY = "school-thik-karo-leads";

export interface LeadDraft {
  schoolName: string;
  schoolNameKnown: boolean;
  udiseCode: string;
  village: string;
  gramPanchayat: string;
  district: string;
  state: string;
  classesCovered: string;
  observedOn: string;
  timeOfVisit: string;
  visitor: string;
  summary: string;
  sourceUrl: string;
  sourceTitle: string;
  answers: AuditAnswers;
}

export function emptyDraft(): LeadDraft {
  return {
    schoolName: "",
    schoolNameKnown: true,
    udiseCode: "",
    village: "",
    gramPanchayat: "",
    district: "",
    state: "",
    classesCovered: "",
    observedOn: "",
    timeOfVisit: "",
    visitor: "",
    summary: "",
    sourceUrl: "",
    sourceTitle: "",
    answers: emptyChecklist(),
  };
}

export function validateDraft(draft: LeadDraft): string[] {
  const errors: string[] = [];
  if (draft.schoolNameKnown && !draft.schoolName.trim()) {
    errors.push("School name is required, or tick that the source does not name it.");
  }
  if (!draft.district.trim()) errors.push("District is required.");
  if (!draft.state.trim()) errors.push("State is required.");
  if (!draft.summary.trim()) errors.push("A plain-language summary is required.");
  if (!draft.sourceUrl.trim()) {
    errors.push("A public link is required — Instagram, X, or a news article.");
  }
  return errors;
}

export function draftToVisit(draft: LeadDraft, index: number): Visit {
  const named = draft.schoolNameKnown && Boolean(draft.schoolName.trim());
  return {
    id: `lead-${index + 1}-${Date.now()}`,
    recordKind: "local_lead",
    ingestStatus: "draft",
    schoolName: named ? draft.schoolName.trim() : "School name not published",
    schoolNameKnown: named,
    udiseCode: draft.udiseCode.trim() || null,
    village: draft.village.trim() || null,
    gramPanchayat: draft.gramPanchayat.trim() || null,
    block: null,
    district: draft.district.trim(),
    state: draft.state.trim(),
    classesCovered: draft.classesCovered.trim() || null,
    studentCount: null,
    teacherCount: null,
    lat: 0,
    lng: 0,
    coordinatePrecision: "district_approx",
    observedOn: draft.observedOn || new Date().toISOString().slice(0, 10),
    timeOfVisit: draft.timeOfVisit.trim() || null,
    datePrecision: "day",
    visitor: draft.visitor.trim() || "Unnamed in the post",
    contact: null,
    sourceKind: "volunteer_video",
    auditStatus: "partial",
    answers: draft.answers,
    overallCondition: "not_mentioned",
    evidencePhotos: (draft.sourceUrl ? "yes" : "not_mentioned") as FormAnswer,
    topConcerns: [null, null, null],
    additionalComments: null,
    agentReasoning: null,
    summary: draft.summary.trim(),
    findings: [draft.summary.trim()],
    unknowns: [
      "This local sighting does not sit on the map until someone reviews the source and places the school.",
    ],
    criticalNotes: [],
    followUp: "none_reported",
    followUpNote: null,
    sources: [
      {
        title: draft.sourceTitle.trim() || "Submitted sighting",
        publisher: "Local lead",
        url: draft.sourceUrl.trim(),
      },
    ],
  };
}

export function loadLeads(): Visit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Visit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLeads(leads: Visit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function downloadLeads(leads: Visit[]): void {
  const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "school-thik-karo-leads.json";
  a.click();
  URL.revokeObjectURL(url);
}
