export interface Throttler<A extends any[]> {
  readonly cancel: () => void;
  readonly throttle: (...args: A) => void;
  readonly flush?: () => void;
}
interface Options {
  leading?: boolean;
  trailing?: boolean;
}

// Run a function fn after rate ms. If another invocation occurs
// during the time it is waiting, update the arguments f will run
// with (but keep the current schedule)
// TODO: Add options argument, add flush function
export const adaptable = function <A extends any[]> (fn: (...a: A) => void, rate: number, options?: Options): Throttler<A> {
  let timer: number | null = null;
  let args: A | null = null;
  let calls = 0;
  const leading = options?.leading || false;
  const givenTrailing = options?.trailing || false;
  const trailing = !leading && !givenTrailing ? true : givenTrailing;

  const reset = () => {
    timer = null;
    args = null;
    calls = 0;
  };

  const cancel = function () {
    if (timer !== null) {
      clearTimeout(timer);
    }
    reset();
  };

  const flush = () => {
    fn.apply(null, args === null ? [] : args);
    cancel();
  };

  const throttle = function (...newArgs: A) {
    args = newArgs;
    calls++;
    if (timer === null) {
      if (leading) {
        fn.apply(null, args === null ? [] : args);
        args = null;
      }
      timer = setTimeout(function () {
        const blargs = args === null ? [] : args;
        if (trailing && calls > 1) {
          fn.apply(null, blargs);
        }
        reset();
      }, rate);
    }
  };

  return {
    cancel,
    flush,
    throttle
  };
};

// Run a function fn after rate ms. If another invocation occurs
// during the time it is waiting, ignore it completely.
export const first = function <A extends any[]> (fn: (...a: A) => void, rate: number): Throttler<A> {
  let timer: number | null = null;
  const cancel = function () {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const throttle = function (...args) {
    if (timer === null) {
      timer = setTimeout(function () {
        fn.apply(null, args);
        timer = null;
      }, rate);
    }
  };

  return {
    cancel,
    throttle
  };
};

// Run a function fn after rate ms. If another invocation occurs
// during the time it is waiting, reschedule the function again
// with the new arguments.
export const last = function <A extends any[]> (fn: (...a: A) => void, rate: number): Throttler<A> {
  let timer: number | null = null;
  const cancel = function () {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const throttle = function (...args) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      fn.apply(null, args);
      timer = null;
    }, rate);
  };

  return {
    cancel,
    throttle
  };
};
