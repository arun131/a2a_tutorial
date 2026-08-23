import { harvestDashboard } from "../data/harvest";
import { formatShortPlace } from "../lib/format";

export function HarvestDashboard({
  onOpenPlace,
}: {
  onOpenPlace: (visitId: string) => void;
}) {
  const d = harvestDashboard;
  const states = new Set(d.locations.map((row) => row.state).filter(Boolean));

  return (
    <section className="panel harvest-dash">
      <h2>X harvest dashboard</h2>
      <p className="lede">
        Every public X post we could prove from 15 August 2026 onward, read
        one-by-one, then grouped by the place the text actually names. Nothing
        here is invented. Instagram and WhatsApp — where CJP says most films
        live — are not in this net yet.
      </p>

      <div className="stat-grid">
        <Stat n={d.harvestedPosts} label="X posts harvested" note="Official API · cap 600" />
        <Stat n={d.reviewedPosts} label="Campaign posts read" note="Post-by-post, no regex" />
        <Stat n={d.postsWithNamedPlace} label="Named a place" note={`${d.skippedGeneric} generic / no village`} />
        <Stat n={d.locationGroups} label="Locations accepted" note={`${states.size} states · all pinned`} />
        <Stat n={d.mapPins} label="Pins on the map" note="News + X harvest" />
        <Stat n={d.invented} label="Invented rows" note="Zero. Always." />
      </div>

      <div className="note-box">
        <strong>Why this is not hundreds of villages</strong>
        <p>
          The campaign has thousands of posts. This harvest is 600 real API
          rows. Most of those are the same five incidents (Jaipur clash,
          Rampura Kanwarpura buffalo-shed school, Bagru, Latur, Santuk Pimpri)
          plus promo copy that never names a village. To get hundreds of
          distinct villages we need Instagram reels — or a larger X pull.
        </p>
      </div>

      <h3 className="serif">Accepted locations · click a row to open the pin</h3>
      <table className="harvest-table">
        <thead>
          <tr>
            <th>Posts</th>
            <th>Place</th>
            <th>State</th>
            <th>Proof</th>
          </tr>
        </thead>
        <tbody>
          {d.locations.map((row) => (
            <tr
              key={row.visitId}
              className="harvest-row"
              onClick={() => onOpenPlace(row.visitId)}
            >
              <td className="num">{row.sourceCount}</td>
              <td>
                {formatShortPlace({
                  village: row.village,
                  district: row.district,
                  state: row.state,
                })}
                {!row.village && (
                  <span className="meta-line"> · district / city only</span>
                )}
              </td>
              <td>{row.state}</td>
              <td className="num">{row.proofCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta-line">
        Compiled {d.compiledOn}. Cutoff {d.cutoff}. {d.accepted} accepted
        groups · {d.postsWithNamedPlace} posts with a named place ·{" "}
        {d.skippedGeneric} skipped because the text named no village or
        district.
      </p>
    </section>
  );
}

function Stat({ n, label, note }: { n: number; label: string; note: string }) {
  return (
    <div className="stat-card">
      <div className="stat-n">{n.toLocaleString("en-IN")}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}
