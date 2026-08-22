import { geoGraticule, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { coordinateNote } from "../lib/format";
import { severityOf } from "../lib/severity";
import type { Severity, Visit } from "../types";
import { Legend } from "./Legend";

const PIN_COLOR: Record<Severity, string> = {
  critical: "#8f2d1f",
  serious: "#d26418",
  notable: "#c9a227",
  incomplete: "#6d6558",
};

interface StateProps {
  name: string;
}

type StateFeature = Feature<Geometry, StateProps>;

function isAndaman(name: string): boolean {
  return /andaman/i.test(name);
}

function isLakshadweep(name: string): boolean {
  return /lakshadweep/i.test(name);
}

function isIsland(name: string): boolean {
  return isAndaman(name) || isLakshadweep(name);
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
    fetch(`${import.meta.env.BASE_URL}india-states.json`)
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
      features: geo.features.filter((feature) => !isIsland(feature.properties.name)),
    };
  }, [geo]);

  const andaman = useMemo(
    () => geo?.features.filter((feature) => isAndaman(feature.properties.name)) ?? [],
    [geo],
  );
  const lakshadweep = useMemo(
    () => geo?.features.filter((feature) => isLakshadweep(feature.properties.name)) ?? [],
    [geo],
  );

  const insetBoxes = useMemo(() => {
    const w = size.width;
    const h = size.height;
    return {
      lakshadweep: { x: 14, y: h - h * 0.3 - 14, w: w * 0.2, h: h * 0.28 },
      andaman: { x: w - w * 0.22 - 14, y: h - h * 0.36 - 14, w: w * 0.22, h: h * 0.34 },
    };
  }, [size]);

  const projection = useMemo(() => {
    const proj = geoMercator();
    if (mainland) {
      proj.fitExtent(
        [
          [20, 10],
          [size.width - 16, size.height - 16],
        ],
        mainland,
      );
    } else {
      proj.center([80, 23.5]).scale(size.width * 1.35).translate([size.width / 2, size.height / 2]);
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
        aria-label="Official map of India with school visit pins"
      >
        <rect width={size.width} height={size.height} fill="#efe6d2" />
        <path className="graticule" d={path(graticule as GeoPermissibleObjects) ?? ""} />
        {mainland?.features.map((feature) => (
          <StatePath
            key={feature.properties.name}
            feature={feature}
            d={path(feature) ?? ""}
            visitedStates={visitedStates}
            selected={selected}
          />
        ))}
        {mappedVisits.map((visit) => {
          const point = projection([visit.lng, visit.lat]);
          if (!point) return null;
          const [x, y] = point;
          return (
            <Pin
              key={visit.id}
              x={x}
              y={y}
              visit={visit}
              selected={visit.id === selectedId}
              onSelect={onSelect}
            />
          );
        })}
        <Inset
          title="Lakshadweep"
          box={insetBoxes.lakshadweep}
          features={lakshadweep}
          visitedStates={visitedStates}
          selected={selected}
        />
        <Inset
          title="Andaman & Nicobar Islands"
          box={insetBoxes.andaman}
          features={andaman}
          visitedStates={visitedStates}
          selected={selected}
        />
      </svg>
      <aside className="cartouche">
        <strong>Plate I · Republic of India</strong>
        <p>
          Official map of India as recognised by the Government of India /
          Survey of India. Jammu & Kashmir and Ladakh are shown in full official
          extent. Island territories are inset.{" "}
          {selected ? coordinateNote(selected.coordinatePrecision) : "Select a pin or a row."}
        </p>
        <Legend />
      </aside>
    </div>
  );
}

function StatePath({
  feature,
  d,
  visitedStates,
  selected,
}: {
  feature: StateFeature;
  d: string;
  visitedStates: Set<string>;
  selected: Visit | null;
}) {
  const name = feature.properties.name;
  const hasVisit = [...visitedStates].some((state) => matchesState(state, name));
  const isActive = selected ? matchesState(selected.state, name) : false;
  return (
    <path
      className={`state-path${hasVisit ? " has-visit" : ""}${isActive ? " is-active" : ""}`}
      d={d}
    />
  );
}

function Pin({
  x,
  y,
  visit,
  selected,
  onSelect,
}: {
  x: number;
  y: number;
  visit: Visit;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const severity = severityOf(visit);
  const r = selected ? 8 : 5.2;
  return (
    <g
      className={`pin${selected ? " is-selected" : ""}${visit.recordKind === "local_lead" ? " is-lead" : ""}`}
      transform={`translate(${x},${y})`}
      onClick={() => onSelect(visit.id)}
    >
      {visit.followUp === "repairs_claimed" && (
        <circle className="pin-ring" r={r + 5} stroke="#3d5a3c" />
      )}
      {selected && <circle className="pin-ring" r={r + 8} stroke="#231c14" />}
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
}

function Inset({
  title,
  box,
  features,
  visitedStates,
  selected,
}: {
  title: string;
  box: { x: number; y: number; w: number; h: number };
  features: StateFeature[];
  visitedStates: Set<string>;
  selected: Visit | null;
}) {
  const collection: FeatureCollection<Geometry, StateProps> = {
    type: "FeatureCollection",
    features,
  };
  const proj = geoMercator();
  if (features.length) {
    proj.fitExtent(
      [
        [box.x + 10, box.y + 22],
        [box.x + box.w - 10, box.y + box.h - 8],
      ],
      collection,
    );
  }
  const insetPath = geoPath(proj);

  return (
    <g className="map-inset">
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill="#f4ead4"
        stroke="#3d3226"
        strokeWidth={0.9}
      />
      <text x={box.x + 8} y={box.y + 14} className="inset-label">
        {title}
      </text>
      {features.map((feature) => (
        <StatePath
          key={feature.properties.name}
          feature={feature}
          d={insetPath(feature) ?? ""}
          visitedStates={visitedStates}
          selected={selected}
        />
      ))}
    </g>
  );
}

function matchesState(visitState: string, mapName: string): boolean {
  if (visitState === mapName) return true;
  if (visitState === "Odisha" && mapName === "Orissa") return true;
  if (visitState === "Uttarakhand" && mapName === "Uttaranchal") return true;
  if (visitState === "Jammu and Kashmir" && /jammu/i.test(mapName)) return true;
  return false;
}
