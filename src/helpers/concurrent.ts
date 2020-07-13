export function concurrent<T>(
  promiseFactories: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const len = promiseFactories.length;
  if (len === 0) {
    return Promise.resolve([]);
  }

  const results = new Array<T>(len);
  let resolveAll: (results: T[]) => void;
  let rejectAll: (reason?: any) => void;
  let rejectReason: any = null;
  const promise = new Promise<T[]>((resolve, reject) => {
    resolveAll = resolve;
    rejectAll = reject;
  });

  const startup = promiseFactories.slice(0, limit);
  const queue = promiseFactories.slice(limit);
  let index = limit;
  let counter = 0;

  function release() {
    counter++;

    if (rejectReason) {
      // wait until all in progress promises finish if there is some promise failures
      if (counter === Math.min(len, Math.ceil(counter / limit) * limit)) {
        rejectAll(rejectReason);
      }
      return;
    }
    if (!rejectReason && counter === len) {
      resolveAll(results);
      return;
    }

    if (queue.length) {
      run(queue.shift()!, index++);
    }
  }

  async function run(func: () => Promise<T>, idx: number) {
    try {
      const result = await func();
      results[idx] = result;
      release();
    } catch (ex) {
      rejectReason = ex;
      release();
    }
  }

  startup.forEach(run);

  return promise;
}
