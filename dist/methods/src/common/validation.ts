import { z } from 'zod';
export const emailValue = z.string().trim().email().max(254);
export const optionalEmail = z.union([emailValue, z.literal('')]);
export function publicUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Use a public website URL.');
  const host = url.hostname.toLowerCase();
  if (
    !host.includes('.') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^[\d.:\[\]]+$/.test(host) ||
    host === 'localhost'
  )
    throw new Error('Use a public website URL.');
  return url;
}
export const websiteValue = z
  .string()
  .trim()
  .max(1500)
  .refine((value) => {
    try {
      publicUrl(value);
      return true;
    } catch {
      return false;
    }
  }, 'Enter a public http or https website.');
export const contactSchema = z.object({
  name: z.string().max(150),
  role: z.string().max(200),
  email: optionalEmail,
  sourceUrl: z.union([websiteValue, z.literal('')]),
  note: z.string().max(1500),
});
const calendar = z
  .string()
  .refine(
    (s) =>
      !s ||
      (/^\d{4}-\d{2}-\d{2}$/.test(s) &&
        Number.isFinite(Date.parse(s)) &&
        new Date(s).toISOString().slice(0, 10) === s),
    'Choose a valid date.',
  );
export const scopeSchema = z
  .object({
    city: z.string().trim().max(100).default(''),
    vertical: z.string().trim().max(100).default(''),
    from: calendar.default(''),
    to: calendar.default(''),
    newLimit: z.number().int().min(0).max(5).default(5),
  })
  .refine((s) => !s.from || !s.to || s.from <= s.to, 'The end date must follow the start date.');
export const eventSchema = z.object({
  id: z.string().min(1).max(250),
  title: z.string().min(1).max(500),
  description: z.string().max(20000).default(''),
  url: websiteValue,
  city: z.string().max(150),
  vertical: z.string().max(150),
  audience: z.array(z.string().max(150)).max(50),
  size: z.object({
    capacity: z.number().nonnegative().nullable().default(null),
    bucket: z.string().default('Not provided'),
  }),
  date: z
    .object({ iso: z.string(), unixMs: z.number().finite() })
    .refine(
      (d) => Number.isFinite(Date.parse(d.iso)) && Math.abs(Date.parse(d.iso) - d.unixMs) < 1000,
      'Event date is invalid.',
    ),
  sponsorshipNeed: z.string().max(10000).default(''),
  host: z.object({
    name: z.string(),
    company: z.string().default(''),
    verified: z.boolean(),
    eventsHosted: z.number().nonnegative(),
  }),
});
export const responseSchema = z.object({
  count: z.number().int().nonnegative(),
  events: z.array(eventSchema).max(500),
});
export function parseJson(content: string): unknown {
  const text = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Astra returned unreadable structured output.');
  }
}
export function cleanText(value: string, max = 5000) {
  return value
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, max);
}
