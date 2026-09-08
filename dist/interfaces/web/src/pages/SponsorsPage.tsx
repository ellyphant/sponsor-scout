import { useState } from 'react';
import { auth } from '@mindstudio-ai/interface';
import {
  IconPlus,
  IconSearch,
  IconArrowRight,
  IconBuildingSkyscraper,
  IconPencil,
  IconArrowUpRight,
  IconArchive,
  IconShieldOff,
  IconRadar2,
} from '@tabler/icons-react';
import { Link } from 'wouter';
import api, { type SponsorRow } from '../api';
import { useStore, messageOf } from '../store';
import { Badge, Button, Empty, Field, Modal, Score, dateLabel } from '../components/ui';
import { Qualification } from '../components/Evidence';
const emptyContact = { name: '', role: '', email: '', sourceUrl: '', note: '' };
const split = (text: string) =>
  text
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
function validWebsite(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}
function SponsorForm({ sponsor, onClose }: { sponsor: SponsorRow | null; onClose: () => void }) {
  const data = useStore((s) => s.data)!;
  const [name, setName] = useState(sponsor?.name || '');
  const [website, setWebsite] = useState(sponsor?.website || '');
  const [sector, setSector] = useState(sponsor?.sector || '');
  const [regions, setRegions] = useState(sponsor?.regions.join(', ') || '');
  const [audiences, setAudiences] = useState(sponsor?.audiences.join(', ') || '');
  const [notes, setNotes] = useState(sponsor?.notes || '');
  const [contact, setContact] = useState(sponsor?.contact || emptyContact);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  const valid =
    name.trim() && validWebsite(website) && (!contact.email || auth.email.isValid(contact.email));
  async function save() {
    setBusy(true);
    setError('');
    const id = sponsor?.id || `pending-${crypto.randomUUID()}`;
    const fields = {
      name,
      website,
      sector,
      regions: split(regions),
      audiences: split(audiences),
      notes,
      contact,
    };
    const optimistic: SponsorRow = {
      ...fields,
      id,
      ownerId: data.profile!.id,
      domain: new URL(website).hostname,
      origin: sponsor?.origin || 'maintained',
      maintained: sponsor?.maintained ?? true,
      archived: sponsor?.archived || false,
      doNotContact: sponsor?.doNotContact || false,
      isSample: sponsor?.isSample || false,
      latestAssessmentId: sponsor?.latestAssessmentId,
      created_at: sponsor?.created_at || Date.now(),
      updated_at: sponsor?.updated_at || Date.now(),
      last_updated_by: data.profile!.id,
    };
    useStore.getState().apply({ sponsors: [optimistic] });
    try {
      const result = await api.saveSponsor({ ...fields, ...(sponsor ? { id: sponsor.id } : {}) });
      if (!sponsor)
        useStore.setState((state) => ({
          data: { ...state.data!, sponsors: state.data!.sponsors.filter((s) => s.id !== id) },
        }));
      useStore.getState().apply({ sponsors: [result.sponsor] });
      useStore
        .getState()
        .notify(sponsor ? 'Sponsor updated.' : 'Sponsor added to your maintained list.', 'success');
      onClose();
    } catch (err) {
      if (sponsor) useStore.getState().apply({ sponsors: [sponsor] });
      else
        useStore.setState((state) => ({
          data: { ...state.data!, sponsors: state.data!.sponsors.filter((s) => s.id !== id) },
        }));
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Modal
        open
        onClose={() => (dirty ? setDiscard(true) : onClose())}
        title={sponsor ? 'Edit sponsor' : 'Add a sponsor'}
        description="Your notes and contacts stay yours. Astra never overwrites them."
        wide
        busy={busy}
        footer={
          <>
            <Button onClick={() => (dirty ? setDiscard(true) : onClose())}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={!valid} onClick={() => void save()}>
              SAVE SPONSOR
              <IconArrowRight size={14} />
            </Button>
          </>
        }
      >
        <div onChangeCapture={() => setDirty(true)}>
          <h3 className="section-title">COMPANY</h3>
          <div className="form-grid">
            <Field label="Company name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Company name"
                required
              />
            </Field>
            <Field
              label="Website"
              error={
                website && !validWebsite(website) ? 'Include https:// and a public domain.' : ''
              }
            >
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                required
              />
            </Field>
            <Field label="Industry / vertical">
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. AI infrastructure"
              />
            </Field>
            <Field label="Regions" hint="Separate regions with commas.">
              <input
                value={regions}
                onChange={(e) => setRegions(e.target.value)}
                placeholder="e.g. San Francisco, New York"
              />
            </Field>
          </div>
          <Field label="Target audiences" hint="Separate audiences with commas.">
            <input
              value={audiences}
              onChange={(e) => setAudiences(e.target.value)}
              placeholder="e.g. founders, operators"
            />
          </Field>
          <h3 className="section-title space-top">YOUR CONTACT (OPTIONAL)</h3>
          <div className="form-grid">
            <Field label="Contact name">
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <input
                value={contact.role}
                onChange={(e) => setContact({ ...contact, role: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Business email"
            hint="An address you already know, not a guessed email pattern."
            error={
              contact.email && !auth.email.isValid(contact.email)
                ? 'Enter a valid email address.'
                : ''
            }
          >
            <input
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
          </Field>
          <Field label="Notes for this sponsor">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prior conversations, preferences, or useful context."
            />
          </Field>
        </div>
        <div className="form-error" role="status">
          {error}
        </div>
      </Modal>
      <Modal
        open={discard}
        onClose={() => setDiscard(false)}
        title="Discard this form?"
        description="Your unsaved changes will not be saved."
        footer={
          <>
            <Button onClick={() => setDiscard(false)}>Keep editing</Button>
            <Button variant="danger" onClick={onClose}>
              Discard
            </Button>
          </>
        }
      >
        <p className="muted">Existing sponsor records remain unchanged.</p>
      </Modal>
    </>
  );
}
export function SponsorsPage() {
  const data = useStore((s) => s.data)!;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<SponsorRow | 'new' | null>(null);
  const [busy, setBusy] = useState('');
  const sponsor = data.sponsors.find((s) => s.id === selected);
  const assessment = data.assessments.find((a) => a.id === sponsor?.latestAssessmentId);
  const visible = data.sponsors
    .filter((s) =>
      filter === 'archived'
        ? s.archived
        : !s.archived &&
          (filter === 'maintained'
            ? s.maintained
            : filter === 'discovered'
              ? s.origin === 'discovered'
              : true),
    )
    .filter((s) => `${s.name} ${s.sector} ${s.domain}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  async function toggle(values: {
    maintained?: boolean;
    archived?: boolean;
    doNotContact?: boolean;
  }) {
    if (!sponsor) return;
    const original = sponsor;
    setBusy('toggle');
    useStore.getState().apply({ sponsors: [{ ...sponsor, ...values }] });
    try {
      const result = await api.setSponsorStatus({ sponsorId: sponsor.id, ...values });
      useStore.getState().apply({ sponsors: [result.sponsor] });
    } catch (err) {
      useStore.getState().apply({ sponsors: [original] });
      useStore.getState().notify(messageOf(err), 'error');
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SPONSOR INTELLIGENCE</span>
          <h1>
            Your company library<span className="amber">.</span>
          </h1>
          <p>Companies you've added, plus the ones Astra finds.</p>
        </div>
        <Button variant="primary" onClick={() => setForm('new')}>
          <IconPlus size={16} />
          ADD SPONSOR
        </Button>
      </div>
      <div className="list-toolbar">
        <div className="tabs">
          {[
            ['all', 'All companies'],
            ['maintained', 'Maintained'],
            ['discovered', 'Discovered'],
            ['archived', 'Archived'],
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies"
            aria-label="Search companies"
          />
        </div>
      </div>
      <div className="panel list-panel">
        {visible.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>ORIGIN</th>
                  <th>STAGE / VERTICAL</th>
                  <th>QUALIFICATION</th>
                  <th>EVENT FITS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const a = data.assessments.find((a) => a.id === item.latestAssessmentId);
                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      onClick={() => setSelected(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelected(item.id);
                      }}
                      className={item.archived || item.doNotContact ? 'deemphasized' : ''}
                    >
                      <td>
                        <div className="table-company">
                          <div className="company-icon">
                            <IconBuildingSkyscraper size={21} stroke={1.25} />
                          </div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {item.domain}
                              {item.isSample && ' · SAMPLE'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={item.maintained ? 'amber' : 'muted'}>
                          {item.maintained ? 'Maintained' : 'Discovered'}
                        </span>
                      </td>
                      <td>
                        <div className="table-stack">
                          <span>{a?.fundingStage || 'Not researched'}</span>
                          <small>{a?.sector || item.sector || 'Not provided'}</small>
                        </div>
                      </td>
                      <td>
                        {a ? (
                          <div className="table-stack">
                            <Score value={a.qualificationScore} label="QUAL" />
                            <small>{a.qualified ? 'Qualified' : 'Not qualified'}</small>
                          </div>
                        ) : (
                          <Badge>UNASSESSED</Badge>
                        )}
                      </td>
                      <td className="number">{a?.matches.length ?? '—'}</td>
                      <td>
                        <IconArrowRight size={16} className="row-arrow" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No companies here yet."
            body="Add a sponsor you know, or start a scout to discover new companies."
            action={
              <Button onClick={() => setForm('new')}>
                <IconPlus size={14} />
                Add sponsor
              </Button>
            }
          />
        )}
      </div>
      <div className="list-footnote">
        <IconRadar2 size={14} />
        {
          data.sponsors.filter((s) => s.maintained && !s.archived && !s.doNotContact && !s.isSample)
            .length
        }{' '}
        real maintained companies will be requalified on the next run. Samples are excluded.
      </div>
      <Modal
        open={Boolean(sponsor) && !form}
        onClose={() => setSelected(null)}
        title={sponsor?.name || 'Sponsor'}
        description="Company profile and latest saved assessment."
        drawer
        footer={
          <>
            <Button
              onClick={() => {
                if (sponsor) setForm(sponsor);
              }}
            >
              <IconPencil size={14} />
              Edit company
            </Button>
            <Button
              loading={Boolean(busy)}
              onClick={() => void toggle({ archived: !sponsor?.archived })}
            >
              <IconArchive size={14} />
              {sponsor?.archived ? 'Restore' : 'Archive'}
            </Button>
          </>
        }
      >
        {sponsor && (
          <>
            <div className="inspector-status">
              <Badge tone={sponsor.isSample ? 'amber' : 'muted'}>
                {sponsor.isSample ? 'SAMPLE COMPANY' : sponsor.origin}
              </Badge>
              {sponsor.doNotContact && <Badge tone="negative">DO NOT CONTACT</Badge>}
            </div>
            {!sponsor.isSample && (
              <a
                className="text-link"
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sponsor.domain}
                <IconArrowUpRight size={13} />
              </a>
            )}
            <div className="profile-switches">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sponsor.maintained}
                  disabled={Boolean(busy)}
                  onChange={(e) => void toggle({ maintained: e.target.checked })}
                />
                <span>
                  Maintain in my sponsor list
                  <small>
                    {sponsor.isSample
                      ? 'Sample companies never enter live runs.'
                      : 'Included in future research runs unless archived.'}
                  </small>
                </span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sponsor.doNotContact}
                  disabled={Boolean(busy)}
                  onChange={(e) => void toggle({ doNotContact: e.target.checked })}
                />
                <span>
                  Do not contact<small>A hard block on live outreach.</small>
                </span>
              </label>
            </div>
            {assessment ? (
              <Qualification assessment={assessment} />
            ) : (
              <div className="inline-notice muted">
                Not yet assessed. Include this company in a scout run to research its fit.
              </div>
            )}
            <section className="case-section">
              <h3 className="section-title">YOUR NOTES</h3>
              <p className="notes-text">{sponsor.notes || 'No operator notes yet.'}</p>
            </section>
            <section className="case-section">
              <h3 className="section-title">YOUR CONTACT</h3>
              <p>{sponsor.contact.name || 'No contact on file'}</p>
              <p className="muted">{sponsor.contact.role}</p>
              <p className="break-anywhere">{sponsor.contact.email}</p>
            </section>
            {data.drafts
              .filter((d) => d.sponsorId === sponsor.id)
              .map((d) => (
                <Link key={d.id} className="result-action" href={`/queue?draft=${d.id}`}>
                  <span>{d.reviewState} draft</span>
                  <IconArrowRight size={14} />
                </Link>
              ))}
          </>
        )}
      </Modal>
      {form && (
        <SponsorForm
          key={form === 'new' ? 'new' : form.id}
          sponsor={form === 'new' ? null : form}
          onClose={() => setForm(null)}
        />
      )}
    </section>
  );
}
