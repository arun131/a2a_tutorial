import { flaggedProblems } from "../data/checklist";
import type { Severity, Visit } from "../types";

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  serious: "Serious",
  notable: "Notable",
  incomplete: "Incomplete",
};

export const SEVERITY_BLURBS: Record<Severity, string> = {
  critical:
    "A source described collapse risk, a locked toilet since construction, classes under tarpaulin or in a livestock shed, or the form was marked URGENT ACTION.",
  serious:
    "Q4 or Q15 was marked NO, three or more official-form items were marked NO, or the form said SERIOUS CONCERN.",
  notable: "At least one official-form item was marked NO.",
  incomplete: "The visit was blocked, the findings were not published, or the form was not filled.",
};

export function severityOf(visit: Visit): Severity {
  if (visit.auditStatus === "findings_unpublished") return "incomplete";
  const problems = flaggedProblems(visit.answers);
  const hasCriticalNote = visit.criticalNotes.length > 0;
  if (hasCriticalNote || visit.overallCondition === "urgent_action") return "critical";
  if (visit.auditStatus === "blocked" && problems.length === 0) return "incomplete";
  if (
    visit.answers.q4_buildings === "no" ||
    visit.answers.q15_safety === "no" ||
    problems.length >= 3 ||
    visit.overallCondition === "serious_concern"
  ) {
    return "serious";
  }
  if (problems.length > 0) return "notable";
  return "incomplete";
}
