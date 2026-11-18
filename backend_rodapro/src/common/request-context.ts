import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  userId?: number;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(ctx: RequestContext, fn: () => T): T =>
  storage.run(ctx, fn);

export const currentUserId = (): number | undefined =>
  storage.getStore()?.userId;