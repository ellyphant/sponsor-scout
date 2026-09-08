import { events } from '@mindstudio-ai/agent';
import { requireUser } from './common/guards';
export async function watchWorkspace() {
  return events.grant(`user:${requireUser()}`);
}
