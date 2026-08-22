import type { CategoryStatus, Checklist, ChecklistKey } from "../types";
import { CHECKLIST_KEYS } from "../types";

export { CHECKLIST_KEYS };

export const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  water: "Drinking water",
  toilets: "Toilets",
  electricity: "Electricity",
  safety: "Building safety",
  meals: "Mid-day meals",
  accessibility: "Access & disability",
  furniture: "Benches & furniture",
};

export const CHECKLIST_HINTS: Record<ChecklistKey, string> = {
  water: "Clean drinking water on the premises",
  toilets: "Usable, unlocked toilets with water",
  electricity: "Working power in classrooms",
  safety: "Sound building, no collapse risk, no livestock shed",
  meals: "Kitchen and mid-day meal quality",
  accessibility: "Roads, ramps, and access for disabled students",
  furniture: "Benches, desks, and a place to sit other than the floor",
};

export const STATUS_LABELS: Record<CategoryStatus, string> = {
  problem: "Flagged as a problem",
  not_mentioned: "Not mentioned",
  reported_ok: "Reported as all right",
};

export function emptyChecklist(): Checklist {
  return {
    water: "not_mentioned",
    toilets: "not_mentioned",
    electricity: "not_mentioned",
    safety: "not_mentioned",
    meals: "not_mentioned",
    accessibility: "not_mentioned",
    furniture: "not_mentioned",
  };
}

export function withChecks(partial: Partial<Checklist>): Checklist {
  return { ...emptyChecklist(), ...partial };
}

export function flaggedProblems(checklist: Checklist): ChecklistKey[] {
  return CHECKLIST_KEYS.filter((key) => checklist[key] === "problem");
}

export function mentionedOk(checklist: Checklist): ChecklistKey[] {
  return CHECKLIST_KEYS.filter((key) => checklist[key] === "reported_ok");
}

export function notMentioned(checklist: Checklist): ChecklistKey[] {
  return CHECKLIST_KEYS.filter((key) => checklist[key] === "not_mentioned");
}
