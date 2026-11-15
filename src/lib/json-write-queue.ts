type QueueCarrier = typeof globalThis & {
  __portfolioJsonWriteQueue?: Promise<unknown>;
};

// The queue lives on globalThis: route handlers and server actions get separate
// copies of store modules in the built server bundles, and separate module-level
// queues interleaved read-modify-write and lost updates under concurrency.
// One process-wide queue serializes read-modify-write cycles across all stores.
export function enqueueJsonWrite<T>(task: () => Promise<T>): Promise<T> {
  const carrier = globalThis as QueueCarrier;
  const previous = carrier.__portfolioJsonWriteQueue ?? Promise.resolve();
  const result = previous.then(task, task);
  carrier.__portfolioJsonWriteQueue = result.catch(() => undefined);
  return result;
}
