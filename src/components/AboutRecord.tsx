export function AboutRecord() {
  return (
    <section className="panel">
      <h2>How this record was made</h2>
      <p className="lede">
        Cockroach Janta Party launched School Thik Karo on 15 August 2026 from
        Santuk Pimpri in Hingoli. Volunteers visit government schools, film a
        basic checklist, and post the evidence. Those posts are scattered.
        This page gathers the visits that public reporting has already named
        with a place, and leaves the rest off the map on purpose.
      </p>

      <div className="note-box">
        <strong>This is not an official CJP product.</strong>
        <p>
          It is an independent compilation for a public record. CJP’s
          spokesperson told Careers360 that 1,200–1,500 people joined the first
          wave, and that Instagram and WhatsApp videos are their main proof.
          Most of those films are not transcribed here. A thin map is more
          honest than a guessed one.
        </p>
      </div>

      <h3 className="serif">What each pin is allowed to claim</h3>
      <ul className="prose-list">
        <li>
          A school or a place that a newsroom or a named campaign post actually
          used — village, block, district, or city.
        </li>
        <li>
          A plain-language summary of what that source said, with the link back.
        </li>
        <li>
          Checklist boxes marked <em>problem</em> only when the source said so.
          If the article is silent, the box stays <em>not mentioned</em>. Those
          two states are never treated as the same.
        </li>
        <li>
          Coordinates at village, block, district, or city approximation — never
          a pretended GPS fix on the school gate.
        </li>
      </ul>

      <h3 className="serif">What was left off the map</h3>
      <p>
        National Herald mentions campaign videos from Mizoram, Dehradun,
        Nalanda, and Bhagwanpur without enough of a place-name to pin without
        guessing. Dipke has said he visited more than twenty rural schools and
        “not found even a single good school.” Those unnamed tours are not
        invented as dots. Mumbai Mirror’s account of a Hingoli principal
        allegedly drinking on campus is also omitted: the paper said it could
        not independently verify the claim, and no school checklist was
        attached.
      </p>

      <h3 className="serif">Severity</h3>
      <p>
        Colour is a reading aid, not a government grade. Critical means a
        source described collapse risk, a toilet locked since the building went
        up, classes under tarpaulin or in a livestock shed, or a similar
        structural failure. Serious means safety was flagged, or three or more
        checklist items were. Notable means at least one item was flagged.
        Incomplete means the visit was blocked or the findings were not
        published. A green ring means someone claimed a repair — usually a
        sarpanch talking to PTI. That is not the same as a second audit.
      </p>

      <h3 className="serif">The map</h3>
      <p>
        The plate uses the official map of India as recognised by the
        Government of India and the Survey of India — including the full
        official extent of Jammu & Kashmir and Ladakh, and inset plates for
        Lakshadweep and the Andaman & Nicobar Islands. It is not a
        Line-of-Control cut-off map. Pins still sit on village or district
        approximations from the reports.
      </p>

      <h3 className="serif">BBC schools in Faridabad</h3>
      <p>
        Three campuses in Khedi Kalan and Atmadpur come from BBC field
        reporting on the campaign, not from a CJP volunteer form. They are
        labelled as news field reports so they are not confused with citizen
        audits.
      </p>

      <h3 className="serif">How to add what we missed</h3>
      <p>
        If you have seen a post this file does not have — a named school, a
        village, a video — use “Add a sighting”. The form keeps the lead on
        this browser and lets you download JSON. It will not quietly invent a
        pin. Someone still has to read the source and place the school.
      </p>
    </section>
  );
}
