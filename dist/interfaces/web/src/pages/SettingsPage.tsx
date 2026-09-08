import { useState } from 'react';
import { auth } from '@mindstudio-ai/interface';
import {
  IconCircleCheck,
  IconCircleDashed,
  IconAlertTriangle,
  IconArrowRight,
  IconKey,
  IconMail,
  IconCpu,
  IconWorld,
  IconShieldLock,
} from '@tabler/icons-react';
import { Link } from 'wouter';
import api from '../api';
import { useStore, messageOf } from '../store';
import { Badge, Button, Field, Modal, dateLabel } from '../components/ui';
export function SettingsPage() {
  const data = useStore((s) => s.data)!;
  const profile = data.profile;
  const [displayName, setDisplayName] = useState(profile?.displayName || 'Elly');
  const [replyTo, setReplyTo] = useState(profile?.replyTo || auth.currentUser?.email || '');
  const [mode, setMode] = useState<'test' | 'live'>(profile?.deliveryMode || 'test');
  const [sender, setSender] = useState(profile?.senderAddress || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [secretsOpen, setSecretsOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function check(connection: 'cohost' | 'astra') {
    setBusy(connection);
    setError('');
    try {
      const result = await api.checkConnection({ connection }, { stream: true });
      useStore.getState().apply({ profile: result.profile });
      useStore
        .getState()
        .notify(result.check.message, result.check.status === 'ready' ? 'success' : 'error');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  async function save() {
    setBusy('save');
    setError('');
    try {
      const result = await api.saveProfile({
        displayName,
        replyTo,
        deliveryMode: mode,
        introDismissed: true,
      });
      useStore.getState().apply({ profile: result.profile });
      useStore.getState().notify('Operator preferences saved.', 'success');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  async function verifySender() {
    setBusy('sender');
    setError('');
    try {
      const result = await api.verifySender({ address: sender, confirmed: confirm });
      useStore.getState().apply({ profile: result.profile });
      setMode('test');
      setVerifyOpen(false);
      useStore.getState().notify(result.message, result.verified ? 'success' : 'error');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy('');
    }
  }
  const rows = [
    {
      key: 'astra' as const,
      title: 'GPT-6 Astra',
      icon: IconCpu,
      state: profile?.astraCheck?.status || 'unchecked',
      caption:
        profile?.astraCheck?.message ||
        'Pinned engine. High reasoning and native web are configured; a live check is not yet recorded.',
    },
    {
      key: 'cohost' as const,
      title: 'CoHost Club API',
      icon: IconWorld,
      state: !data.setup.cohostConfigured ? 'missing' : profile?.cohostCheck?.status || 'unchecked',
      caption: !data.setup.cohostConfigured
        ? 'The base URL and API key have not been configured in the platform secret store.'
        : profile?.cohostCheck?.message ||
          'Credentials configured. Check the current event response.',
    },
  ];
  return (
    <section className="page settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PREFLIGHT</span>
          <h1>
            Check your instruments<span className="amber">.</span>
          </h1>
          <p>Research can run before email is ready. Nothing sends without approval.</p>
        </div>
        <Link href="/" className="text-link">
          Back to the desk
          <IconArrowRight size={15} />
        </Link>
      </div>
      <div className="settings-scroll">
        <div className="settings-grid">
          <section>
            <h2 className="section-title">SYSTEMS CHECK</h2>
            <div className="panel connection-panel">
              {rows.map((row) => (
                <div className="connection-row" key={row.key}>
                  <row.icon size={24} stroke={1.25} className="amber" />
                  <div className="connection-copy">
                    <h3>
                      {row.title}
                      <Badge
                        tone={
                          row.state === 'ready'
                            ? 'positive'
                            : row.state === 'failed'
                              ? 'negative'
                              : 'amber'
                        }
                      >
                        {row.state === 'ready'
                          ? 'CHECKED'
                          : row.state === 'missing'
                            ? 'NEEDS SETUP'
                            : row.state === 'failed'
                              ? 'CHECK FAILED'
                              : 'NOT YET CHECKED'}
                      </Badge>
                    </h3>
                    <p>{row.caption}</p>
                  </div>
                  {row.state === 'missing' ? (
                    <Button onClick={() => setSecretsOpen(true)}>Configure</Button>
                  ) : (
                    <Button
                      loading={busy === row.key}
                      disabled={Boolean(busy)}
                      onClick={() => void check(row.key)}
                    >
                      Check
                    </Button>
                  )}
                </div>
              ))}
              <div className="connection-row">
                <IconMail size={24} stroke={1.25} className="amber" />
                <div className="connection-copy">
                  <h3>
                    Managed email
                    <Badge tone={profile?.senderVerified ? 'positive' : 'amber'}>
                      {profile?.senderVerified ? 'VERIFIED SENDER' : 'NEEDS SETUP'}
                    </Badge>
                  </h3>
                  <p>
                    {profile?.senderVerified
                      ? profile.senderAddress
                      : 'Use an address on the app’s configured sending domain. Verify it with a message to your own inbox.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="operator-note">
              <IconShieldLock size={23} stroke={1.25} />
              <div>
                <h3>Private operator access</h3>
                <p>
                  Before publishing, restrict sign-in to your address using the platform email
                  allowlist. Authentication protects this console; no public signup or team roles
                  are needed.
                </p>
                <small>Secrets never enter the browser, prompts, or repository.</small>
              </div>
            </div>
            <section className="sender-setup">
              <h2 className="section-title">MANAGED SENDER</h2>
              <p className="muted">
                Assign an app-owned domain or platform subdomain in Remy, then verify its sending
                address here. The mail service checks ownership.
              </p>
              <Field
                label="Sending address"
                hint="This is the app's address, not your personal Gmail or Outlook From."
              >
                <input
                  type="email"
                  placeholder="sponsorships@your-app-domain.com"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                />
              </Field>
              <Button
                disabled={!auth.email.isValid(sender) || Boolean(busy)}
                onClick={() => {
                  setVerifyOpen(true);
                  setConfirm(false);
                }}
              >
                Verify managed sender
                <IconArrowRight size={14} />
              </Button>
            </section>
          </section>
          <section className="operator-settings">
            <h2 className="section-title">YOUR OUTREACH IDENTITY</h2>
            <div className="panel preferences-panel">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void save();
                }}
              >
                <Field label="Display name">
                  <input
                    value={displayName}
                    maxLength={80}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </Field>
                <Field
                  label="Reply-To inbox"
                  hint="Replies to sponsor outreach come here."
                  error={
                    replyTo && !auth.email.isValid(replyTo) ? 'Enter a valid email address.' : ''
                  }
                >
                  <input
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                  />
                </Field>
                <div className="field">
                  <span className="field-label">DELIVERY MODE</span>
                  <div className="mode-options">
                    <button
                      type="button"
                      className={mode === 'test' ? 'chosen' : ''}
                      onClick={() => setMode('test')}
                    >
                      <IconCircleDashed size={18} />
                      <span>
                        <b>Test delivery</b>
                        <small>Preview messages go to your operator inbox, not a sponsor.</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={mode === 'live' ? 'chosen' : ''}
                      disabled={!profile?.senderVerified}
                      onClick={() => setMode('live')}
                    >
                      <IconCircleCheck size={18} />
                      <span>
                        <b>Live outreach</b>
                        <small>Messages go to sponsors only after individual approval.</small>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="form-error" role="status">
                  {error || '\u00a0'}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  loading={busy === 'save'}
                  disabled={
                    Boolean(busy && busy !== 'save') ||
                    !displayName.trim() ||
                    !auth.email.isValid(replyTo)
                  }
                  className="full-width"
                >
                  SAVE PREFERENCES
                </Button>
              </form>
            </div>
            <div className="settings-footnote">
              <span className="eyebrow">THE APPROVAL BOUNDARY</span>
              <p>
                Saving preferences never approves a draft. Changing the sender, Reply-To or delivery
                mode invalidates an open send confirmation.
              </p>
              <p>Sample records always remain simulation-only.</p>
            </div>
          </section>
        </div>
      </div>
      <Modal
        open={secretsOpen}
        onClose={() => setSecretsOpen(false)}
        title="Connect CoHost Club"
        description="Set these in the platform secret store, not in this app's database."
      >
        <div className="secret-key">
          <IconKey size={16} />
          <code>COHOST_API_BASE_URL</code>
        </div>
        <p className="muted">The HTTPS base URL of your separate CoHost Club app.</p>
        <div className="secret-key">
          <IconKey size={16} />
          <code>COHOST_API_KEY</code>
        </div>
        <p className="muted">The API key for its sponsorable-events endpoint.</p>
        <div className="inline-notice amber">
          Configure development and production values separately. Refresh the console afterward to
          pick up readiness.
        </div>
        <Button
          onClick={() => {
            setSecretsOpen(false);
            void useStore.getState().bootstrap();
          }}
        >
          Refresh connection status
        </Button>
      </Modal>
      <Modal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Verify the managed sender"
        description="One requested check email, only to your operator inbox."
        busy={busy === 'sender'}
        footer={
          <>
            <Button onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!confirm}
              loading={busy === 'sender'}
              onClick={() => void verifySender()}
            >
              SEND CHECK
            </Button>
          </>
        }
      >
        <div className="envelope">
          <div>
            <span>FROM</span>
            <strong>{sender}</strong>
          </div>
          <div>
            <span>TO</span>
            <strong>{profile?.email}</strong>
          </div>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          <span>Send this verification to my inbox. No sponsor will be contacted.</span>
        </label>
        <div className="form-error">{error}</div>
      </Modal>
    </section>
  );
}
