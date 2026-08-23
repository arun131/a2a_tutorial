export function AboutRecord() {
  return (
    <section className="panel">
      <h2>How this record was made</h2>
      <p className="lede">
        Cockroach Janta Party launched School Thik Karo on 15 August 2026 from
        Santuk Pimpri in Hingoli. Volunteers fill the party’s government-school
        survey — the 10-point / 20-question form on page 1 of their field
        sheet, including place identification — and post evidence. Those posts
        are scattered. This page gathers the visits that public reporting has
        already named with a place, and leaves the rest off the map on purpose.
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
          Official-form boxes marked YES / NO / N/A only when the source said
          so. If the article or post is silent, the box stays{" "}
          <em>not mentioned</em>. Silence is never treated as a pass.
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
        up, classes under tarpaulin or in a livestock shed, or the form was
        marked URGENT ACTION. Serious means Q4/Q15 was marked NO, three or more
        official-form items were marked NO, or the form said SERIOUS CONCERN.
        Notable means at least one item was marked NO. Incomplete means the
        visit was blocked or the findings were not published. A green ring
        means someone claimed a repair — usually a sarpanch talking to PTI.
        That is not the same as a second audit.
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

      <h3 className="serif">The official form</h3>
      <p>
        Page 1 of CJP’s field sheet is the government-school survey: date and
        time of visit, school name, UDISE, surveyor, village, gram panchayat,
        district, classes, student and teacher counts, then twenty YES / NO /
        N/A questions, three top concerns, an overall mark, and a photo box.
        That is the locked format used here. Page 2 is the code of conduct —
        observe, do not fight, do not post the findings yourself; they go
        through CJP first.
      </p>

      <h3 className="serif">X harvest</h3>
      <p>
        The first public net is X: @Cockroachisback, @abhijeet_dipke, and
        #SchoolThikKaro, using the official X API. Every harvested post is
        dated on or after the 15 August 2026 launch — Dipke’s older timeline
        is left out. The script writes every post it can prove into{" "}
        <code>data/x-harvest/</code>. The target is 600 posts. That number is
        not invented if search returns fewer. A draft 10-point form is filled
        only when a post names a village or district. Posts that name the
        same place are combined on one draft — extra URLs are proof, not extra
        rows. Accepted rows from the X harvest are pinned with{" "}
        <code>ingestStatus: accepted</code>. Unmentioned questions stay blank.
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
