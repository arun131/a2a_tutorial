import { geoGraticule, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { coordinateNote } from "../lib/format";
import { severityOf } from "../lib/severity";
import type { Severity, Visit } from "../types";
import { Legend } from "./Legend";

const SKIP = new Set(["Andaman and Nicobar", "Lakshadweep"]);

const PIN_COLOR: Record<Severity, string> = {
  critical: "#8f2d1f",
  serious: "#d26418",
  notable: "#c9a227",
  incomplete: "#6d6558",
};

interface StateProps {
  name: string;
}

export function FieldMap({
  visits,
  selectedId,
  onSelect,
}: {
  visits: Visit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 640 });
  const [geo, setGeo] = useState<FeatureCollection<Geometry, StateProps> | null>(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({
        width: Math.max(320, rect.width),
        height: Math.max(360, rect.height),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/india-states.json")
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry, StateProps>) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setGeo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mainland = useMemo(() => {
    if (!geo) return null;
    return {
      ...geo,
      features: geo.features.filter((feature) => !SKIP.has(feature.properties.name)),
    };
  }, [geo]);

  const projection = useMemo(() => {
    const proj = geoMercator();
    if (mainland) {
      proj.fitExtent(
        [
          [24, 18],
          [size.width - 18, size.height - 28],
        ],
        mainland,
      );
    } else {
      proj.center([80, 22.8]).scale(size.width * 1.45).translate([size.width / 2, size.height / 2]);
    }
    return proj;
  }, [mainland, size]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule().step([4, 4])(), []);

  const visitedStates = useMemo(() => new Set(visits.map((visit) => visit.state)), [visits]);
  const selected = visits.find((visit) => visit.id === selectedId) ?? null;

  const mappedVisits = visits.filter((visit) => visit.lat !== 0 && visit.lng !== 0);

  return (
    <div className="map-pane" ref={wrapRef}>
      <svg
        className="field-map"
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label="Custom-drawn map of India with school visit pins"
      >
        <rect width={size.width} height={size.height} fill="#efe6d2" />
        <path className="graticule" d={path(graticule as GeoPermissibleObjects) ?? ""} />
        {mainland?.features.map((feature) => {
          const name = feature.properties.name;
          const hasVisit = [...visitedStates].some((state) => matchesState(state, name));
          const isActive = selected ? matchesState(selected.state, name) : false;
          return (
            <path
              key={name}
              className={`state-path${hasVisit ? " has-visit" : ""}${isActive ? " is-active" : ""}`}
              d={path(feature) ?? ""}
            />
          );
        })}
        {mappedVisits.map((visit) => {
          const point = projection([visit.lng, visit.lat]);
          if (!point) return null;
          const [x, y] = point;
          const severity = severityOf(visit);
          const selectedPin = visit.id === selectedId;
          const r = selectedPin ? 8 : 5.2;
          return (
            <g
              key={visit.id}
              className={`pin${selectedPin ? " is-selected" : ""}${visit.recordKind === "local_lead" ? " is-lead" : ""}`}
              transform={`translate(${x},${y})`}
              onClick={() => onSelect(visit.id)}
            >
              {visit.followUp === "repairs_claimed" && (
                <circle className="pin-ring" r={r + 5} stroke="#3d5a3c" />
              )}
              {selectedPin && <circle className="pin-ring" r={r + 8} stroke="#231c14" />}
              <circle
                className={`pin-core${severity === "incomplete" ? " is-hollow" : ""}`}
                r={r}
                fill={PIN_COLOR[severity]}
              />
              <title>
                {visit.schoolName} — {severity}
              </title>
            </g>
          );
        })}
      </svg>
      <aside className="cartouche">
        <strong>Plate I · Republic of India</strong>
        <p>
          Ink outline from a simplified state file. Island territories omitted so
          the mainland and the Northeast can share a sheet.{" "}
          {selected ? coordinateNote(selected.coordinatePrecision) : "Select a pin or a row."}
        </p>
        <Legend />
      </aside>
    </div>
  );
}

function displayState(name: string): string {
  if (name === "Orissa") return "Odisha";
  if (name === "Uttaranchal") return "Uttarakhand";
  return name;
}

function matchesState(visitState: string, mapName: string): boolean {
  const display = displayState(mapName);
  if (visitState === display || visitState === mapName) return true;
  if (visitState === "Odisha" && mapName === "Orissa") return true;
  if (visitState === "Uttarakhand" && mapName === "Uttaranchal") return true;
  return false;
}
