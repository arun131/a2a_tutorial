import { useEffect, useMemo, useState } from "react";
import { AboutRecord } from "./components/AboutRecord";
import { Dossier } from "./components/Dossier";
import { FieldMap } from "./components/FieldMap";
import { Filters } from "./components/Filters";
import { HarvestDashboard } from "./components/HarvestDashboard";
import { Masthead } from "./components/Masthead";
import { SubmitLead } from "./components/SubmitLead";
import { VisitList } from "./components/VisitList";
import { visits as publishedVisits } from "./data/visits";
import { emptyFilters, filterVisits, sortVisits, uniqueStates } from "./lib/filters";
import { loadLeads, saveLeads } from "./lib/leads";
import type { PageId, Visit } from "./types";

export function App() {
  const [page, setPage] = useState<PageId>("map");
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Visit[]>([]);

  useEffect(() => {
    setLeads(loadLeads());
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    document
      .querySelector(`[data-visit-id="${selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  const allRecords = useMemo(() => [...publishedVisits, ...leads], [leads]);
  const visible = useMemo(
    () => sortVisits(filterVisits(allRecords, filters)),
    [allRecords, filters],
  );

  const selected = allRecords.find((visit) => visit.id === selectedId) ?? null;

  function select(id: string) {
    setSelectedId((current) => (current === id ? null : id));
    setPage("map");
  }

  function persistLeads(next: Visit[]) {
    setLeads(next);
    saveLeads(next);
  }

  return (
    <div className="app">
      <Masthead page={page} onPage={setPage} mappedCount={publishedVisits.length} />
      {page === "map" ? (
        <div className="workspace">
          <div className="map-stack">
            <FieldMap visits={visible} selectedId={selectedId} onSelect={select} />
            {selected && (
              <div className="dossier-overlay">
                <Dossier visit={selected} onClose={() => setSelectedId(null)} />
              </div>
            )}
          </div>
          <aside className="side-pane">
            <Filters
              filters={filters}
              states={uniqueStates(publishedVisits)}
              shown={visible.filter((visit) => visit.recordKind !== "local_lead").length}
              total={publishedVisits.length}
              onChange={setFilters}
            />
            <VisitList visits={visible} selectedId={selectedId} onSelect={select} />
          </aside>
        </div>
      ) : page === "dashboard" ? (
        <HarvestDashboard
          onOpenPlace={(id) => {
            setSelectedId(id);
            setPage("map");
          }}
        />
      ) : page === "record" ? (
        <AboutRecord />
      ) : (
        <SubmitLead leads={leads} onSave={persistLeads} />
      )}
    </div>
  );
}
