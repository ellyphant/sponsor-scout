import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  IconPlayerPlay,
  IconArrowRight,
  IconArrowDown,
  IconSquare,
  IconWorldSearch,
  IconCheck,
  IconAlertTriangle,
  IconRadar2,
  IconRefresh,
  IconAdjustmentsHorizontal,
  IconClock,
  IconMail,
  IconExternalLink,
} from '@tabler/icons-react';
import { motion, useReducedMotion } from 'motion/react';
import api, { type RunRow, type Scope } from '../api';
import { useStore, messageOf } from '../store';
import {
  Badge,
  Button,
  Empty,
  Field,
  Modal,
  Score,
  Sources,
  shortId,
  dateLabel,
} from '../components/ui';
const activeStatuses = ['queued', 'fetching', 'running', 'stopping'];
function Metric({
  value,
  label,
  detail,
  tone = '',
}: {
  value: number;
  label: string;
  detail: string;
  tone?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prior = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    const from = prior.current;
    prior.current = value;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const draw = () => {
      const p = Math.min(1, (performance.now() - start) / 400);
      setDisplay(Math.round(from + (value - from) * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return (
    <div className="metric">
      <span className="eyebrow">{label}</span>
      <strong className={tone}>{display.toString().padStart(2, '0')}</strong>
      <span>{detail}</span>
    </div>
  );
}
function elapsed(run: RunRow, now: number) {
  const n = Math.max(0, Math.floor(((run.finishedAt || now) - run.startedAt) / 1000));
  return [Math.floor(n / 3600), Math.floor(n / 60) % 60, n % 60]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}
export function RunPage({ runId }: { runId?: string }) {
  const data = useStore((s) => s.data)!;
  const selected = useStore((s) => s.selectedRunId);
  const activity = useStore((s) => s.activity);
  const loaded = useStore((s) => s.loadedRuns);
  const [, navigate] = useLocation();
  const [startOpen, setStartOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scope, setScope] = useState<Scope>({
    city: '',
    vertical: '',
    from: new Date().toISOString().slice(0, 10),
    to: '',
    newLimit: 5,
  });
  const [now, setNow] = useState(Date.now());
  const [following, setFollowing] = useState(true);
  const [replayCount, setReplayCount] = useState<number | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const run = data.runs.find((r) => r.id === (runId || selected)) || data.runs[0];
  const isActive = Boolean(run && activeStatuses.includes(run.status));
  const entries = activity.filter((a) => a.runId === run?.id).sort((a, b) => a.seq - b.seq);
  const shown = replayCount === null ? entries : entries.slice(0, replayCount);
  const assessments = data.assessments
    .filter((a) => a.runId === run?.id && a.qualified)
    .sort((a, b) => b.qualificationScore - a.qualificationScore);
  const matched = new Set(assessments.flatMap((a) => a.matches.map((m) => m.eventId))).size;
  const included = data.sponsors.filter(
    (s) => s.maintained && !s.archived && !s.doNotContact && !s.isSample,
  ).length;
  useEffect(() => {
    if (runId && !loaded.includes(runId)) void useStore.getState().openRun(runId);
  }, [runId, loaded]);
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);
  useEffect(() => {
    if (replayCount === null) return;
    if (replayCount >= entries.length) {
      const done = setTimeout(() => setReplayCount(null), 700);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => setReplayCount((n) => (n || 0) + 1), reduced ? 0 : 650);
    return () => clearTimeout(timer);
  }, [replayCount, entries.length, reduced]);
  useEffect(() => {
    setReplayCount(null);
    setFollowing(isActive);
    log.current?.scrollTo({ top: isActive ? log.current.scrollHeight : 0 });
  }, [run?.id]);
  useEffect(() => {
    if (following && (isActive || replayCount !== null) && log.current)
      log.current.scrollTo({
        top: log.current.scrollHeight,
        behavior: reduced ? 'auto' : 'smooth',
      });
  }, [shown.length, following, reduced, isActive, replayCount]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input,textarea,select,[contenteditable=true],[role=dialog]')
      )
        return;
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (isActive) setStopOpen(true);
        else setStartOpen(true);
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [isActive]);
  async function start() {
    setBusy(true);
    setError('');
    try {
      const result = await api.startRun(scope);
      useStore.getState().apply({ runs: [result.run] });
      await useStore.getState().openRun(result.run.id);
      setStartOpen(false);
      setReplayCount(null);
      navigate(`/runs/${result.run.id}`);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  async function stop(abandon = false) {
    if (!run) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.stopRun({ runId: run.id, abandon, confirmed: true });
      useStore.getState().apply({ runs: [result.run] });
      setStopOpen(false);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  const canStart = data.setup.cohostConfigured && data.profile?.astraCheck?.status !== 'failed';
  return (
    <section className="page run-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RESEARCH DESK</span>
          <h1>
            Find the right fit<span className="amber">.</span>
          </h1>
          <p>Cited evidence. Relevant events. Outreach you control.</p>
        </div>
        <div className="heading-actions">
          {data.runs.length > 0 && (
            <select
              className="compact-select"
              aria-label="Select run"
              value={run?.id || ''}
              onChange={(e) => {
                setReplayCount(null);
                void useStore.getState().openRun(e.target.value);
                navigate(`/runs/${e.target.value}`);
              }}
            >
              {[...data.runs]
                .sort((a, b) => b.startedAt - a.startedAt)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.isSample ? 'Sample · ' : ''}
                    {shortId(r.id)} · {dateLabel(r.startedAt)}
                  </option>
                ))}
            </select>
          )}
          <Button
            variant="primary"
            onClick={() => {
              setError('');
              setStartOpen(true);
            }}
            disabled={isActive}
          >
            <IconPlayerPlay size={15} />
            NEW SCOUT<kbd>R</kbd>
          </Button>
        </div>
      </div>
      {run?.isSample && (
        <div className="sample-banner">
          <Badge tone="amber">SAMPLE WORKSPACE</Badge>
          <span>Fictional sponsors and events. No email can be sent.</span>
          <Link href="/settings">
            Connect live data
            <IconArrowRight size={13} />
          </Link>
        </div>
      )}
      {!run ? (
        <div className="panel flex-fill">
          <Empty
            title="Your next introduction starts here."
            body="Start a scout to research companies and match them to open CoHost Club events."
            action={
              <div className="empty-actions">
                <Button variant="primary" onClick={() => setStartOpen(true)}>
                  <IconRadar2 size={17} />
                  START SCOUT
                </Button>
                {!canStart && (
                  <Link className="text-link" href="/settings">
                    Complete preflight
                    <IconArrowRight size={14} />
                  </Link>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <>
          <section className="readout">
            <div className="readout-top">
              <div className="inline">
                <span
                  className={`run-state ${isActive ? 'positive' : run.status === 'failed' ? 'negative' : 'amber'}`}
                >
                  <i className={`status-dot ${isActive ? 'pulse' : ''}`} />
                  {replayCount !== null
                    ? 'SAMPLE REPLAY'
                    : run.isSample
                      ? 'RECORDED RUN'
                      : run.status.replaceAll('_', ' ').toUpperCase()}
                </span>
                <span className="run-id">{shortId(run.id)}</span>
                <span className="run-scope">
                  {run.scope.newLimit} new + {run.includedSponsorIds.length} maintained
                </span>
              </div>
              <div className="inline">
                <span className="elapsed">
                  <IconClock size={14} />
                  {elapsed(run, now)}
                </span>
                {isActive ? (
                  <Button variant="ghost" onClick={() => setStopOpen(true)}>
                    <IconSquare size={12} />
                    STOP
                  </Button>
                ) : (
                  <Badge tone={run.status === 'failed' ? 'negative' : 'muted'}>
                    {run.isSample ? 'SAMPLE' : 'LIVE DATA'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="metrics">
              <Metric
                value={run.counters.researched}
                label="RESEARCHED"
                detail="companies assessed"
              />
              <Metric
                value={run.counters.qualified}
                label="QUALIFIED"
                detail="evidence-backed fits"
                tone="amber"
              />
              <Metric
                value={run.counters.matched}
                label="MATCHED"
                detail={`across ${matched} events`}
                tone="amber"
              />
              <Metric
                value={run.counters.drafts}
                label="DRAFTS"
                detail="written for review"
                tone="positive"
              />
            </div>
          </section>
          <div className="run-grid">
            <section className="panel activity-panel">
              <header className="panel-head">
                <span>
                  <i className={`tiny-dot ${isActive ? 'amber' : ''}`} />
                  ACTIVITY & FINDINGS
                </span>
                <div className="inline">
                  <span className="micro muted">{entries.length} ENTRIES</span>
                  {!isActive && entries.length > 0 && (
                    <button
                      className="text-button amber"
                      onClick={() => {
                        setReplayCount(0);
                        setFollowing(true);
                      }}
                      disabled={replayCount !== null}
                    >
                      <IconRefresh size={12} />
                      {replayCount !== null ? 'REPLAYING' : 'REPLAY'}
                    </button>
                  )}
                </div>
              </header>
              <div
                className="activity-scroll"
                ref={log}
                onScroll={() => {
                  const el = log.current;
                  if (el) setFollowing(el.scrollHeight - el.scrollTop - el.clientHeight < 70);
                }}
              >
                <div className="stream-intro">
                  <span className="command-prefix">scout</span>
                  <span className="muted">run</span>
                  <span>{run.scope.city || 'all-cities'}</span>
                  <span className="command-flag">--engine astra --reasoning high</span>
                </div>
                {!shown.length ? (
                  <div className="activity-wait">
                    <IconWorldSearch size={24} stroke={1.25} />
                    <span>
                      {isActive
                        ? 'Waiting for the first persisted activity.'
                        : replayCount !== null
                          ? 'Replaying saved sample activity.'
                          : 'No activity recorded for this run.'}
                    </span>
                  </div>
                ) : (
                  shown.map((entry) => (
                    <motion.div
                      className={`activity-row ${entry.kind}`}
                      key={entry.id}
                      initial={reduced ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <time>
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour12: false,
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </time>
                      <div className="activity-spine">
                        <span
                          className={`activity-node ${entry.kind === 'finding' ? 'positive' : entry.kind === 'error' ? 'negative' : 'amber'}`}
                        />
                      </div>
                      <div className="activity-content">
                        <div
                          className={`activity-label ${entry.kind === 'finding' ? 'positive' : entry.kind === 'error' ? 'negative' : 'amber'}`}
                        >
                          {entry.kind === 'finding' ? (
                            <IconCheck size={14} />
                          ) : entry.kind === 'error' ? (
                            <IconAlertTriangle size={14} />
                          ) : (
                            <IconWorldSearch size={14} />
                          )}
                          {entry.label}
                          {entry.state === 'working' && isActive && <span className="live-caret" />}
                        </div>
                        <p>{entry.detail}</p>
                        {entry.sources.length > 0 && <Sources sources={entry.sources} />}
                      </div>
                    </motion.div>
                  ))
                )}
                {run.errors.map((entry, i) => (
                  <div className="inline-notice negative" key={i}>
                    <IconAlertTriangle size={16} />
                    {entry}
                  </div>
                ))}
                {!isActive && run.summary && (
                  <div className="stream-end">
                    <IconCheck size={14} />
                    <span>{run.summary}</span>
                  </div>
                )}
              </div>
              {!following && (
                <button
                  className="jump-latest"
                  onClick={() => {
                    setFollowing(true);
                    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
                  }}
                >
                  <IconArrowDown size={12} />
                  JUMP TO LATEST
                </button>
              )}
              <footer className="panel-foot">
                <span>ACTUAL ACTIVITY. CITED CONCLUSIONS.</span>
                <span>{run.isSample ? 'FIXTURE DATA' : 'NO PRIVATE REASONING'}</span>
              </footer>
            </section>
            <aside className="panel results-panel">
              <header className="panel-head">
                <span>THIS RUN</span>
                <Badge>{assessments.length} QUALIFIED</Badge>
              </header>
              <div className="results-scroll">
                {!assessments.length ? (
                  <Empty
                    title="Evidence comes first."
                    body="Qualified sponsors will appear as their assessments are saved."
                  />
                ) : (
                  assessments.map((assessment) => {
                    const sponsor = data.sponsors.find((s) => s.id === assessment.sponsorId);
                    const draft = data.drafts.find((d) => d.assessmentId === assessment.id);
                    return (
                      <div className="result-row" key={assessment.id}>
                        <div className="result-company">
                          <div className="company-icon">
                            {sponsor?.name.slice(0, 2).toUpperCase() || 'SS'}
                          </div>
                          <div>
                            <motion.h3 layoutId={`company-${assessment.sponsorId}`}>
                              {sponsor?.name || 'Sponsor'}
                            </motion.h3>
                            <span>
                              {assessment.fundingStage || 'Stage unknown'} ·{' '}
                              {assessment.sector || 'Sector unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="result-fit">
                          <Score value={assessment.qualificationScore} label="QUAL" />
                          <span>
                            {assessment.matches.length} event{' '}
                            {assessment.matches.length === 1 ? 'fit' : 'fits'}
                          </span>
                        </div>
                        <p>{assessment.summary}</p>
                        {draft ? (
                          <Link className="result-action" href={`/queue?draft=${draft.id}`}>
                            <IconMail size={14} />
                            {draft.reviewState !== 'pending'
                              ? draft.reviewState.toUpperCase()
                              : draft.recipientEmail
                                ? 'DRAFT READY'
                                : 'NEEDS RECIPIENT'}
                            <IconArrowRight size={14} />
                          </Link>
                        ) : (
                          <span className="result-no-fit">
                            {assessment.matches.length
                              ? 'Existing outreach preserved'
                              : 'No current event clears the fit threshold'}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <footer className="results-footer">
                <span className="eyebrow">FROM DEMAND TO INTRODUCTION</span>
                <p>
                  {run.events.length} open asks in this snapshot.
                  <br />
                  You decide which conversations begin.
                </p>
                <Link href="/events" className="text-link">
                  Inspect event demand
                  <IconExternalLink size={13} />
                </Link>
              </footer>
            </aside>
          </div>
        </>
      )}
      <Modal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start a scout"
        description="Astra researches your maintained list and finds up to five new companies."
        busy={busy}
        footer={
          <>
            <Button onClick={() => setStartOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={!canStart || Boolean(scope.to && scope.from > scope.to)}
              onClick={() => void start()}
            >
              <IconPlayerPlay size={15} />
              START SCOUT
            </Button>
          </>
        }
      >
        <div className="scope-summary">
          <IconRadar2 size={26} stroke={1.25} />
          <span>
            <strong>GPT-6 Astra</strong>
            <small>High reasoning · native web research</small>
          </span>
        </div>
        <div className="form-grid">
          <Field label="City">
            <input
              value={scope.city}
              placeholder="All cities"
              onChange={(e) => setScope({ ...scope, city: e.target.value })}
            />
          </Field>
          <Field label="Vertical">
            <input
              value={scope.vertical}
              placeholder="All verticals"
              onChange={(e) => setScope({ ...scope, vertical: e.target.value })}
            />
          </Field>
          <Field label="From">
            <input
              type="date"
              value={scope.from}
              onChange={(e) => setScope({ ...scope, from: e.target.value })}
            />
          </Field>
          <Field label="To (optional)">
            <input
              type="date"
              value={scope.to}
              min={scope.from}
              onChange={(e) => setScope({ ...scope, to: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label="New companies to research"
          hint={`Plus ${included} active, non-sample maintained ${included === 1 ? 'company' : 'companies'}.`}
        >
          <select
            value={scope.newLimit}
            onChange={(e) => setScope({ ...scope, newLimit: Number(e.target.value) })}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
                {n === 5 ? ' · Recommended' : ''}
              </option>
            ))}
          </select>
        </Field>
        {!canStart && (
          <div className="inline-notice amber">
            <IconAdjustmentsHorizontal size={17} />
            <span>
              Connect CoHost Club and check Astra in{' '}
              <Link href="/settings" onClick={() => setStartOpen(false)}>
                Settings
              </Link>{' '}
              before a live run. Sample records are never used for live research.
            </span>
          </div>
        )}
        <div className="form-error" role="status">
          {error || '\u00a0'}
        </div>
      </Modal>
      <Modal
        open={stopOpen}
        onClose={() => setStopOpen(false)}
        title="Stop accepting results?"
        description="Saved findings and drafts stay available."
        busy={busy}
        footer={
          <>
            <Button onClick={() => setStopOpen(false)}>Keep running</Button>
            <Button variant="danger" loading={busy} onClick={() => void stop()}>
              Stop accepting results
            </Button>
          </>
        }
      >
        <p className="muted">
          Research already in progress may continue. Sponsor Scout will not accept new results for
          this run.
        </p>
        {run && Date.now() > run.budgetEndsAt && (
          <div className="inline-notice amber">
            <p>
              The worker's deadline has passed. You can abandon this unfinished run and preserve all
              saved work.
            </p>
            <Button onClick={() => void stop(true)}>Abandon stale run</Button>
          </div>
        )}
        <div className="form-error">{error}</div>
      </Modal>
    </section>
  );
}
