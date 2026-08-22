export const CHECKLIST_KEYS = [
  "water",
  "toilets",
  "electricity",
  "safety",
  "meals",
  "accessibility",
  "furniture",
] as const;

export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

/** A category is only a problem if a source said so. Silence is not a pass. */
export type CategoryStatus = "problem" | "not_mentioned" | "reported_ok";

export type Checklist = Record<ChecklistKey, CategoryStatus>;

export type CoordinatePrecision =
  | "village_approx"
  | "block_approx"
  | "district_approx"
  | "city_approx";

export type DatePrecision = "day" | "week" | "month";

export type AuditStatus =
  | "completed"
  | "partial"
  | "blocked"
  | "findings_unpublished";

export type SourceKind = "cjp_campaign" | "news_field_report" | "volunteer_video";

export type FollowUpStatus =
  | "none_reported"
  | "repairs_claimed"
  | "authorities_notified";

export type Severity = "critical" | "serious" | "notable" | "incomplete";

export type RecordKind = "published" | "local_lead";

export interface Source {
  title: string;
  publisher: string;
  url: string;
  publishedOn?: string;
}

export interface Visit {
  id: string;
  recordKind?: RecordKind;
  schoolName: string;
  schoolNameKnown: boolean;
  village: string | null;
  block: string | null;
  district: string;
  state: string;
  lat: number;
  lng: number;
  coordinatePrecision: CoordinatePrecision;
  observedOn: string;
  datePrecision: DatePrecision;
  visitor: string;
  sourceKind: SourceKind;
  auditStatus: AuditStatus;
  checklist: Checklist;
  summary: string;
  findings: string[];
  unknowns: string[];
  criticalNotes: string[];
  followUp: FollowUpStatus;
  followUpNote: string | null;
  sources: Source[];
}

export type PageId = "map" | "record" | "submit";
