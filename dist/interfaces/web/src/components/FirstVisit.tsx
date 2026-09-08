import { useState } from 'react';
import { useLocation } from 'wouter';
import { IconArrowRight, IconShieldCheck, IconAdjustmentsHorizontal } from '@tabler/icons-react';
import api from '../api';
import { useStore, messageOf } from '../store';
import { Modal, Button, Badge, MARK } from './ui';

export function FirstVisit() {
  const data = useStore((s) => s.data)!;
  const profile = data.profile;
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const samples = data.drafts.filter((d) => d.isSample && d.reviewState === 'pending').length;
  const open = Boolean(profile && !profile.introDismissed && !dismissed);
  async function finish(destination?: string) {
    if (!profile || busy) return;
    setBusy(true);
    try {
      const result = await api.saveProfile({
        displayName: profile.displayName || 'Elly',
        replyTo: profile.replyTo || profile.email,
        deliveryMode: profile.deliveryMode || 'test',
        introDismissed: true,
      });
      useStore.getState().apply({ profile: result.profile });
    } catch (error) {
      useStore.getState().notify(messageOf(error), 'error');
    } finally {
      setDismissed(true);
      setBusy(false);
      if (destination) navigate(destination);
    }
  }
  return <Modal open={open} onClose={() => void finish()} title="Your sponsorship desk" description="Astra researches. You decide what sends." busy={busy} footer={<>
    <Button onClick={() => void finish('/settings')} disabled={busy}><IconAdjustmentsHorizontal size={15} />Open preflight</Button>
    <Button variant="primary" loading={busy} onClick={() => void finish(samples ? '/queue' : '/sponsors')}>{samples ? 'EXPLORE SAMPLE DRAFTS' : 'OPEN SPONSOR LIBRARY'}<IconArrowRight size={15} /></Button>
  </>}>
    <div className="first-visit-intro"><img src={MARK} alt="Sponsor Scout reticle" width={64} height={64} /><div><Badge tone="amber">{samples ? 'SAFE SAMPLE WORKSPACE' : 'PRIVATE OPERATOR WORKSPACE'}</Badge><p>{samples ? `${samples} sample drafts let you inspect the evidence, edit a letter, and simulate approval. No sample can send email.` : 'Add companies you know, connect CoHost Club, and start a scout to build your review queue.'}</p></div></div>
    <div className="first-visit-checks">
      <div><span>Research engine</span><Badge>{data.setup.modelConfig.model.toUpperCase()}</Badge></div>
      <div><span>Live CoHost events</span><Badge tone={data.setup.cohostConfigured ? 'muted' : 'amber'}>{data.setup.cohostConfigured ? 'CONFIGURED' : 'NEEDS CONNECTION'}</Badge></div>
      <div><span>Managed sender</span><Badge tone={data.setup.senderConfigured ? 'positive' : 'amber'}>{data.setup.senderConfigured ? 'VERIFIED' : 'NEEDS SETUP'}</Badge></div>
    </div>
    <p className="first-visit-safety"><IconShieldCheck size={16} />Every real email requires recipient review and your explicit approval. Restrict sign-in to your operator email before publishing.</p>
  </Modal>;
}
