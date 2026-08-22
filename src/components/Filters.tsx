import { CHECKLIST_KEYS, CHECKLIST_LABELS } from "../data/checklist";
import type { VisitFilters } from "../lib/filters";
import { SEVERITY_LABELS } from "../lib/severity";
import type { Severity } from "../types";

const SEVERITIES = Object.keys(SEVERITY_LABELS) as Severity[];

export function Filters({
  filters,
  states,
  shown,
  total,
  onChange,
}: {
  filters: VisitFilters;
  states: string[];
  shown: number;
  total: number;
  onChange: (next: VisitFilters) => void;
}) {
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search school, village, district…"
        value={filters.query}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
        aria-label="Search visits"
      />
      <div className="filters-row">
        <select
          value={filters.state}
          onChange={(event) => onChange({ ...filters, state: event.target.value })}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <select
          value={filters.severity}
          onChange={(event) =>
            onChange({ ...filters, severity: event.target.value as VisitFilters["severity"] })
          }
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((key) => (
            <option key={key} value={key}>
              {SEVERITY_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
      <select
        value={filters.category}
        onChange={(event) =>
          onChange({ ...filters, category: event.target.value as VisitFilters["category"] })
        }
        aria-label="Filter by flagged category"
      >
        <option value="">Any flagged category</option>
        {CHECKLIST_KEYS.map((key) => (
          <option key={key} value={key}>
            {CHECKLIST_LABELS[key]} flagged
          </option>
        ))}
      </select>
      <p className="counts">
        Showing {shown} of {total} placed records. Filters only count a category
        when a source flagged it — not when it was left unmentioned.
      </p>
    </div>
  );
}
