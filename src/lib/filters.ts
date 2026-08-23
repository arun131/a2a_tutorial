import { severityOf } from "./severity";
import type { AuditKey, Severity, Visit } from "../types";

export interface VisitFilters {
  query: string;
  state: string;
  severity: "" | Severity;
  category: "" | AuditKey;
}

export const emptyFilters: VisitFilters = {
  query: "",
  state: "",
  severity: "",
  category: "",
};

export function uniqueStates(visits: Visit[]): string[] {
  return [...new Set(visits.map((visit) => visit.state).filter(Boolean))].sort();
}

export function filterVisits(visits: Visit[], filters: VisitFilters): Visit[] {
  const query = filters.query.trim().toLowerCase();
  return visits.filter((visit) => {
    if (filters.state && visit.state !== filters.state) return false;
    if (filters.severity && severityOf(visit) !== filters.severity) return false;
    if (filters.category && visit.answers[filters.category] !== "no") return false;
    if (!query) return true;
    const hay = [
      visit.schoolName,
      visit.village,
      visit.block,
      visit.district,
      visit.state,
      visit.summary,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });
}

const ORDER: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  notable: 2,
  incomplete: 3,
};

export function sortVisits(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => {
    const bySeverity = ORDER[severityOf(a)] - ORDER[severityOf(b)];
    if (bySeverity !== 0) return bySeverity;
    return b.observedOn.localeCompare(a.observedOn);
  });
}
