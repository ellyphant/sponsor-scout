import {
  IconMapPin,
  IconUsers,
  IconArrowUpRight,
  IconChevronDown,
  IconShieldCheck,
} from '@tabler/icons-react';
import type { AssessmentRow, CoHostEvent, Match } from '../api';
import { Badge, Score, Sources, dateLabel } from './ui';
export function Qualification({ assessment }: { assessment: AssessmentRow }) {
  return (
    <section className="case-section">
      <div className="section-heading">
        <h3>WHY {assessment.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}</h3>
        <Score value={assessment.qualificationScore} label="QUAL" />
      </div>
      <p className="qualification-summary">{assessment.summary}</p>
      <Sources sources={assessment.sources} />
      <div className="factor-list">
        {assessment.factors.map((factor) => (
          <details className="factor" key={factor.key}>
            <summary>
              <span>{factor.label}</span>
              <span className="factor-rating" aria-label={`${factor.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <i key={n} className={n <= factor.rating ? 'filled' : ''} />
                ))}
                <b>{factor.rating}/5</b>
                <IconChevronDown size={12} />
              </span>
            </summary>
            <div className="factor-detail">
              <Badge tone={factor.status === 'unknown' ? 'amber' : 'muted'}>{factor.status}</Badge>
              <p>{factor.reason}</p>
              <Sources
                sources={assessment.sources.filter((s) => factor.sourceIds.includes(s.id))}
              />
            </div>
          </details>
        ))}
      </div>
      {assessment.gaps.length > 0 && (
        <div className="evidence-gaps">
          <span className="eyebrow">WHAT'S STILL UNKNOWN</span>
          {assessment.gaps.map((gap, i) => (
            <p key={i}>{gap}</p>
          ))}
        </div>
      )}
    </section>
  );
}
export function MatchedEvent({
  event,
  match,
  isSample,
}: {
  event: CoHostEvent;
  match: Match;
  isSample: boolean;
}) {
  return (
    <details className="matched-event" open>
      <summary>
        <div>
          <span className="event-date">{dateLabel(event.date.unixMs)}</span>
          <h4>{event.title}</h4>
        </div>
        <IconChevronDown size={14} />
      </summary>
      <div className="match-content">
        <div className="event-meta">
          <span>
            <IconMapPin size={12} />
            {event.city}
          </span>
          <span>
            <IconUsers size={12} />
            {event.size.capacity ?? event.size.bucket}{' '}
            {event.size.capacity !== null ? 'capacity' : ''}
          </span>
          <Score value={match.score} />
        </div>
        <p className="match-why">{match.reason}</p>
        <blockquote className="ask">
          <span>THE ASK</span>
          {event.sponsorshipNeed}
        </blockquote>
        <details className="match-dimensions">
          <summary>
            Why this fit
            <IconChevronDown size={12} />
          </summary>
          {(['city', 'audience', 'vertical'] as const).map((key) => (
            <div key={key}>
              <span>
                {key === 'city' ? 'REGION' : key.toUpperCase()} · {match[key].rating}/5
              </span>
              <p>{match[key].reason}</p>
            </div>
          ))}
        </details>
        <div className="host-line">
          <span>
            {event.host.verified && <IconShieldCheck size={12} />}
            {event.host.name}
            {event.host.company && ` · ${event.host.company}`}
          </span>
          {isSample ? (
            <span className="micro muted">SAMPLE EVENT</span>
          ) : (
            <a href={event.url} target="_blank" rel="noopener noreferrer">
              CoHost Club
              <IconArrowUpRight size={13} />
            </a>
          )}
        </div>
      </div>
    </details>
  );
}
