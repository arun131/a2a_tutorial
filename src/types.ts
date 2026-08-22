/** Official CJP 10-point audit — first page of the government-school survey form. */
export const AUDIT_QUESTIONS = [
  {
    key: "q1_water",
    n: 1,
    section: "2. BASIC FACILITIES",
    prompt: "Safe drinking water functional?",
  },
  {
    key: "q2_toilets",
    n: 2,
    section: "2. BASIC FACILITIES",
    prompt: "Boys' and girls' toilets functional/clean?",
  },
  {
    key: "q3_electricity",
    n: 3,
    section: "2. BASIC FACILITIES",
    prompt: "Functional electricity connection?",
  },
  {
    key: "q4_buildings",
    n: 4,
    section: "2. BASIC FACILITIES",
    prompt: "Buildings in safe, usable condition?",
  },
  {
    key: "q5_playground",
    n: 5,
    section: "2. BASIC FACILITIES",
    prompt: "Spacious playground & boundary wall?",
  },
  {
    key: "q6_ptr",
    n: 6,
    section: "3. TEACHERS & SCHOOL FUNCTIONING",
    prompt: "Pupil/teacher ratio below 30?",
  },
  {
    key: "q7_timetable",
    n: 7,
    section: "3. TEACHERS & SCHOOL FUNCTIONING",
    prompt: "Regular classes as per timetable?",
  },
  {
    key: "q8_attendance",
    n: 8,
    section: "3. TEACHERS & SCHOOL FUNCTIONING",
    prompt: "Student attendance > 80% on visit day?",
  },
  {
    key: "q9_blackboards",
    n: 9,
    section: "3. TEACHERS & SCHOOL FUNCTIONING",
    prompt: "Classrooms have functional blackboards?",
  },
  {
    key: "q10_clerk",
    n: 10,
    section: "3. TEACHERS & SCHOOL FUNCTIONING",
    prompt: "Does the school have a clerk?",
  },
  {
    key: "q11_textbooks",
    n: 11,
    section: "4. GOVERNMENT ENTITLEMENTS",
    prompt: "Textbooks/uniforms received on time?",
  },
  {
    key: "q12_scholarships",
    n: 12,
    section: "4. GOVERNMENT ENTITLEMENTS",
    prompt: "Scholarships received on time?",
  },
  {
    key: "q13_meals_regular",
    n: 13,
    section: "5. MID DAY MEALS",
    prompt: "Meals provided regularly/per menu?",
  },
  {
    key: "q14_meals_hygiene",
    n: 14,
    section: "5. MID DAY MEALS",
    prompt: "Food hygienic and adequate?",
  },
  {
    key: "q15_safety",
    n: 15,
    section: "6. SAFETY, SECURITY & TRANSPORT",
    prompt: "Safety (electrical, fire, structural)?",
  },
  {
    key: "q16_safety_resources",
    n: 16,
    section: "6. SAFETY, SECURITY & TRANSPORT",
    prompt: "Safety resources available (fire extinguisher, first-aid)?",
  },
  {
    key: "q17_safety_resources_repeat",
    n: 17,
    section: "6. SAFETY, SECURITY & TRANSPORT",
    prompt: "Safety resources available (fire extinguisher, first-aid)?",
    note: "Printed twice on the paper form as Q16 and Q17.",
  },
  {
    key: "q18_accessibility",
    n: 18,
    section: "7. ACCESSIBILITY & RESOURCES",
    prompt: "Accessible for children with disabilities?",
  },
  {
    key: "q19_library",
    n: 19,
    section: "7. ACCESSIBILITY & RESOURCES",
    prompt: "Functional library with books?",
  },
  {
    key: "q20_computers",
    n: 20,
    section: "7. ACCESSIBILITY & RESOURCES",
    prompt: "Functional computers?",
  },
] as const;

export type AuditKey = (typeof AUDIT_QUESTIONS)[number]["key"];

/** Form boxes are YES / NO / N/A. Unmentioned stays blank — silence is not a pass. */
export type FormAnswer = "yes" | "no" | "na" | "not_mentioned";

export type AuditAnswers = Record<AuditKey, FormAnswer>;

export type OverallCondition =
  | "good"
  | "needs_improvement"
  | "serious_concern"
  | "urgent_action"
  | "not_mentioned";

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

export type SourceKind = "cjp_campaign" | "news_field_report" | "volunteer_video" | "x_post";

export type FollowUpStatus =
  | "none_reported"
  | "repairs_claimed"
  | "authorities_notified";

export type Severity = "critical" | "serious" | "notable" | "incomplete";

export type RecordKind = "published" | "local_lead" | "x_draft";

export type IngestStatus = "published" | "draft" | "accepted" | "no_village";

export interface Source {
  title: string;
  publisher: string;
  url: string;
  publishedOn?: string;
}

export interface Visit {
  id: string;
  recordKind?: RecordKind;
  ingestStatus?: IngestStatus;
  schoolName: string;
  schoolNameKnown: boolean;
  udiseCode: string | null;
  village: string | null;
  gramPanchayat: string | null;
  block: string | null;
  district: string;
  state: string;
  classesCovered: string | null;
  studentCount: number | null;
  teacherCount: number | null;
  lat: number;
  lng: number;
  coordinatePrecision: CoordinatePrecision;
  observedOn: string;
  timeOfVisit: string | null;
  datePrecision: DatePrecision;
  visitor: string;
  contact: string | null;
  sourceKind: SourceKind;
  auditStatus: AuditStatus;
  answers: AuditAnswers;
  overallCondition: OverallCondition;
  evidencePhotos: FormAnswer;
  topConcerns: [string | null, string | null, string | null];
  additionalComments: string | null;
  agentReasoning: string | null;
  summary: string;
  findings: string[];
  unknowns: string[];
  criticalNotes: string[];
  followUp: FollowUpStatus;
  followUpNote: string | null;
  sources: Source[];
}

export type PageId = "map" | "record" | "submit";

/** @deprecated Use AuditKey. Kept so older filter URLs can be mapped if needed. */
export type ChecklistKey = AuditKey;
export type CategoryStatus = FormAnswer;
export type Checklist = AuditAnswers;
export const CHECKLIST_KEYS = AUDIT_QUESTIONS.map((q) => q.key) as unknown as readonly AuditKey[];
