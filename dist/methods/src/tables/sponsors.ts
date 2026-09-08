import { db } from '@mindstudio-ai/agent';
import type { Contact } from '../common/domain';
interface Sponsor {
  ownerId: string;
  name: string;
  website: string;
  domain: string;
  origin: 'maintained' | 'discovered';
  maintained: boolean;
  archived: boolean;
  doNotContact: boolean;
  sector: string;
  regions: string[];
  audiences: string[];
  notes: string;
  contact: Contact;
  latestAssessmentId?: string;
  isSample: boolean;
}
export const Sponsors = db.defineTable<Sponsor>('sponsors', { unique: [['ownerId', 'domain']] });
