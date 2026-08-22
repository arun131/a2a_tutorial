import { useState, type FormEvent } from "react";
import { CHECKLIST_KEYS, CHECKLIST_HINTS, CHECKLIST_LABELS } from "../data/checklist";
import {
  downloadLeads,
  draftToVisit,
  emptyDraft,
  validateDraft,
  type LeadDraft,
} from "../lib/leads";
import type { CategoryStatus, Visit } from "../types";

export function SubmitLead({
  leads,
  onSave,
}: {
  leads: Visit[];
  onSave: (leads: Visit[]) => void;
}) {
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const visit = draftToVisit(draft, leads.length);
    onSave([...leads, visit]);
    setDraft(emptyDraft());
    setSaved(true);
  }

  return (
    <section className="panel">
      <h2>Add a sighting</h2>
      <p className="lede">
        Use this if you have seen a School Thik Karo post or news report that
        is not on the map. Say what the source said. Do not fill gaps with
        guesses. The sighting stays on this device until it is reviewed into
        the public file — it will not appear as a pin.
      </p>

      <form className="form" onSubmit={submit}>
        <label>
          School name
          <input
            value={draft.schoolName}
            onChange={(event) => update("schoolName", event.target.value)}
            placeholder="Zilla Parishad school, …"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={!draft.schoolNameKnown}
            onChange={(event) => update("schoolNameKnown", !event.target.checked)}
          />{" "}
          The source does not name the school
        </label>
        <label>
          Village (if known)
          <input
            value={draft.village}
            onChange={(event) => update("village", event.target.value)}
          />
        </label>
        <label>
          District
          <input
            value={draft.district}
            onChange={(event) => update("district", event.target.value)}
            required
          />
        </label>
        <label>
          State
          <input
            value={draft.state}
            onChange={(event) => update("state", event.target.value)}
            required
          />
        </label>
        <label>
          Date of visit or post
          <input
            type="date"
            value={draft.observedOn}
            onChange={(event) => update("observedOn", event.target.value)}
          />
        </label>
        <label>
          Who visited or filmed
          <input
            value={draft.visitor}
            onChange={(event) => update("visitor", event.target.value)}
            placeholder="Volunteer name, or “unnamed in the post”"
          />
        </label>
        <fieldset className="check-grid">
          <legend className="serif">Checklist — only mark what the source showed</legend>
          {CHECKLIST_KEYS.map((key) => (
            <label className="check-row" key={key}>
              <span>
                {CHECKLIST_LABELS[key]}
                <div className="meta-line">{CHECKLIST_HINTS[key]}</div>
              </span>
              <select
                value={draft.checklist[key]}
                onChange={(event) =>
                  update("checklist", {
                    ...draft.checklist,
                    [key]: event.target.value as CategoryStatus,
                  })
                }
              >
                <option value="not_mentioned">Not mentioned</option>
                <option value="problem">Flagged as a problem</option>
                <option value="reported_ok">Reported as all right</option>
              </select>
            </label>
          ))}
        </fieldset>
        <label>
          Plain-language summary
          <textarea
            value={draft.summary}
            onChange={(event) => update("summary", event.target.value)}
            placeholder="What did the post or article actually show?"
          />
        </label>
        <label>
          Source link
          <input
            type="url"
            value={draft.sourceUrl}
            onChange={(event) => update("sourceUrl", event.target.value)}
            placeholder="https://"
            required
          />
        </label>
        <label>
          Source title (optional)
          <input
            value={draft.sourceTitle}
            onChange={(event) => update("sourceTitle", event.target.value)}
          />
        </label>
        {errors.length > 0 && (
          <ul className="errors">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        {saved && (
          <p className="badge repair" style={{ justifySelf: "start" }}>
            Saved on this browser
          </p>
        )}
        <button className="primary-btn" type="submit">
          Save sighting on this device
        </button>
      </form>

      {leads.length > 0 && (
        <div style={{ marginTop: "1.6rem" }}>
          <h3 className="serif">
            {leads.length} unreviewed sighting{leads.length === 1 ? "" : "s"} on this
            device
          </h3>
          <ul className="prose-list">
            {leads.map((lead) => (
              <li key={lead.id}>
                {lead.schoolName}, {lead.district}, {lead.state}
              </li>
            ))}
          </ul>
          <button type="button" className="text-btn" onClick={() => downloadLeads(leads)}>
            Download JSON
          </button>
        </div>
      )}
    </section>
  );
}
