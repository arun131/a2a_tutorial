import { CHECKLIST_KEYS, CHECKLIST_LABELS, STATUS_LABELS } from "../data/checklist";
import { coordinateNote, formatObservedOn, formatPlace } from "../lib/format";
import { SEVERITY_BLURBS, SEVERITY_LABELS, severityOf } from "../lib/severity";
import type { Visit } from "../types";

const AUDIT_LABEL = {
  completed: "Checklist described",
  partial: "Partial checklist",
  blocked: "Visit blocked",
  findings_unpublished: "Findings not published",
} as const;

const SOURCE_KIND = {
  cjp_campaign: "CJP campaign visit",
  news_field_report: "News field report",
  volunteer_video: "Volunteer / campaign video",
} as const;

export function Dossier({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const severity = severityOf(visit);

  return (
    <article className="dossier">
      <div className="dossier-head">
        <div>
          <p className="place-line">{formatPlace(visit)}</p>
          <h2>{visit.schoolName}</h2>
          <p className="meta-line">
            {formatObservedOn(visit.observedOn, visit.datePrecision)} · {visit.visitor}
          </p>
        </div>
        <button type="button" className="close-btn" onClick={onClose}>
          Close sheet
        </button>
      </div>

      <div className="stamp-row">
        <span className={`badge ${severity}`}>{SEVERITY_LABELS[severity]}</span>
        <span className="badge incomplete">{AUDIT_LABEL[visit.auditStatus]}</span>
        <span className="badge">{SOURCE_KIND[visit.sourceKind]}</span>
        {visit.followUp === "repairs_claimed" && <span className="badge repair">Repair claimed</span>}
        {visit.recordKind === "local_lead" && <span className="badge lead">Unreviewed lead</span>}
        {!visit.schoolNameKnown && <span className="badge incomplete">Name unconfirmed</span>}
      </div>

      <p>{visit.summary}</p>
      <p className="meta-line">
        {SEVERITY_BLURBS[severity]} {coordinateNote(visit.coordinatePrecision)}
      </p>

      <h3 className="serif">Checklist</h3>
      <table className="checklist">
        <thead>
          <tr>
            <th>Item</th>
            <th>What the source said</th>
          </tr>
        </thead>
        <tbody>
          {CHECKLIST_KEYS.map((key) => {
            const status = visit.checklist[key];
            return (
              <tr key={key}>
                <td>{CHECKLIST_LABELS[key]}</td>
                <td className={status}>{STATUS_LABELS[status]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="meta-line">
        Furniture is on CJP’s own form. The other six items are the campaign’s
        basic public checklist. “Not mentioned” is not the same as “all right”.
      </p>

      <h3 className="serif">What was reported</h3>
      <ul className="prose-list">
        {visit.findings.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h3 className="serif">What is not confirmed</h3>
      <ul className="prose-list">
        {visit.unknowns.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {visit.followUpNote && (
        <>
          <h3 className="serif">Afterwards</h3>
          <p>{visit.followUpNote}</p>
        </>
      )}

      <h3 className="serif">Sources</h3>
      <ul className="source-list">
        {visit.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
            <div className="meta-line">
              {source.publisher}
              {source.publishedOn ? ` · ${source.publishedOn}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
