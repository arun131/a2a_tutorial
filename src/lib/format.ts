import type { CoordinatePrecision, DatePrecision, Visit } from "../types";

export function formatObservedOn(iso: string, precision: DatePrecision | "day" = "day"): string {
  const raw = iso.trim();
  if (!raw) return "Date not given";
  const day = raw.slice(0, 10);
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month) return raw;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (precision === "month" || !date) return `${months[month - 1]} ${year}`;
  if (precision === "week") return `Week of ${date} ${months[month - 1]} ${year}`;
  return `${date} ${months[month - 1]} ${year}`;
}

export function formatPlace(visit: Pick<Visit, "village" | "block" | "district" | "state">): string {
  return [visit.village, visit.block, visit.district, visit.state].filter(Boolean).join(", ");
}

export function formatShortPlace(visit: {
  village?: string | null;
  district?: string | null;
  state?: string | null;
}): string {
  return [visit.village || visit.district, visit.state].filter(Boolean).join(", ");
}

export function coordinateNote(precision: CoordinatePrecision): string {
  switch (precision) {
    case "village_approx":
      return "Pin is a village approximation — not a GPS fix on the school gate.";
    case "block_approx":
      return "Pin is a block approximation.";
    case "city_approx":
      return "Pin is a city approximation.";
    default:
      return "Pin is a district approximation.";
  }
}
