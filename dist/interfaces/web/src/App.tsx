import { useEffect, useRef, useState } from 'react';
import { auth, events, platform } from '@mindstudio-ai/interface';
import { Link, Route, Router, Switch, useLocation, useSearch } from 'wouter';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { IconRadar2, IconMail, IconBuildingSkyscraper, IconCalendarEvent, IconSettings2, IconLogout, IconUser, IconTerminal2, IconArrowRight } from '@tabler/icons-react';
import api from './api';
import { useStore, messageOf } from './store';
import { useNavigation } from './navigation';
import { MARK, Toasts, Button, Skeleton, Modal, Empty } from './components/ui';
import { FirstVisit } from './components/FirstVisit';
import { Login } from './components/Login';
import { RunPage } from './pages/RunPage';
import { QueuePage } from './pages/QueuePage';
import { SponsorsPage } from './pages/SponsorsPage';
import { EventsPage } from './pages/EventsPage';
import { SettingsPage } from './pages/SettingsPage';

function PrivateShell() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const [profileMenu, setProfileMenu] = useState(false);
  const account = useRef<HTMLDivElement>(null);
  const operatorButton = useRef<HTMLButtonElement>(null);
  const data = useStore((s) => s.data);
  const error = useStore((s) => s.error);
  const loading = useStore((s) => s.loading);
  const connected = useStore((s) => s.connected);
  const guard = useNavigation((s) => s.guard);
  const pendingNavigation = useNavigation((s) => s.pending);
  const selectedDraft = data?.drafts.find((d) => d.id === new URLSearchParams(search).get('draft'));
  const caseOpen = location === '/queue' && Boolean(selectedDraft);
  const needsSetup = !data?.setup.cohostConfigured || !data?.setup.senderConfigured;

  useEffect(() => {
    setProfileMenu(false);
    const title = location.startsWith('/queue') ? 'Approval queue' : location.startsWith('/sponsors') ? 'Sponsor library' : location.startsWith('/events') ? 'Event demand' : location.startsWith('/settings') ? 'Preflight' : 'Research desk';
    document.title = `${title} | Sponsor Scout`;
  }, [location]);
  useEffect(() => {
    if (!profileMenu) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !account.current?.contains(event.target)) setProfileMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setProfileMenu(false); operatorButton.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    account.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [profileMenu]);
  useEffect(() => {
    // A completed save can safely fulfill a navigation request that was waiting.
    if (pendingNavigation && !guard) useNavigation.getState().leave();
  }, [guard, pendingNavigation]);
  useEffect(() => {
    const selectRow = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || !['j', 'k'].includes(event.key.toLowerCase()) || document.querySelector('[role=dialog]')) return;
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable=true],.profile-menu')) return;
      const rows = [...document.querySelectorAll<HTMLElement>('.queue-row,.data-table tbody tr')];
      if (!rows.length) return;
      event.preventDefault();
      const index = rows.indexOf(document.activeElement as HTMLElement);
      const next = index < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, index + (event.key.toLowerCase() === 'j' ? 1 : -1)));
      rows[next].focus();
    };
    window.addEventListener('keydown', selectRow);
    return () => window.removeEventListener('keydown', selectRow);
  }, []);
  useEffect(() => {
    let closed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pending = { runIds: new Set<string>(), sponsorIds: new Set<string>(), draftIds: new Set<string>(), profile: false };
    const seen = new Set<string>();
    const flush = async () => {
      const payload = { runIds: [...pending.runIds], sponsorIds: [...pending.sponsorIds], draftIds: [...pending.draftIds], profile: pending.profile };
      pending.runIds.clear(); pending.sponsorIds.clear(); pending.draftIds.clear(); pending.profile = false; timer = undefined;
      try { const update = await api.readUpdates(payload); if (!closed) useStore.getState().apply(update); }
      catch (err) { if (!closed) useStore.getState().notify(messageOf(err), 'error'); }
    };
    void useStore.getState().bootstrap();
    const subscription = events.connect({
      getToken: () => api.watchWorkspace().then((r) => r.token),
      onConnect: () => { useStore.getState().setConnected(true); void useStore.getState().bootstrap(); },
      onGap: () => { void useStore.getState().bootstrap(); },
      onEvent: (event) => {
        const key = `${event.id}:${event.channel}`;
        if (seen.has(key)) return;
        seen.add(key); if (seen.size > 1000) seen.clear();
        const change = event.data as Record<string, unknown>;
        if (typeof change.runId === 'string') pending.runIds.add(change.runId);
        if (typeof change.sponsorId === 'string') pending.sponsorIds.add(change.sponsorId);
        if (typeof change.draftId === 'string') pending.draftIds.add(change.draftId);
        if (change.type === 'profile') pending.profile = true;
        if (!timer) timer = setTimeout(() => { void flush(); }, 180);
      },
    });
    return () => { closed = true; if (timer) clearTimeout(timer); subscription.close(); useStore.getState().setConnected(false); };
  }, []);

  const pendingCount = data?.drafts.filter((d) => d.reviewState === 'pending').length || 0;
  const sampleOnly = Boolean(data?.runs.length && data.runs.every((run) => run.isSample));
  const consoleStatus = !data ? 'OPENING CONSOLE' : !data.profile ? 'REFRESH SESSION' : sampleOnly ? 'SAMPLE DATA' : !data.setup.cohostConfigured ? 'LIVE DATA OFF' : connected ? 'CONSOLE ONLINE' : 'RECONNECTING';
  const statusTone = sampleOnly || needsSetup || !data?.profile ? 'amber' : connected ? 'positive' : 'muted';
  const items = [{ path: '/', label: 'Run', icon: IconRadar2 }, { path: '/queue', label: 'Queue', icon: IconMail }, { path: '/sponsors', label: 'Sponsors', icon: IconBuildingSkyscraper }, { path: '/events', label: 'Events', icon: IconCalendarEvent }];
  return (
    <div className={`app-shell ${caseOpen ? 'case-open' : ''}`} onClickCapture={(event) => {
      if (!useNavigation.getState().guard || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') as HTMLAnchorElement | null : null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.origin !== window.location.origin || target.href === window.location.href) return;
      const base = platform.basePath || '';
      if (base && !target.pathname.startsWith(`${base}/`) && target.pathname !== base) return;
      event.preventDefault(); event.stopPropagation();
      const path = `${target.pathname.slice(base.length) || '/'}${target.search}${target.hash}`;
      useNavigation.getState().request(() => navigate(path));
    }}>
      <aside className="rail">
        <Link href="/" className="rail-brand" aria-label="Sponsor Scout home"><img src={MARK} width="40" height="40" alt="Sponsor Scout reticle" /></Link>
        <nav>{items.map((item) => { const active = item.path === '/' ? location === '/' || location.startsWith('/runs/') : location.startsWith(item.path); const Icon = item.icon; return <Link key={item.path} href={item.path} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} title={item.label}><Icon size={21} stroke={1.5} /><span>{item.label}</span>{item.path === '/queue' && pendingCount > 0 && <motion.b key={pendingCount} initial={{ opacity: .5 }} animate={{ opacity: 1 }} className="nav-count">{pendingCount}</motion.b>}</Link>; })}</nav>
        <div className="rail-bottom" ref={account}>
          <Link href="/settings" className={`nav-item ${location === '/settings' ? 'active' : ''}`} title={needsSetup ? 'Settings: live setup incomplete' : 'Settings'} aria-label={needsSetup ? 'Settings, setup incomplete' : 'Settings'}><IconSettings2 size={20} stroke={1.5} /><span>Setup</span>{needsSetup && <i className="setup-attention" aria-hidden="true" />}</Link>
          <button ref={operatorButton} className="operator-button" onClick={() => setProfileMenu(!profileMenu)} aria-label="Operator menu" aria-haspopup="menu" aria-expanded={profileMenu}><IconUser size={19} stroke={1.5} /></button>
          <AnimatePresence>{profileMenu && <motion.div className="profile-menu" role="menu" aria-label="Operator account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .12 }}><span className="eyebrow">SIGNED IN</span><strong>{data?.profile?.displayName || 'Elly'}</strong><span className="muted break-anywhere">{auth.currentUser?.email}</span><button role="menuitem" onClick={() => useNavigation.getState().request(() => { void auth.logout(); })}><IconLogout size={16} />Sign out</button></motion.div>}</AnimatePresence>
        </div>
      </aside>
      <div className="workspace">
        <div className="workspace-top"><span><IconTerminal2 size={14} /><b>SPONSOR SCOUT</b><span className="slash">/</span>SPONSORSHIP OPERATIONS</span><span className="workspace-status" title="Console status is separate from live CoHost and email readiness."><i className={`status-dot ${statusTone}`} />{consoleStatus}<span className="top-version">V1.0</span></span></div>
        <div className="page-outlet">
          {loading ? <div className="page"><div className="page-heading"><Skeleton className="skeleton-title" /></div><Skeleton className="skeleton-readout" /><div className="skeleton-columns"><Skeleton /><Skeleton /></div></div> : error && !data ? <Empty title="Console unavailable" body={error} action={<Button onClick={() => void useStore.getState().bootstrap()}>Try again</Button>} /> : !data?.profile ? <Empty title="Refresh your sign-in" body="This session no longer has an operator profile. Sign in again to reopen the saved workspace. No drafts have been sent." action={<Button variant="primary" onClick={() => { useNavigation.getState().reset(); void auth.logout(); }}>SIGN IN AGAIN<IconArrowRight size={15} /></Button>} /> : <Switch>
            <Route path="/"><RunPage /></Route><Route path="/login"><RunPage /></Route><Route path="/runs/:id">{(params) => <RunPage runId={params.id} />}</Route>
            <Route path="/queue"><QueuePage /></Route><Route path="/sponsors"><SponsorsPage /></Route><Route path="/events"><EventsPage /></Route><Route path="/settings"><SettingsPage /></Route>
            <Route><Empty title="Nothing at this address." body="The saved workspace is still available." action={<Link className="text-link" href="/">Return to the research desk<IconArrowRight size={14} /></Link>} /></Route>
          </Switch>}
        </div>
        <div className="workspace-bottom"><span><i className="tiny-dot amber" />GPT-6 ASTRA<span className="bottom-divider">/</span>HIGH REASONING + NATIVE WEB</span><span>OUTREACH REQUIRES YOUR APPROVAL</span></div>
      </div>
      {data?.profile && !loading && <FirstVisit />}
      <Modal open={Boolean(pendingNavigation)} onClose={() => useNavigation.getState().stay()} title={guard?.busy ? 'Finishing your save' : 'Discard unsaved changes?'} description={guard?.busy ? 'Keep this view open until the save finishes.' : 'Your last saved version stays unchanged.'} footer={<><Button onClick={() => useNavigation.getState().stay()}>Keep editing</Button><Button variant="danger" disabled={guard?.busy} onClick={() => useNavigation.getState().leave()}>Discard and continue</Button></>}><p className="muted">{guard?.busy ? 'Navigation will continue when the save succeeds. You can also stay here.' : 'Only unsaved changes will be discarded. No email will be sent.'}</p></Modal>
      <Toasts />
    </div>
  );
}
export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const previousUser = useRef(auth.currentUser?.id || null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = auth.onAuthStateChanged((current) => {
      if (timer) clearTimeout(timer);
      const justVerified = Boolean(current && !previousUser.current);
      previousUser.current = current?.id || null;
      if (!current) { setUser(null); useStore.getState().clear(); useNavigation.getState().reset(); }
      else if (justVerified && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setTimeout(() => setUser(current), 180);
      else setUser(current);
    });
    return () => { if (timer) clearTimeout(timer); unsubscribe(); };
  }, []);
  return <MotionConfig reducedMotion="user"><Router base={platform.basePath || ''}><AnimatePresence initial={false} mode="wait">{user ? <motion.div className="app-stage" key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .1 }}><PrivateShell /></motion.div> : <Login key="sign-in" />}</AnimatePresence></Router></MotionConfig>;
}
