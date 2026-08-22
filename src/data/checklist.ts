import type { AuditAnswers, AuditKey, FormAnswer, OverallCondition } from "../types";
import { AUDIT_QUESTIONS, CHECKLIST_KEYS } from "../types";

export { AUDIT_QUESTIONS, CHECKLIST_KEYS };
export type { AuditKey, FormAnswer };

export const CHECKLIST_LABELS: Record<AuditKey, string> = Object.fromEntries(
  AUDIT_QUESTIONS.map((q) => [q.key, `${q.n}. ${q.prompt}`]),
) as Record<AuditKey, string>;

export const SHORT_LABELS: Record<AuditKey, string> = {
  q1_water: "Water",
  q2_toilets: "Toilets",
  q3_electricity: "Electricity",
  q4_buildings: "Buildings",
  q5_playground: "Playground",
  q6_ptr: "PTR",
  q7_timetable: "Timetable",
  q8_attendance: "Attendance",
  q9_blackboards: "Blackboards",
  q10_clerk: "Clerk",
  q11_textbooks: "Textbooks",
  q12_scholarships: "Scholarships",
  q13_meals_regular: "Mid-day meals",
  q14_meals_hygiene: "Meal hygiene",
  q15_safety: "Safety",
  q16_safety_resources: "Fire / first-aid",
  q17_safety_resources_repeat: "Fire / first-aid (Q17)",
  q18_accessibility: "Accessibility",
  q19_library: "Library",
  q20_computers: "Computers",
};

export const CHECKLIST_HINTS: Record<AuditKey, string> = Object.fromEntries(
  AUDIT_QUESTIONS.map((q) => [
    q.key,
    ("note" in q ? q.note : null) ??
      `${q.section} — mark YES / NO / N/A only if the source showed it.`,
  ]),
) as Record<AuditKey, string>;

export const STATUS_LABELS: Record<FormAnswer, string> = {
  yes: "YES",
  no: "NO",
  na: "N/A",
  not_mentioned: "Not mentioned",
};

export const OVERALL_LABELS: Record<OverallCondition, string> = {
  good: "GOOD",
  needs_improvement: "NEEDS IMPROVEMENT",
  serious_concern: "SERIOUS CONCERN",
  urgent_action: "URGENT ACTION",
  not_mentioned: "Not marked",
};

export function emptyChecklist(): AuditAnswers {
  return Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, "not_mentioned"])) as AuditAnswers;
}

export const emptyAnswers = emptyChecklist;

export function withChecks(partial: Partial<AuditAnswers>): AuditAnswers {
  return { ...emptyChecklist(), ...partial };
}

export const withAnswers = withChecks;

export function flaggedProblems(answers: AuditAnswers): AuditKey[] {
  return CHECKLIST_KEYS.filter((key) => answers[key] === "no");
}

export function mentionedOk(answers: AuditAnswers): AuditKey[] {
  return CHECKLIST_KEYS.filter((key) => answers[key] === "yes");
}

export function notMentioned(answers: AuditAnswers): AuditKey[] {
  return CHECKLIST_KEYS.filter((key) => answers[key] === "not_mentioned");
}

export function answeredNoCount(answers: AuditAnswers): number {
  return flaggedProblems(answers).length;
}
