import { SHORT_LABELS, flaggedProblems } from "../data/checklist";
import { formatObservedOn, formatShortPlace } from "../lib/format";
import { SEVERITY_LABELS, severityOf } from "../lib/severity";
import type { Visit } from "../types";

export function VisitList({
  visits,
  selectedId,
  onSelect,
}: {
  visits: Visit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (visits.length === 0) {
    return (
      <div className="visit-list">
        <p className="panel lede">No visits match these filters.</p>
      </div>
    );
  }

  return (
    <div className="visit-list" role="list">
      {visits.map((visit, index) => {
        const severity = severityOf(visit);
        const problems = flaggedProblems(visit.answers);
        const selected = visit.id === selectedId;
        return (
          <button
            key={visit.id}
            type="button"
            role="listitem"
            className={`visit-item${selected ? " is-selected" : ""}`}
            data-visit-id={visit.id}
            onClick={() => onSelect(visit.id)}
            aria-current={selected ? "true" : undefined}
          >
            <div className="visit-item-top">
              <p className="place-line">
                {String(index + 1).padStart(2, "0")} · {formatShortPlace(visit)}
              </p>
              <span className={`badge ${severity}`}>{SEVERITY_LABELS[severity]}</span>
            </div>
            <h3>{visit.schoolName}</h3>
            <p className="meta-line">
              {formatObservedOn(visit.observedOn, visit.datePrecision)}
              {problems.length > 0
                ? ` · ${problems.map((key) => SHORT_LABELS[key]).join(", ")}`
                : " · Form not filled"}
              {visit.followUp === "repairs_claimed" ? " · Repair claimed" : ""}
              {visit.recordKind === "local_lead" ? " · Local sighting" : ""}
              {visit.recordKind === "x_draft"
                ? ` · X harvest · ${visit.sources.length} proof link${visit.sources.length === 1 ? "" : "s"}`
                : ""}
            </p>
          </button>
        );
      })}
    </div>
  );
}
