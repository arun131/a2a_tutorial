import { SEVERITY_LABELS } from "../lib/severity";
import type { Severity } from "../types";

const ORDER: Severity[] = ["critical", "serious", "notable", "incomplete"];

const COLORS: Record<Severity, string> = {
  critical: "#8f2d1f",
  serious: "#c05621",
  notable: "#9a7424",
  incomplete: "#6d6558",
};

export function Legend() {
  return (
    <div className="legend" aria-label="Severity colours">
      {ORDER.map((key) => (
        <span key={key}>
          <i style={{ background: COLORS[key] }} />
          {SEVERITY_LABELS[key]}
        </span>
      ))}
      <span>
        <i style={{ background: "#3d5a3c" }} />
        Repair claimed
      </span>
    </div>
  );
}
