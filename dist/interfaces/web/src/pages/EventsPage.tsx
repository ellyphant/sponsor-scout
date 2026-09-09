import { useState } from 'react';
import { Link } from 'wouter';
import {
  IconSearch,
  IconArrowUpRight,
  IconMapPin,
  IconUsers,
  IconCalendarEvent,
  IconShieldCheck,
  IconArrowRight,
  IconLock,
} from '@tabler/icons-react';
import { useStore } from '../store';
import { Badge, Button, Empty, Modal, dateLabel, shortId } from '../components/ui';
export function EventsPage() {
  const data = useStore((s) => s.data)!;
  const selectedRunId = useStore((s) => s.selectedRunId);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const run = data.runs.find((r) => r.id === selectedRunId) || data.runs[0];
  const event = run?.events.find((e) => e.id === selectedEvent);
  const cities = [...new Set(run?.events.map((e) => e.city) || [])];
  const list = (run?.events || []).filter(
    (e) =>
      (!city || e.city === city) &&
      `${e.title} ${e.vertical} ${e.city} ${e.sponsorshipNeed}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const assessments = data.assessments.filter((a) => a.runId === run?.id);
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LIVE DEMAND · COHOST CLUB</span>
          <h1>
            Events looking for a partner<span className="amber">.</span>
          </h1>
          <p>Real asks from event hosts. Kept exactly as they arrived.</p>
        </div>
        <Badge tone={run?.isSample ? 'amber' : 'muted'}>
          {run?.isSample ? 'SAMPLE SNAPSHOT' : 'READ-ONLY SNAPSHOT'}
        </Badge>
      </div>
      <div className="list-toolbar">
        <div className="inline">
          <select
            className="compact-select"
            aria-label="Event snapshot run"
            value={run?.id || ''}
            onChange={(e) => {
              setCity('');
              setSelectedEvent(null);
              void useStore.getState().openRun(e.target.value);
            }}
          >
            {!run && <option value="">No snapshots</option>}
            {data.runs.map((r) => (
              <option value={r.id} key={r.id}>
                {r.isSample ? 'Sample · ' : ''}
                {shortId(r.id)}
              </option>
            ))}
          </select>
          <select
            className="compact-select"
            aria-label="Filter events by city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="search-field">
          <IconSearch size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search events"
            placeholder="Search event demand"
          />
        </div>
      </div>
      {run && (
        <div className="snapshot-meta">
          <IconLock size={12} />
          <span>
            {run.events.length} events · captured {dateLabel(run.fetchedAt || run.startedAt, true)}
          </span>
          <span>
            {run.isSample
              ? 'Fictional fixture data, not a live CoHost response.'
              : run.snapshotNotes.join(' ') ||
                'Upcoming and explicitly seeking sponsorship when fetched.'}
          </span>
        </div>
      )}
      <div className="panel list-panel">
        {list.length ? (
          <div className="table-scroll">
            <table className="data-table event-table">
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>CITY / VERTICAL</th>
                  <th>DATE</th>
                  <th>CAPACITY</th>
                  <th>SPONSORSHIP ASK</th>
                  <th>FITS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    onClick={() => setSelectedEvent(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedEvent(item.id);
                    }}
                  >
                    <td>
                      <div className="table-stack">
                        <strong>{item.title}</strong>
                        <small>
                          {item.host.name}
                          {item.host.verified && <IconShieldCheck size={12} />}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="table-stack">
                        <span>{item.city}</span>
                        <small>{item.vertical}</small>
                      </div>
                    </td>
                    <td className="number">{dateLabel(item.date.unixMs)}</td>
                    <td className="number">{item.size.capacity ?? item.size.bucket}</td>
                    <td>
                      <p className="ask-excerpt">
                        {item.sponsorshipNeed || <span className="muted">No stated ask</span>}
                      </p>
                    </td>
                    <td className="number amber">
                      {
                        assessments.filter((a) => a.matches.some((m) => m.eventId === item.id))
                          .length
                      }
                    </td>
                    <td>
                      <IconArrowUpRight size={15} className="row-arrow" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={run ? 'No events with these filters.' : 'No event snapshot yet.'}
            body={
              run
                ? 'Widen your filters, or fetch fresh demand in a new scout run.'
                : 'Connect CoHost Club and start a run to pull upcoming events seeking sponsorship.'
            }
            action={
              <Link href="/" className="text-link">
                Open research desk
                <IconArrowRight size={14} />
              </Link>
            }
          />
        )}
      </div>
      <div className="list-footnote">
        <IconCalendarEvent size={14} />
        Each run keeps its own snapshot. Live outreach rechecks that the selected events are still
        open.
      </div>
      <Modal
        open={Boolean(event)}
        onClose={() => setSelectedEvent(null)}
        title={event?.title || 'Event'}
        description="Host details and the original sponsorship ask."
        drawer
        footer={
          event && !run?.isSample ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="button primary"
            >
              OPEN IN COHOST CLUB
              <IconArrowUpRight size={15} />
            </a>
          ) : (
            <Badge tone="amber">SAMPLE EVENT · NO LIVE LINK</Badge>
          )
        }
      >
        {event && (
          <>
            <Badge tone="amber">{run?.isSample ? 'SAMPLE' : 'READ-ONLY · COHOST CLUB'}</Badge>
            <div className="event-inspector-meta">
              <span>
                <IconMapPin size={15} />
                {event.city}
              </span>
              <span>
                <IconCalendarEvent size={15} />
                {dateLabel(event.date.unixMs, true)}
              </span>
              <span>
                <IconUsers size={15} />
                {event.size.capacity ?? 'Unknown'} capacity · {event.size.bucket}
              </span>
            </div>
            <blockquote className="ask hero-ask">
              <span>THE SPONSORSHIP ASK</span>
              {event.sponsorshipNeed || <em className="muted">No specific ask stated.</em>}
            </blockquote>
            <section className="case-section">
              <h3 className="section-title">ABOUT THE EVENT</h3>
              <p className="muted">{event.description}</p>
              <div className="chips space-top">
                <Badge>{event.vertical}</Badge>
                {event.audience.map((a) => (
                  <Badge key={a}>{a}</Badge>
                ))}
              </div>
            </section>
            <section className="case-section">
              <h3 className="section-title">THE HOST</h3>
              <div className="contact-person">
                <IconUsers size={26} stroke={1.25} />
                <div>
                  <strong>
                    {event.host.name}
                    {event.host.verified && <IconShieldCheck size={14} className="positive" />}
                  </strong>
                  <span>
                    {event.host.company} · {event.host.eventsHosted} events hosted
                  </span>
                </div>
              </div>
              <p className="micro muted space-top">
                Introductions are brokered manually in CoHost Club. This app does not write sponsor
                interest back.
              </p>
            </section>
            <section className="case-section">
              <h3 className="section-title">MATCHED SPONSORS</h3>
              {assessments
                .filter((a) => a.matches.some((m) => m.eventId === event.id))
                .map((a) => {
                  const sponsor = data.sponsors.find((s) => s.id === a.sponsorId);
                  const draft = data.drafts.find((d) => d.assessmentId === a.id);
                  return (
                    <div className="event-sponsor-row" key={a.id}>
                      <span>{sponsor?.name}</span>
                      {draft && (
                        <Link className="text-link" href={`/queue?draft=${draft.id}`}>
                          Review draft
                          <IconArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  );
                })}
              {!assessments.some((a) => a.matches.some((m) => m.eventId === event.id)) && (
                <p className="muted">No matches yet in this run.</p>
              )}
            </section>
          </>
        )}
      </Modal>
    </section>
  );
}
