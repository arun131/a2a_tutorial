import { describe, expect, it } from "vitest";
import { harvestDashboard } from "../data/harvest";
import { visits } from "../data/visits";

describe("harvest dashboard", () => {
  it("keeps accepted locations aligned with map pins", () => {
    const ids = new Set(visits.map((visit) => visit.id));
    expect(harvestDashboard.harvestedPosts).toBe(600);
    expect(harvestDashboard.invented).toBe(0);
    expect(harvestDashboard.locations).toHaveLength(harvestDashboard.locationGroups);
    const named = harvestDashboard.locations.reduce((sum, row) => sum + row.sourceCount, 0);
    expect(named).toBe(harvestDashboard.postsWithNamedPlace);
    for (const row of harvestDashboard.locations) {
      expect(ids.has(row.visitId)).toBe(true);
    }
  });
});
