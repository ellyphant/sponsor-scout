import { db } from '@mindstudio-ai/agent';
import { Sponsors } from '../src/tables/sponsors';
import { ScoutRuns } from '../src/tables/scoutRuns';
import { Assessments } from '../src/tables/assessments';
import { Drafts } from '../src/tables/drafts';
import { RunActivity } from '../src/tables/runActivity';
import { SAMPLE_OWNER } from '../src/common/sampleOwnership';
import {
  MODEL_CONFIG,
  qualification,
  matchScore,
  type CoHostEvent,
  type Factor,
  type Source,
  type Match,
} from '../src/common/domain';

export async function sponsorshipDesk() {
  const ownerId = SAMPLE_OWNER;
  const now = Date.now();
  const start = now - 260000;
  const days = (n: number) => {
    const date = new Date(now + n * 86400000);
    date.setUTCHours(18, 0, 0, 0);
    return date.getTime();
  };
  const fixtures = [
    [
      'Bay Area AI Founders Dinner',
      'San Francisco',
      'Applied AI',
      ['Founders', 'Operators'],
      40,
      12,
      'A partner to cover the room and dinner for founders building applied AI companies.',
      'Maya Torres',
      'Foundry Collective',
    ],
    [
      'AI Infrastructure Roundtable',
      'San Francisco',
      'AI infrastructure',
      ['CTOs', 'Engineering leaders', 'Founders'],
      80,
      16,
      'Support for the meeting space, coffee and recording of the technical discussion.',
      'Owen Park',
      'Build Circle',
    ],
    [
      'Enterprise AI Operators Night',
      'San Francisco',
      'Enterprise AI',
      ['Operators', 'IT leaders'],
      100,
      20,
      'A sponsor for the evening reception and AV support.',
      'Priya Mehta',
      'Operator Assembly',
    ],
    [
      'Founder and Capital Salon',
      'New York',
      'Software',
      ['Founders', 'Investors'],
      60,
      14,
      'Help with the venue and refreshments for a founder-investor salon.',
      'Jules Rivera',
      'City Founders',
    ],
    [
      'Brooklyn Builders Breakfast',
      'New York',
      'Developer tools',
      ['Founders', 'Operators'],
      30,
      18,
      'A breakfast sponsor for a small group of early-stage software founders.',
      'Sam Ellis',
      'Builders Table',
    ],
    [
      'Climate Data Meetup',
      'Austin',
      'Climate technology',
      ['Climate-tech operators', 'Data practitioners'],
      60,
      24,
      'Support for a community room and snacks for a climate data discussion.',
      'Nina Reed',
      'Climate Commons',
    ],
  ] as const;
  const events: CoHostEvent[] = fixtures.map((f, i) => ({
    id: `sample-event-${i + 1}`,
    title: f[0],
    description: `A host-led gathering for ${f[3].join(', ').toLowerCase()} to exchange practical experiences and make useful introductions. This is a fictional sample event.`,
    url: `https://example.com/cohost/sample-event-${i + 1}`,
    city: f[1],
    vertical: f[2],
    audience: [...f[3]],
    size: { capacity: f[4], bucket: f[4] <= 40 ? 'Intimate' : 'Small' },
    date: { iso: new Date(days(f[5])).toISOString(), unixMs: days(f[5]) },
    sponsorshipNeed: f[6],
    host: { name: f[7], company: f[8], verified: i !== 5, eventsHosted: [9, 12, 7, 5, 8, 3][i] },
  }));
  const names = [
    'Helio Grid',
    'Relay Foundry',
    'Meridian Stack',
    'Forgepath Cloud',
    'Cedar Signal',
    'Northline Data',
    'Orbitline AI',
    'Mosaic Field',
  ];
  const sectors = [
    'AI infrastructure',
    'AI developer tools',
    'Cloud FinOps',
    'Cloud platforms',
    'Data observability',
    'Analytics',
    'Applied AI',
    'Retail software',
  ];
  const ratings = [
    [5, 4, 5, 4],
    [4, 5, 4, 2],
    [4, 4, 2, 4],
    [2, 3, 1, 2],
    [1, 2, 0, 0],
    [2, 3, 1, 1],
    [2, 5, 0, 1],
    [3, 1, 1, 2],
  ];
  const summaries = [
    'Recent Series B funding, a clear AI infrastructure focus, and a history of developer events make Helio Grid a strong partner for the Bay Area founder and operator audience.',
    'Relay Foundry is investing in AI developer tools and has backed builder communities. The New York founder events fit its audience, but a public contact email is still missing.',
    'Meridian Stack has the funding and partnerships team to sponsor events. None of this snapshot’s audiences reaches its core finance and procurement buyers closely enough.',
    'Forgepath Cloud has a relevant product, but its earlier funding stage and limited event history do not establish a strong sponsorship case.',
    'Cedar Signal lacks enough current funding, sponsorship, and team evidence to qualify. Keep the unknowns visible rather than infer a budget.',
    'Northline Data overlaps with the technical audience, but the evidence for event spending and a field-marketing team is thin.',
    'Orbitline AI competes in a crowded market. Competitive pressure alone does not compensate for missing event-history evidence.',
    'Mosaic Field is a credible software company, but its retail buyer focus is distant from this snapshot’s audiences.',
  ];
  const sponsors = await Sponsors.push(
    names.map((name, i) => {
      const slug = name.toLowerCase().replaceAll(' ', '');
      const maintained = [2, 3, 4].includes(i);
      return {
        ownerId,
        name,
        website: `https://${slug}.example.com`,
        domain: `${slug}.example.com`,
        origin: maintained ? ('maintained' as const) : ('discovered' as const),
        maintained,
        archived: false,
        doNotContact: false,
        sector: sectors[i],
        regions: i === 1 ? ['New York'] : ['San Francisco'],
        audiences: i === 2 ? ['Finance leaders', 'Procurement'] : ['Founders', 'Operators'],
        notes: maintained
          ? 'Sample maintained company. Review the current evidence before outreach.'
          : '',
        contact: { name: '', role: '', email: '', sourceUrl: '', note: '' },
        isSample: true,
      };
    }),
  );
  const run = await ScoutRuns.push({
    ownerId,
    status: 'complete',
    scope: {
      city: '',
      vertical: '',
      from: new Date(now).toISOString().slice(0, 10),
      to: '',
      newLimit: 5,
    },
    events,
    includedSponsorIds: sponsors.filter((s) => s.maintained).map((s) => s.id),
    includedSponsors: sponsors
      .filter((s) => s.maintained)
      .map((s) => ({ id: s.id, name: s.name, website: s.website, notes: s.notes })),
    modelConfig: MODEL_CONFIG,
    counters: { researched: 8, qualified: 3, matched: 2, drafts: 2 },
    summary:
      '8 companies assessed. 3 qualified, 2 matched, 2 drafts ready for human review. Sample data only.',
    errors: [],
    unresolved: [],
    startedAt: start,
    finishedAt: now - 19000,
    lastProgressAt: now - 19000,
    budgetEndsAt: start + 1200000,
    fetchedAt: start + 5000,
    responseCount: events.length,
    snapshotNotes: ['Fictional sample events, not a live CoHost response.'],
    claimId: '',
    claimToken: '',
    isSample: true,
  });
  const records = sponsors.map((sponsor, i) => {
    const sources: Source[] = [
      'Funding announcement',
      'Product positioning',
      'Event sponsor record',
      'Events team',
    ].map((title, index) => ({
      id: `${sponsor.domain}-${index}`,
      url: `https://example.com/fixtures/${sponsor.domain}/${index}`,
      title: `${sponsor.name}: sample ${title.toLowerCase()}`,
      excerpt:
        index === 0
          ? `${sponsor.name} announced a ${i < 3 ? 'Series B' : 'Series A'} funding round. Fictional scenario evidence.`
          : index === 1
            ? `${sponsor.name} builds ${sectors[i].toLowerCase()} for its stated business audiences. Fictional scenario evidence.`
            : index === 2
              ? `${sponsor.name} supported ${i === 0 ? 'three developer community events' : 'a community gathering'}. Fictional scenario evidence.`
              : i === 0
                ? 'Dana Osei works in field marketing. Sample contact: dana.osei@example.com.'
                : 'A relevant partnerships function is described in this fictional fixture.',
      retrievedAt: start + 40000 + i * 10000,
      publishedAt: new Date(now - 70 * 86400000).toISOString().slice(0, 10),
      checked: true,
      isSample: true,
    }));
    const labels = ['Recent funding', 'Competitive positioning', 'Event history', 'Events team'];
    const keys = ['funding', 'competitive', 'history', 'team'] as const;
    const factors: Factor[] = keys.map((key, n) => ({
      key,
      label: labels[n],
      rating: ratings[i][n],
      status: ratings[i][n] ? 'supported' : 'unknown',
      reason: ratings[i][n]
        ? sources[n].excerpt
        : 'No reliable evidence is included in this sample case.',
      sourceIds: ratings[i][n] ? [sources[n].id] : [],
    }));
    const indices = i === 0 ? [0, 1, 2] : i === 1 ? [3, 4] : [];
    const matches: Match[] = indices
      .map((n, rank) => {
        const event = events[n];
        const dims = {
          city: {
            rating: 5,
            reason: `${sponsor.name}'s sample target region includes ${event.city}.`,
          },
          audience: {
            rating: rank === 2 ? 4 : 5,
            reason: `${event.audience.join(' and ')} align with the company's target buyers and community.`,
          },
          vertical: {
            rating: rank === 1 ? 4 : 5,
            reason: `${event.vertical} connects to ${sectors[i].toLowerCase()} and the sponsor's positioning.`,
          },
        };
        return {
          eventId: event.id,
          ...dims,
          score: matchScore(dims),
          reason:
            i === 0
              ? `A local ${event.audience[0].toLowerCase()} audience with a direct interest in applied AI and infrastructure. The host's specific ask is a concrete way to participate.`
              : 'A small New York founder audience fits a developer-tool company building relationships with early software teams.',
        };
      })
      .sort((a, b) => b.score - a.score);
    const result = qualification(factors);
    return {
      ownerId,
      runId: run.id,
      sponsorId: sponsor.id,
      status: 'complete' as const,
      qualified: result.qualified,
      qualificationScore: result.score,
      summary: summaries[i],
      factors,
      gaps:
        i === 0
          ? ['Current sponsorship budget and decision authority still need confirmation.']
          : i === 1
            ? ['No public business email has been found. Elly must add a recipient.']
            : ['Do not infer willingness to sponsor from company size alone.'],
      sources,
      contact:
        i === 0
          ? {
              name: 'Dana Osei',
              role: 'Field Marketing Lead',
              email: 'dana.osei@example.com',
              sourceUrl: sources[3].url,
              note: 'Sample evidence names a relevant field-marketing contact. Mailbox deliverability is not verified.',
            }
          : {
              name: '',
              role: '',
              email: '',
              sourceUrl: '',
              note: 'No public email found. Add a recipient you trust before approval.',
            },
      matches,
      fundingStage: i < 3 ? 'Series B' : i === 4 ? 'Unknown' : 'Series A',
      sector: sectors[i],
      regions: sponsor.regions,
      isSample: true,
    };
  });
  const assessments = await Assessments.push(records);
  await db.batch(
    ...sponsors.map((s, i) => Sponsors.update(s.id, { latestAssessmentId: assessments[i].id })),
  );
  await Drafts.push(
    assessments.slice(0, 2).map((assessment, i) => {
      const picks = assessment.matches.map((match) => events.find((e) => e.id === match.eventId)!);
      const listing = picks
        .map(
          (event) =>
            `${event.title} · ${new Date(event.date.unixMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${event.city}\n${event.audience.join(', ')}; capacity ${event.size.capacity}. The host needs: ${event.sponsorshipNeed}\n${event.url}`,
        )
        .join('\n\n');
      return {
        ownerId,
        runId: run.id,
        sponsorId: assessment.sponsorId,
        assessmentId: assessment.id,
        recipientName: assessment.contact.name,
        recipientRole: assessment.contact.role,
        recipientEmail: assessment.contact.email,
        recipientSource: i === 0 ? ('researched' as const) : ('missing' as const),
        recipientSourceUrl: assessment.contact.sourceUrl,
        subject:
          i === 0
            ? 'Three Bay Area AI events that fit Helio Grid'
            : 'Two New York founder gatherings for Relay Foundry',
        body: `${i === 0 ? 'Hi Dana,' : 'Hi there,'}\n\nI’m Elly. I help CoHost Club event hosts connect with relevant sponsors. ${i === 0 ? 'Helio Grid’s focus on AI infrastructure and developer communities caught my attention.' : 'Relay Foundry’s work with software builders makes these founder gatherings worth a look.'}\n\nWe have ${picks.length === 3 ? 'three' : 'two'} upcoming events whose audiences fit that focus:\n\n${listing}\n\nWould you like an introduction to any of the hosts? I can share more context on the audience and what a useful partnership could look like.\n\nBest,\nElly`,
        eventIds: picks.map((e) => e.id),
        revision: 1,
        reviewState: 'pending' as const,
        rejectionReason: '',
        isSample: true,
      };
    }),
  );
  const activity = [
    [
      'Event snapshot captured',
      'Six fictional CoHost Club events, each with a specific sponsorship ask.',
      'action',
      -1,
    ],
    [
      'Maintained list loaded',
      'Three maintained companies are included. Prior qualification is not carried forward.',
      'action',
      -1,
    ],
    [
      'Five discovery candidates added',
      'Sample discovery pool prepared for an evidence-first assessment.',
      'action',
      -1,
    ],
    ['Qualified · Helio Grid', summaries[0], 'finding', 0],
    [
      'Matched · Bay Area AI Founders Dinner',
      'Founders, a local AI audience, and a concrete room-and-dinner ask.',
      'action',
      0,
    ],
    [
      'Matched · AI Infrastructure Roundtable',
      'Technical buyers and a relevant discussion of AI infrastructure.',
      'action',
      0,
    ],
    [
      'Matched · Enterprise AI Operators Night',
      'Operator and IT-leader audiences with an enterprise AI focus.',
      'action',
      0,
    ],
    [
      'Draft ready · Helio Grid',
      'Three opportunities in one email. Dana Osei is the proposed sample recipient.',
      'finding',
      0,
    ],
    ['Qualified · Relay Foundry', summaries[1], 'finding', 1],
    [
      'Two New York events matched',
      'The founder salon and builders breakfast fit the company’s developer audience.',
      'action',
      1,
    ],
    [
      'Recipient needed · Relay Foundry',
      'Draft saved. No public email found; do not guess an address.',
      'action',
      1,
    ],
    ['Qualified, no event fit · Meridian Stack', summaries[2], 'finding', 2],
    [
      'Five companies did not qualify',
      'Insufficient evidence is a valid result. No emails were drafted for these companies.',
      'action',
      -1,
    ],
    [
      'Review queue prepared',
      'Two sample drafts await Elly’s review. Nothing was sent.',
      'status',
      -1,
    ],
  ] as const;
  await RunActivity.push(
    activity.map((a, i) => ({
      ownerId,
      runId: run.id,
      key: `sample-${i}`,
      seq: i + 1,
      timestamp: start + 5000 + i * 15000,
      kind: a[2],
      state: 'complete',
      label: a[0],
      detail: a[1],
      sponsorId: a[3] >= 0 ? sponsors[a[3]].id : '',
      sources: a[2] === 'finding' && a[3] >= 0 ? assessments[a[3]].sources.slice(0, 2) : [],
      isSample: true,
    })),
  );
  return { sponsors: 8, events: 6, assessments: 8, drafts: 2, activityEntries: activity.length };
}
