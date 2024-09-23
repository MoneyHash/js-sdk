/**
 * A promise that can be resolved or rejected from outside the promise later in execution.
 */

// Use Promise.withResolvers() when stable
// const { promise, resolve, reject } = Promise.withResolvers();

// this.promise = promise;
// this.resolve = resolve;
// this.reject = reject;

export default class DeferredPromise<T> {
  promise: Promise<T>;

  resolve!: (data: any) => void;

  reject!: (reason: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
