import { AUDIT_QUESTIONS, OVERALL_LABELS, STATUS_LABELS } from "../data/checklist";
import { coordinateNote, formatObservedOn, formatPlace } from "../lib/format";
import { SEVERITY_BLURBS, SEVERITY_LABELS, severityOf } from "../lib/severity";
import type { Visit } from "../types";

const AUDIT_LABEL = {
  completed: "Form described",
  partial: "Partial form",
  blocked: "Visit blocked",
  findings_unpublished: "Findings not published",
} as const;

const SOURCE_KIND = {
  cjp_campaign: "CJP campaign visit",
  news_field_report: "News field report",
  volunteer_video: "Volunteer / campaign video",
  x_post: "X post",
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
            {formatObservedOn(visit.observedOn, visit.datePrecision)}
            {visit.timeOfVisit ? ` · ${visit.timeOfVisit}` : ""} · {visit.visitor}
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
        <span className="badge">{OVERALL_LABELS[visit.overallCondition]}</span>
        {visit.followUp === "repairs_claimed" && <span className="badge repair">Repair claimed</span>}
        {visit.recordKind === "local_lead" && <span className="badge lead">Unreviewed lead</span>}
        {visit.recordKind === "x_draft" && (
          <span className="badge lead">
            X harvest{visit.ingestStatus === "accepted" ? " · accepted" : ""}
          </span>
        )}
        {!visit.schoolNameKnown && <span className="badge incomplete">Name unconfirmed</span>}
      </div>

      <p>{visit.summary}</p>
      <p className="meta-line">
        {SEVERITY_BLURBS[severity]} {coordinateNote(visit.coordinatePrecision)}
      </p>

      <dl className="identity-grid">
        <div>
          <dt>UDISE</dt>
          <dd>{visit.udiseCode ?? "Not in source"}</dd>
        </div>
        <div>
          <dt>Gram panchayat</dt>
          <dd>{visit.gramPanchayat ?? "Not in source"}</dd>
        </div>
        <div>
          <dt>Classes covered</dt>
          <dd>{visit.classesCovered ?? "Not in source"}</dd>
        </div>
        <div>
          <dt>Students / teachers</dt>
          <dd>
            {visit.studentCount ?? "—"} / {visit.teacherCount ?? "—"}
          </dd>
        </div>
      </dl>

      <h3 className="serif">10-point audit — 20 questions</h3>
      <table className="checklist">
        <thead>
          <tr>
            <th>Item</th>
            <th>YES / NO / N/A</th>
          </tr>
        </thead>
        <tbody>
          {AUDIT_QUESTIONS.flatMap((q, index) => {
            const status = visit.answers[q.key];
            const prev = AUDIT_QUESTIONS[index - 1];
            const rows = [];
            if (!prev || prev.section !== q.section) {
              rows.push(
                <tr key={q.section} className="section-row">
                  <td colSpan={2}>{q.section}</td>
                </tr>,
              );
            }
            rows.push(
              <tr key={q.key}>
                <td>
                  {q.n}. {q.prompt}
                </td>
                <td className={status}>{STATUS_LABELS[status]}</td>
              </tr>,
            );
            return rows;
          })}
        </tbody>
      </table>
      <p className="meta-line">
        These are the boxes on Cockroach Janta Party’s government-school survey
        form. “Not mentioned” is not YES. Q16 and Q17 are printed twice on the
        paper sheet.
      </p>

      {visit.topConcerns.some(Boolean) && (
        <>
          <h3 className="serif">Top concerns</h3>
          <ol className="prose-list">
            {visit.topConcerns.filter(Boolean).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </>
      )}

      {visit.additionalComments && <p>{visit.additionalComments}</p>}
      {visit.agentReasoning && (
        <p className="meta-line">Agent reasoning: {visit.agentReasoning}</p>
      )}

      <h3 className="serif">What was reported</h3>
      <ul className="prose-list">
        {visit.findings.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {visit.unknowns.length > 0 && (
        <>
          <h3 className="serif">What was not confirmed</h3>
          <ul className="prose-list">
            {visit.unknowns.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}

      {visit.criticalNotes.length > 0 && (
        <>
          <h3 className="serif">Critical notes</h3>
          <ul className="prose-list">
            {visit.criticalNotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}

      {visit.followUpNote && (
        <p className="meta-line">
          Follow-up: {visit.followUpNote}
        </p>
      )}

      <h3 className="serif">Sources</h3>
      <ul className="prose-list">
        {visit.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.title}
            </a>
            <span className="meta-line">
              {" "}
              · {source.publisher}
              {source.publishedOn ? ` · ${source.publishedOn}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
