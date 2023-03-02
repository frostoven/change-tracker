/**
 * Mechanism to keep track variable initialisation and changes.
 */
export default class ChangeTracker {
  /**
   * The variable being tracked. Please do not directly edit this value;
   * doing so will mess up logical integrity. Instead, use setValue() to
   * alter it.
   * @private
   */
  private _cached: any;

  /**
   * Use this if you want to trick the constructor into setting undefined as
   * a real value. Note: this has no effect if setting your tracked value as
   * undefined later; it purely defines how the constructor initializes.
   * @private
   */
  private _valueAlreadySet: boolean;

  /**
   * Contains all one-off listeners.
   * @type {(function())[]}
   * @private
   */
  private _singleListeners: Function[];

  /**
   * Contains all listeners that should be notified for every change.
   * @type {(function())[]}
   * @private
   */
  private readonly _multiListeners: Function[];

  /**
   * Like _singleListeners, but ignored current value.
   * @type {(function())[]}
   * @private
   */
  private _nextListeners: Function[];

  /**
   * Static function that waits for all specified ChangeTracker instances to
   * perform at least one getOnce. Returns a ChangeTracker instance to keep
   * track of progress completion; this returned ChangeTracker will provide an
   * an {error,results} style response with an array containing the results of
   * the trackers you provide, in order. The error object will be null unless a
   * timeout it set.
   *
   * You may specify a timeout. If the timeout is reached and everything has
   * not been resolved, then the returned ChangeTracker instance will emit an
   * error with partial results. If everything eventually completes, the
   * returned tracker will emit again, this time with full results.
   */
  static waitForAll(trackers: Array<ChangeTracker>, timeoutMs = 0) {
    let waiter = new ChangeTracker();

    let fulfilled = 0;
    const total = trackers.length;
    const results = new Array(total);

    let timer;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        waiter.setValue({
          error: `[ChangeTracker.waitForAll] Not done after ${timeoutMs}ms`,
          results,
        });
      }, timeoutMs);
    }

    for (let i = 0; i < total; i++) {
      const tracker = trackers[i];
      tracker.getOnce((value) => {
        results[i] = value;
        if (++fulfilled === total) {
          if (timer) {
            clearTimeout(timer);
          }
          waiter.setValue({ error: null, results });
        }
      });
    }

    return waiter;
  }

  /**
   * @param {any} initialValue - The initial value. Be careful with this if
   *   heavily relying on getNext() immediately after initialisation.
   * @param {object|undefined} Options
   * @param {boolean} Options.forceSetFlag If true, makes the ChangeTracker
   *   believe a value has been set at least once, even if it hasn't been set
   *   at all. The purpose of this flag is to make getOnce() and getEveryChange()
   *   immediately send `undefined` if the value has not yet been set. Default
   *   is false, which means those functions will only call back after
   *   setValue() has been called at least once.
   */
  constructor(initialValue=undefined, { forceSetFlag=false }={forceSetFlag: false}) {
    this._cached = initialValue;

    if (forceSetFlag) {
      // Pretend we've set the value using setValue().
      this._valueAlreadySet = true;
    }
    else {
      // Tracks if the variable has been set at least once.
      this._valueAlreadySet = typeof initialValue !== 'undefined';
    }

    this._singleListeners = [];
    this._multiListeners = [];
    this._nextListeners = [];
  }

  /**
   * The exact value as it's currently stored. Note that this may be undefined,
   * and is not ideal for all cases.
   */
  get cachedValue() {
    return this._cached;
  }

  set cachedValue(value) {
    // Setting cache directly reduces readability if a user is not familiar
    // with the internals; warn.
    console.warn('ChangeTracker.cached should not be set directly. Use .setValue() instead.');
    this.setValue(value);
  }

  /**
   * Using this, you'll be notified the first time the value changes. If the
   * value has already been set, you'll be notified immediately.
   * @param {function} callback
   */
  getOnce(callback: Function) {
    if (this._valueAlreadySet) {
      callback(this._cached);
    }
    else {
      this._singleListeners.push(callback);
    }
  }

  /**
   * Using this, you'll be notified every time the value changes. If the value
   * has already been set, you'll be notified immediately.
   * @param {function} callback
   */
  getEveryChange(callback: Function) {
    this._multiListeners.push(callback);
    if (this._valueAlreadySet) {
      callback(this._cached);
    }
  }

  /**
   * Notified you the next time the value changes. Does not return the current
   * value.
   * @param {function} callback
   */
  getNext(callback: Function) {
    this._nextListeners.push(callback);
  }

  /**
   * Sets the value, then notifies those waiting for it.
   * @param {*} value
   */
  setValue(value: any) {
    // We store all callbacks in here, then call them afterwards. This is to
    // prevent situations where a running function does something to make us
    // lose queue priority (like async operations) while another function tries
    // to remove a listener, resulting in race conditions.
    const callbacks: Function[] = [];

    this._cached = value;
    if (!this._valueAlreadySet) {
      this._valueAlreadySet = true;

      // Gather all one-off listeners.
      const singleListeners = this._singleListeners;
      for (let i = 0; i < singleListeners.length; i++) {
        // singleListeners[i](value);
        callbacks.push(singleListeners[i]);
      }

      // Mark for garbage collection.
      // @ts-ignore
      this._singleListeners = null;
    }

    // Shallow-clone nextListeners.
    const nextListeners = this._nextListeners.slice();
    // Mark old next-only listeners for garbage collection.
    this._nextListeners = [];
    // Gather all next-only listeners.
    for (let i = 0; i < nextListeners.length; i++) {
      //nextListeners[i](value);
      callbacks.push(nextListeners[i]);
    }

    // Gather all subscribers.
    for (let i = 0; i < this._multiListeners.length; i++) {
      callbacks.push(this._multiListeners[i]);
    }

    // Invoke all callbacks.
    for (let i = 0, len = callbacks.length; i < len; i++) {
      callbacks[i](value);
    }
  }

  /**
   * Sets the value, but does not notify anything listening for changes. This
   * should not be done in most cases, and is likely to create state corruption
   * bugs if used frivolously.
   * @param {*} value
   */
  setSilent(value: any) {
    this._cached = value;
  }

  /**
   * Removes a listener that was set using getOnce().
   * @param {function} listener - Function originally passed to getOnce().
   * @return {boolean} Returns true if removed, false if not found.
   */
  removeGetOnceListener(listener: Function) {
    const index = this._singleListeners.indexOf(listener);
    return !!(index !== -1 && this._singleListeners.splice(index, 1));
  }

  /**
   * Removes a listener that was set using getEveryChange().
   * @param {function} listener - Function originally passed to getEveryChange().
   * @return {boolean} Returns true if removed, false if not found.
   */
  removeGetEveryChangeListener(listener: Function) {
    const index = this._multiListeners.indexOf(listener);
    return !!(index !== -1 && this._multiListeners.splice(index, 1));
  }

  /**
   * Removes a listener that was set using getEveryChange().
   * @param {function} listener - Function originally passed to getEveryChange().
   * @return {boolean} Returns true if removed, false if not found.
   */
  removeGetNextListener(listener: Function) {
    const index = this._nextListeners.indexOf(listener);
    return !!(index !== -1 && this._nextListeners.splice(index, 1));
  }
}
