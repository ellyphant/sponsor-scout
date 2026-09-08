import { useEffect, useState } from 'react';
import { auth } from '@mindstudio-ai/interface';
import { Link, useLocation, useSearch } from 'wouter';
import { motion } from 'motion/react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconMail,
  IconPencil,
  IconX,
  IconCheck,
  IconShieldCheck,
  IconAlertTriangle,
  IconRefresh,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import api, { type DraftRow, type Prepared } from '../api';
import { useStore, messageOf } from '../store';
import { Badge, Button, Empty, Field, Modal, Score, Sources, dateLabel } from '../components/ui';
import { Qualification, MatchedEvent } from '../components/Evidence';

function DraftCase({ draft, onBack }: { draft: DraftRow; onBack: () => void }) {
  const data = useStore((s) => s.data)!;
  const sponsor = data.sponsors.find((s) => s.id === draft.sponsorId)!;
  const assessment = data.assessments.find((a) => a.id === draft.assessmentId);
  const run = data.runs.find((r) => r.id === draft.runId);
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(draft.revision);
  const [fields, setFields] = useState({
    recipientName: draft.recipientName,
    recipientRole: draft.recipientRole,
    recipientEmail: draft.recipientEmail,
    subject: draft.subject,
    body: draft.body,
  });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [checked, setChecked] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const attempts = data.attempts
    .filter((a) => a.draftId === draft.id)
    .sort((a, b) => b.created_at - a.created_at);
  const frozen = attempts.some(
    (a) =>
      ['sending', 'preparing', 'unknown'].includes(a.state) ||
      (a.mode === 'live' && ['accepted', 'suppressed'].includes(a.state)),
  );
  const mode = draft.isSample ? 'sample' : data.profile?.deliveryMode || 'test';
  const validRecipient = auth.email.isValid(editing ? fields.recipientEmail : draft.recipientEmail);
  const dirty =
    editing &&
    Object.entries(fields).some(([key, value]) => draft[key as keyof DraftRow] !== value);
  useEffect(() => {
    if (!run) void useStore.getState().openRun(draft.runId);
  }, [run, draft.runId]);
  function edit() {
    setFields({
      recipientName: draft.recipientName,
      recipientRole: draft.recipientRole,
      recipientEmail: draft.recipientEmail,
      subject: draft.subject,
      body: draft.body,
    });
    setRevision(draft.revision);
    setEditing(true);
    setError('');
  }
  async function save() {
    setBusy('save');
    setError('');
    const original = draft;
    useStore.getState().apply({ drafts: [{ ...draft, ...fields }] });
    try {
      const result = await api.saveDraft({
        draftId: draft.id,
        expectedRevision: revision,
        ...fields,
      });
      useStore.getState().apply({ drafts: [result.draft] });
      setEditing(false);
      useStore.getState().notify('Draft saved. Review it before sending.', 'success');
    } catch (err) {
      useStore.getState().apply({ drafts: [original] });
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  async function review() {
    if (
      editing ||
      !auth.email.isValid(draft.recipientEmail) ||
      frozen ||
      draft.reviewState !== 'pending'
    )
      return;
    setBusy('review');
    setError('');
    try {
      const result = await api.prepareDispatch({ draftId: draft.id, mode });
      setPrepared(result);
      setChecked(false);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  async function confirm() {
    if (!prepared) return;
    setBusy('send');
    setError('');
    try {
      const result = await api.confirmDispatch({
        draftId: draft.id,
        nonce: prepared.nonce,
        expectedRevision: prepared.revision,
        confirmed: prepared.isSample || checked,
      });
      useStore
        .getState()
        .apply({
          drafts: [result.draft],
          ...(result.attempt ? { attempts: [result.attempt] } : {}),
        });
      setPrepared(null);
      useStore
        .getState()
        .notify(
          result.message,
          result.attempt?.state === 'unknown' || result.attempt?.state === 'failed'
            ? 'error'
            : draft.isSample
              ? 'info'
              : 'success',
        );
      if (
        result.draft.reviewState === 'simulated' ||
        (result.attempt?.state === 'accepted' && result.attempt.mode === 'live')
      )
        onBack();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  async function reject() {
    setBusy('reject');
    setError('');
    try {
      const result = await api.rejectDraft({
        draftId: draft.id,
        expectedRevision: draft.revision,
        reason,
      });
      useStore.getState().apply({ drafts: [result.draft] });
      setRejectOpen(false);
      useStore.getState().notify('Draft rejected. Nothing was sent.');
      onBack();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  async function refresh(attemptId: string) {
    setBusy(attemptId);
    try {
      const result = await api.refreshDelivery({ attemptId });
      useStore.getState().apply({ attempts: [result.attempt] });
      useStore.getState().notify(result.message);
    } catch (err) {
      useStore.getState().notify(messageOf(err), 'error');
    } finally {
      setBusy('');
    }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input,textarea,select,[role=dialog]')
      )
        return;
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        void review();
      }
      if (event.key.toLowerCase() === 'e' && !frozen) edit();
      if (event.key.toLowerCase() === 'x' && draft.reviewState === 'pending' && !frozen)
        setRejectOpen(true);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const from = draft.isSample
    ? 'sample-sender@example.com'
    : data.profile?.senderVerified
      ? data.profile.senderAddress
      : 'Sender not configured';
  return (
    <section className="page case-page">
      <div className="case-page-heading">
        <button className="text-button" onClick={() => (dirty ? setDiscardOpen(true) : onBack())}>
          <IconArrowLeft size={14} />
          QUEUE
        </button>
        <span className="micro muted">
          {run ? `SNAPSHOT ${dateLabel(run.fetchedAt || run.startedAt, true)}` : 'LOADING SNAPSHOT'}
        </span>
        <Badge tone={draft.isSample ? 'amber' : 'muted'}>
          {draft.isSample ? 'SAMPLE · NO SEND' : `${mode.toUpperCase()} DELIVERY`}
        </Badge>
      </div>
      <div className="case-title">
        <div className="company-icon large">{sponsor?.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <motion.h1 layoutId={`company-${draft.sponsorId}`}>
            {sponsor?.name || 'Sponsor'}
          </motion.h1>
          <p>
            {assessment?.fundingStage || 'Stage not provided'}
            <span>·</span>
            {assessment?.sector || sponsor?.sector || 'Sector not provided'}
            <span>·</span>
            {assessment?.regions.join(', ') || sponsor?.regions.join(', ') || 'Region unknown'}
          </p>
        </div>
        <Badge tone={draft.reviewState === 'pending' ? 'positive' : 'muted'}>
          {draft.reviewState === 'pending'
            ? draft.recipientEmail
              ? 'AWAITING REVIEW'
              : 'NEEDS RECIPIENT'
            : draft.reviewState.toUpperCase()}
        </Badge>
      </div>
      <div className="case-grid">
        <div className="case-evidence">
          {assessment && <Qualification assessment={assessment} />}
          <section className="case-section">
            <div className="section-heading">
              <h3>MATCHED EVENTS</h3>
              <span className="micro muted">{assessment?.matches.length || 0} OPPORTUNITIES</span>
            </div>
            {assessment?.matches.map((match) => {
              const event = run?.events.find((e) => e.id === match.eventId);
              return event ? (
                <MatchedEvent
                  key={match.eventId}
                  event={event}
                  match={match}
                  isSample={draft.isSample}
                />
              ) : null;
            })}
          </section>
          <section className="case-section">
            <div className="section-heading">
              <h3>CONTACT</h3>
              <Badge>
                {draft.recipientSource === 'operator'
                  ? 'YOUR CONTACT'
                  : draft.recipientEmail
                    ? 'RESEARCHED'
                    : 'MISSING EMAIL'}
              </Badge>
            </div>
            <div className="contact-person">
              <IconUser size={24} stroke={1.25} />
              <div>
                <strong>
                  {draft.recipientName || assessment?.contact.name || 'Contact not yet named'}
                </strong>
                <span>
                  {draft.recipientRole || assessment?.contact.role || 'Role not provided'}
                </span>
              </div>
            </div>
            <p className="muted">
              {draft.recipientSource === 'operator'
                ? 'You supplied this contact. Astra has not verified the address.'
                : assessment?.contact.note}
            </p>
            <Sources
              sources={
                assessment?.sources.filter((s) => s.url === assessment.contact.sourceUrl) || []
              }
            />
            <small className="muted">
              {draft.recipientSource === 'operator'
                ? 'Entered by you. Confirm the recipient before dispatch.'
                : !draft.recipientEmail
                  ? 'No public email found. Add a recipient you trust before approval.'
                  : draft.isSample
                    ? 'Fictional sample contact. No email can be sent.'
                    : 'Found on a public source. Mailbox deliverability not verified.'}
            </small>
          </section>
        </div>
        <div className="letter-column">
          <div className="letter-toolbar">
            <span>
              <IconMail size={15} />
              THE OUTREACH
            </span>
            <span className={`micro ${editing ? 'amber' : 'muted'}`}>
              {editing
                ? 'EDITING · NOT SENT'
                : `REVISION ${draft.revision.toString().padStart(2, '0')}`}
            </span>
          </div>
          <div className="envelope dark-envelope">
            <div>
              <span>SEND AS</span>
              <strong>
                {data.profile?.displayName || 'Elly'} &lt;{from}&gt;
              </strong>
              <Badge>{draft.isSample ? 'SAMPLE' : 'MANAGED'}</Badge>
            </div>
            <div>
              <span>REPLY-TO</span>
              <strong>{data.profile?.replyTo || data.profile?.email}</strong>
              <Badge>YOUR INBOX</Badge>
            </div>
          </div>
          {editing && (
            <div className="recipient-editor">
              <div className="form-grid">
                <Field label="Contact name">
                  <input
                    value={fields.recipientName}
                    onChange={(e) => setFields({ ...fields, recipientName: e.target.value })}
                  />
                </Field>
                <Field label="Role">
                  <input
                    value={fields.recipientRole}
                    onChange={(e) => setFields({ ...fields, recipientRole: e.target.value })}
                  />
                </Field>
              </div>
              <Field
                label="Recipient email"
                error={
                  fields.recipientEmail && !validRecipient ? 'Enter a valid email address.' : ''
                }
                hint="You confirm this address again before dispatch."
              >
                <input
                  type="email"
                  value={fields.recipientEmail}
                  onChange={(e) => setFields({ ...fields, recipientEmail: e.target.value })}
                />
              </Field>
            </div>
          )}
          <motion.div
            className={`letter ${editing ? 'editing' : ''}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.08 }}
          >
            <div className="letter-to">
              <span>TO</span>
              <strong>
                {editing
                  ? fields.recipientEmail || 'Add recipient above'
                  : draft.recipientEmail || 'Recipient needed before approval'}
              </strong>
              <span>{draft.isSample ? 'SAMPLE' : 'DRAFT'}</span>
            </div>
            {editing ? (
              <>
                <label className="sr-only" htmlFor="draft-subject">
                  Subject
                </label>
                <input
                  id="draft-subject"
                  className="letter-subject-input"
                  value={fields.subject}
                  maxLength={120}
                  onChange={(e) => setFields({ ...fields, subject: e.target.value })}
                />
                <label className="sr-only" htmlFor="draft-body">
                  Email body
                </label>
                <textarea
                  id="draft-body"
                  className="letter-body-input"
                  value={fields.body}
                  onChange={(e) => setFields({ ...fields, body: e.target.value })}
                />
              </>
            ) : (
              <>
                <h2>{draft.subject}</h2>
                <div className="letter-body">{draft.body}</div>
              </>
            )}
          </motion.div>
          {attempts.length > 0 && (
            <div className="delivery-list">
              {attempts.map((attempt) => (
                <div
                  className={`delivery-item ${attempt.state === 'unknown' ? 'warning' : ''}`}
                  key={attempt.id}
                >
                  <span>
                    <Badge
                      tone={
                        attempt.state === 'unknown' || attempt.state === 'failed'
                          ? 'negative'
                          : 'muted'
                      }
                    >
                      {attempt.mode} · {attempt.deliveryStatus || attempt.state}
                    </Badge>
                    <small>
                      {attempt.errorMessage ||
                        'Acceptance and delivery are separate. Refresh to inspect the mail log.'}
                    </small>
                  </span>
                  <Button
                    loading={busy === attempt.id}
                    onClick={() => void refresh(attempt.id)}
                    aria-label="Refresh delivery"
                  >
                    <IconRefresh size={15} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="case-error" role="status">
            {error ||
              (!draft.recipientEmail && !editing
                ? 'No public email found. Add a recipient you trust before approval.'
                : '\u00a0')}
          </div>
          <div className="case-actions">
            {editing ? (
              <>
                <Button
                  variant="primary"
                  loading={busy === 'save'}
                  disabled={
                    !fields.subject.trim() ||
                    !fields.body.trim() ||
                    Boolean(fields.recipientEmail && !validRecipient)
                  }
                  onClick={() => void save()}
                >
                  <IconCheck size={15} />
                  SAVE DRAFT
                </Button>
                <Button onClick={() => (dirty ? setDiscardOpen(true) : setEditing(false))}>
                  Cancel edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  loading={busy === 'review'}
                  disabled={frozen || !validRecipient || draft.reviewState !== 'pending'}
                  onClick={() => void review()}
                >
                  REVIEW RECIPIENT
                  <IconArrowRight size={15} />
                </Button>
                <Button disabled={frozen} onClick={edit}>
                  <IconPencil size={15} />
                  EDIT
                </Button>
                <Button
                  variant="danger"
                  disabled={frozen || draft.reviewState !== 'pending'}
                  onClick={() => {
                    setRejectOpen(true);
                    setError('');
                  }}
                >
                  <IconX size={15} />
                  REJECT
                </Button>
              </>
            )}
          </div>
          <div className="approval-note">
            <IconShieldCheck size={13} />
            {draft.isSample
              ? 'Sample review only. This packet cannot send email.'
              : 'No message leaves this console without your explicit approval.'}
          </div>
        </div>
      </div>
      <Modal
        open={Boolean(prepared)}
        onClose={() => {
          setPrepared(null);
          setError('');
        }}
        title={draft.isSample ? 'Simulate this review' : 'Confirm recipient'}
        description={
          draft.isSample
            ? 'Sample draft. No email will be sent.'
            : 'Check who receives this exact email before dispatch.'
        }
        busy={busy === 'send'}
        footer={
          <>
            <Button onClick={() => setPrepared(null)} disabled={busy === 'send'}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!draft.isSample && !checked}
              loading={busy === 'send'}
              onClick={() => void confirm()}
            >
              {draft.isSample
                ? 'SIMULATE REVIEW'
                : mode === 'test'
                  ? 'SEND TEST'
                  : 'APPROVE & DISPATCH'}
              <IconArrowRight size={15} />
            </Button>
          </>
        }
      >
        <Badge tone="amber">
          {draft.isSample
            ? 'NO EMAIL WILL BE SENT'
            : mode === 'test'
              ? 'TEST · SENDS TO YOU'
              : 'LIVE OUTREACH'}
        </Badge>
        <div className="confirm-recipient">
          <span className="eyebrow">{draft.isSample ? 'PROPOSED RECIPIENT' : 'SENDING TO'}</span>
          <strong>{prepared?.envelope.to}</strong>
          <p>
            {draft.recipientName || 'Business contact'} · {sponsor?.name}
          </p>
        </div>
        <div className="envelope">
          <div>
            <span>FROM</span>
            <strong>{prepared?.envelope.from}</strong>
          </div>
          <div>
            <span>REPLY-TO</span>
            <strong>{prepared?.envelope.replyTo}</strong>
          </div>
          <div>
            <span>SUBJECT</span>
            <strong>{prepared?.envelope.subject}</strong>
          </div>
        </div>
        <details className="confirmation-preview">
          <summary>Review the exact letter</summary>
          <pre>{prepared?.envelope.body}</pre>
        </details>
        {!draft.isSample && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>I've checked the recipient and approve this exact email.</span>
          </label>
        )}
        <div className="form-error" role="status">
          {error}
        </div>
      </Modal>
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject this draft"
        description="The research stays in your history. Nothing will be sent."
        busy={busy === 'reject'}
        footer={
          <>
            <Button onClick={() => setRejectOpen(false)}>Keep draft</Button>
            <Button variant="danger" loading={busy === 'reject'} onClick={() => void reject()}>
              REJECT DRAFT
            </Button>
          </>
        }
      >
        <span className="eyebrow">REASON (OPTIONAL)</span>
        <div className="reason-chips">
          {['Off target', 'Bad timing', 'Wrong contact'].map((value) => (
            <button
              key={value}
              className={reason === value ? 'selected' : ''}
              onClick={() => setReason(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          aria-label="Rejection reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Anything to keep with this decision?"
        />
        <div className="form-error">{error}</div>
      </Modal>
      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard unsaved edits?"
        description="The last saved draft stays unchanged."
        footer={
          <>
            <Button onClick={() => setDiscardOpen(false)}>Keep editing</Button>
            <Button
              variant="danger"
              onClick={() => {
                setEditing(false);
                setDiscardOpen(false);
                setError('');
              }}
            >
              Discard edits
            </Button>
          </>
        }
      >
        <p className="muted">Only your unsaved changes will be discarded. Nothing will be sent.</p>
      </Modal>
    </section>
  );
}
export function QueuePage() {
  const data = useStore((s) => s.data)!;
  const search = useSearch();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState('pending');
  const [query, setQuery] = useState('');
  const selected = new URLSearchParams(search).get('draft');
  const draft = data.drafts.find((d) => d.id === selected);
  const visible = data.drafts
    .filter((d) =>
      filter === 'history'
        ? d.reviewState !== 'pending'
        : d.reviewState === 'pending' &&
          (filter === 'ready'
            ? Boolean(d.recipientEmail)
            : filter === 'needs'
              ? !d.recipientEmail
              : true),
    )
    .filter((d) =>
      `${data.sponsors.find((s) => s.id === d.sponsorId)?.name} ${d.subject}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  if (draft) return <DraftCase key={draft.id} draft={draft} onBack={() => navigate('/queue')} />;
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HUMAN IN THE LOOP</span>
          <h1>
            Your approval queue<span className="amber">.</span>
          </h1>
          <p>Read the case. Check the contact. Make the call.</p>
        </div>
        <Badge tone="positive">
          {data.drafts.filter((d) => d.reviewState === 'pending').length} AWAITING REVIEW
        </Badge>
      </div>
      <div className="list-toolbar">
        <div className="tabs">
          {[
            ['pending', 'All pending'],
            ['ready', 'Ready'],
            ['needs', 'Needs recipient'],
            ['history', 'History'],
          ].map(([key, label]) => (
            <button
              className={filter === key ? 'active' : ''}
              key={key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="search-field">
          <IconSearch size={15} />
          <input
            aria-label="Search drafts"
            placeholder="Search drafts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="panel list-panel">
        {!visible.length ? (
          <Empty
            title={
              filter === 'history'
                ? 'No reviewed drafts.'
                : data.drafts.length
                  ? 'Queue clear.'
                  : 'No drafts yet.'
            }
            body={
              filter === 'history'
                ? 'Approved, rejected and simulated reviews appear here.'
                : data.drafts.length
                  ? 'Every matching draft has been reviewed. Change a filter or start another run.'
                  : 'Start a scout run to build your review queue.'
            }
            action={
              <Link href="/" className="text-link">
                Open research desk
                <IconArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <div className="queue-list">
            {visible.map((item) => {
              const sponsor = data.sponsors.find((s) => s.id === item.sponsorId);
              const assessment = data.assessments.find((a) => a.id === item.assessmentId);
              return (
                <button
                  key={item.id}
                  className="queue-row"
                  onClick={() => navigate(`/queue?draft=${item.id}`)}
                >
                  <div className="company-icon">
                    <IconMail size={20} stroke={1.25} />
                  </div>
                  <div className="queue-company">
                    <h3>
                      {sponsor?.name || 'Sponsor'}
                      {item.isSample && <Badge tone="amber">SAMPLE</Badge>}
                    </h3>
                    <p>{item.subject}</p>
                    <span>
                      {item.recipientEmail || 'Recipient needed'}
                      <b>·</b>
                      {item.eventIds.length} event matches
                    </span>
                  </div>
                  {assessment && <Score value={assessment.qualificationScore} label="QUAL" />}
                  <span
                    className={`queue-readiness ${item.reviewState !== 'pending' ? 'muted' : item.recipientEmail ? 'positive' : 'amber'}`}
                  >
                    <i className="tiny-dot" />
                    {item.reviewState !== 'pending'
                      ? item.reviewState
                      : item.recipientEmail
                        ? 'Ready for review'
                        : 'Needs recipient'}
                  </span>
                  <IconArrowRight size={18} className="row-arrow" />
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="list-footnote">
        <IconShieldCheck size={14} />
        Approval is required for every email. Research never has permission to send.
      </div>
    </section>
  );
}
