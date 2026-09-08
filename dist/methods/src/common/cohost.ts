import { responseSchema, scopeSchema } from './validation';
import type { Scope, CoHostEvent } from './domain';
import { fingerprint } from './guards';

export function cohostConfigured() {
  return Boolean(process.env.COHOST_API_BASE_URL && process.env.COHOST_API_KEY);
}
export async function fetchEvents(scope: Partial<Scope> = {}) {
  if (!cohostConfigured())
    throw new Error(
      'Configure COHOST_API_BASE_URL and COHOST_API_KEY in the platform secret store first.',
    );
  const filters = scopeSchema.parse(scope);
  let url: URL;
  try {
    url = new URL(process.env.COHOST_API_BASE_URL!);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
      throw new Error();
    url.pathname = `${url.pathname.replace(/\/$/, '')}/_/api/sponsorable-events`;
  } catch {
    throw new Error('The CoHost connection needs a valid HTTPS base URL.');
  }
  for (const key of ['city', 'vertical', 'from', 'to'] as const)
    if (filters[key]) url.searchParams.set(key, filters[key]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.COHOST_API_KEY}`,
        Accept: 'application/json',
      },
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'CoHost Club rejected the API key. Check the configured secret.'
          : 'CoHost Club could not return events. Check the connection and try again.',
      );
    const reader = response.body?.getReader();
    if (!reader) throw new Error('CoHost Club returned an empty response.');
    const decoder = new TextDecoder();
    let text = '';
    let bytes = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 5 * 1024 * 1024) {
        await reader.cancel();
        throw new Error('The event response is too large. Narrow the run filters.');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const parsed = responseSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      throw new Error(
        'CoHost Club returned event details that do not match the documented contract.',
      );
    const seen = new Map<string, CoHostEvent>();
    for (const event of parsed.data.events) {
      if (seen.has(event.id) && fingerprint(seen.get(event.id)) !== fingerprint(event))
        throw new Error('CoHost Club returned conflicting duplicate event IDs.');
      seen.set(event.id, event);
    }
    const events = [...seen.values()]
      .filter((event) => event.date.unixMs > Date.now())
      .sort((a, b) => a.date.unixMs - b.date.unixMs);
    const notes: string[] = [];
    if (events.length < seen.size) notes.push(`${seen.size - events.length} past events excluded.`);
    if (parsed.data.count > parsed.data.events.length)
      notes.push('Limited snapshot: the service reports more events than it returned.');
    return { events, responseCount: parsed.data.count, fetchedAt: Date.now(), notes };
  } catch (err) {
    if (controller.signal.aborted)
      throw new Error('CoHost Club did not respond before the connection timed out.');
    // Deliberately do not expose fetch's URL-bearing network errors.
    if (err instanceof SyntaxError) throw new Error('CoHost Club returned unreadable event data.');
    if (err instanceof TypeError)
      throw new Error('Could not connect to CoHost Club. Check its configuration.');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
export function eventSignature(event: CoHostEvent) {
  return fingerprint({
    title: event.title,
    url: event.url,
    city: event.city,
    vertical: event.vertical,
    audience: event.audience,
    size: event.size,
    date: event.date,
    sponsorshipNeed: event.sponsorshipNeed,
  });
}
