import { mindstudio, stream } from '@mindstudio-ai/agent';
import { Users } from './tables/users';
import { fetchEvents } from './common/cohost';
import { requireUser, announce, logFailure, withClaim } from './common/guards';
import { astraJson } from './common/astra';
import { MODEL } from './common/domain';
export async function checkConnection(input: { connection: 'cohost' | 'astra' }) {
  const ownerId = requireUser();
  if (!['cohost', 'astra'].includes(input.connection))
    throw new Error('Choose a supported connection.');
  return withClaim(ownerId, `check:${input.connection}`, async () => {
    let check;
    try {
      await stream({
        status: `Checking ${input.connection === 'astra' ? 'GPT-6 Astra' : 'CoHost Club'}`,
      });
      if (input.connection === 'cohost') {
        const result = await fetchEvents();
        check = {
          status: 'ready' as const,
          checkedAt: Date.now(),
          message:
            `${result.events.length} upcoming sponsorable events returned. ${result.notes.join(' ')}`.trim(),
        };
      } else {
        let checked = false;
        await mindstudio.runTask({
          model: MODEL,
          maxTurns: 3,
          prompt:
            'Call checkNativeResearch exactly once, then return its result. This is a connection check, not sponsor research.',
          input: {},
          tools: [
            {
              name: 'checkNativeResearch',
              description: 'Check the pinned high-reasoning Astra/native-web path. Call once.',
              inputSchema: { type: 'object', properties: {} },
              execute: async () => {
                try {
                  const result = await astraJson(
                    'Use native web search to find the official OpenAI homepage. Return the real company name and canonical public homepage URL. This is only a connectivity check.',
                    { date: new Date().toISOString() },
                    { company: 'OpenAI', url: 'https://openai.com' },
                  );
                  if (
                    !result ||
                    typeof result !== 'object' ||
                    !('url' in result) ||
                    !['openai.com', 'www.openai.com'].includes(new URL(String(result.url)).hostname)
                  )
                    throw new Error('Astra did not return the expected public source.');
                  checked = true;
                  return { ok: true };
                } catch (error) {
                  logFailure('Pinned Astra native-web call failed', error);
                  const details = (error as { details?: unknown }).details;
                  if (details)
                    console.error(
                      'Astra provider validation details',
                      JSON.stringify(details, (key, value) =>
                        /authorization|token|secret|cookie|headers|api.?key|input|prompt/i.test(key)
                          ? '[redacted]'
                          : value,
                      ).slice(0, 4000),
                    );
                  throw error;
                }
              },
            },
          ],
          outputSchema: {
            type: 'object',
            properties: { ok: { type: 'boolean' } },
            required: ['ok'],
          },
          onEvent: (e) => {
            if (e.type === 'tool_call_start')
              void stream({ status: 'Checking Astra high reasoning and native web research' });
          },
        });
        if (!checked) throw new Error('Astra did not execute the required research tool.');
        check = {
          status: 'ready' as const,
          checkedAt: Date.now(),
          message:
            'Astra task and high-reasoning native-web call completed. Returned public-source JSON was valid.',
        };
      }
    } catch (error) {
      logFailure(`${input.connection} connection check failed`, error);
      check = {
        status: 'failed' as const,
        checkedAt: Date.now(),
        message:
          input.connection === 'cohost' && error instanceof Error
            ? error.message
            : 'The Astra research check failed. No fallback model was used. Check the method logs.',
      };
    }
    const profile = await Users.update(
      ownerId,
      input.connection === 'cohost' ? { cohostCheck: check } : { astraCheck: check },
    );
    await announce(ownerId, { type: 'profile' });
    return { check, profile };
  });
}
