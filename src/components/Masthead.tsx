import { compiledOn } from "../data/visits";
import { formatObservedOn } from "../lib/format";
import type { PageId } from "../types";

const PAGES: { id: PageId; label: string }[] = [
  { id: "map", label: "Field map" },
  { id: "record", label: "How this was made" },
  { id: "submit", label: "Add a sighting" },
];

export function Masthead({
  page,
  onPage,
  mappedCount,
}: {
  page: PageId;
  onPage: (page: PageId) => void;
  mappedCount: number;
}) {
  return (
    <header className="masthead">
      <div>
        <div className="masthead-kicker">
          <span>School Thik Karo</span>
          <span>·</span>
          <span>Field record</span>
          <span>·</span>
          <span>Compiled {formatObservedOn(compiledOn, "day")}</span>
        </div>
        <h1>A map of what the visits found</h1>
        <p>
          {mappedCount} schools placed from public reports — not the 1,200–1,500
          audits CJP says arrived in the first week. Pins mark neglect that was
          named with a place. Silence on a checklist item is left blank.
        </p>
      </div>
      <nav className="nav" aria-label="Record sections">
        {PAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={page === item.id ? "page" : undefined}
            onClick={() => onPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
