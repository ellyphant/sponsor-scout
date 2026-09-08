// Shared JSON contracts. Tables retain their own top-level schema declarations.
export interface CoHostEvent {
  id: string;
  title: string;
  description: string;
  url: string;
  city: string;
  vertical: string;
  audience: string[];
  size: { capacity: number | null; bucket: string };
  date: { iso: string; unixMs: number };
  sponsorshipNeed: string;
  host: { name: string; company: string; verified: boolean; eventsHosted: number };
}
export interface Scope {
  city: string;
  vertical: string;
  from: string;
  to: string;
  newLimit: number;
}
export interface Source {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  retrievedAt: number;
  publishedAt: string | null;
  checked: boolean;
  isSample: boolean;
}
export interface Factor {
  key: 'funding' | 'competitive' | 'history' | 'team';
  label: string;
  rating: number;
  status: 'supported' | 'inferred' | 'unknown' | 'contradicted';
  reason: string;
  sourceIds: string[];
}
export interface Match {
  eventId: string;
  score: number;
  reason: string;
  city: { rating: number; reason: string };
  audience: { rating: number; reason: string };
  vertical: { rating: number; reason: string };
}
export interface Contact {
  name: string;
  role: string;
  email: string;
  sourceUrl: string;
  note: string;
}
export interface Check {
  status: 'unchecked' | 'ready' | 'failed';
  checkedAt: number;
  message: string;
}
export interface Counters {
  researched: number;
  qualified: number;
  matched: number;
  drafts: number;
}
export interface ModelConfig {
  model: string;
  reasoningEffort: string;
  nativeWeb: boolean;
}
export type RunStatus =
  | 'queued'
  | 'fetching'
  | 'running'
  | 'complete'
  | 'partial'
  | 'failed'
  | 'stopping'
  | 'stopped'
  | 'abandoned';
export interface Envelope {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  body: string;
  eventIds: string[];
}
export interface Approval {
  at: number;
  by: string;
  fingerprint: string;
  revision: number;
}
export const MODEL = 'gpt-6-astra';
export const MODEL_CONFIG: ModelConfig = { model: MODEL, reasoningEffort: 'high', nativeWeb: true };
export const ASTRA_OVERRIDE = {
  // Provider-default sampling on the verified high-reasoning/native-web path.
  model: MODEL,
  temperature: 1,
  maxResponseTokens: 32000,
  config: { reasoning_effort: 'high', tools: ['web_search'] },
};
export const QUALIFICATION_WEIGHTS = { funding: 35, competitive: 25, history: 25, team: 15 };
export function qualification(factors: Factor[]) {
  const score =
    factors.reduce(
      (n, f) =>
        n +
        QUALIFICATION_WEIGHTS[f.key] *
          (f.status === 'unknown' || f.status === 'contradicted' ? 0 : f.rating),
      0,
    ) / 500;
  return {
    score,
    qualified:
      score >= 0.65 &&
      factors.filter((f) => f.status === 'supported' && f.rating > 0 && f.sourceIds.length)
        .length >= 2,
  };
}
export function matchScore(match: Pick<Match, 'city' | 'audience' | 'vertical'>) {
  return (30 * match.city.rating + 40 * match.audience.rating + 30 * match.vertical.rating) / 500;
}
export const ACTIVE_RUN_STATES: RunStatus[] = ['queued', 'fetching', 'running', 'stopping'];
