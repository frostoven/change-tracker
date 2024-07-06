declare type FlagType = {
    forceSetFlag: boolean;
};
/**
 * Mechanism to keep track variable initialisation and changes.
 */
export default class ChangeTracker<ValueType = any> {
    /**
     * The variable being tracked. Please do not directly edit this value;
     * doing so will mess up logical integrity. Instead, use setValue() to
     * alter it.
     * @private
     */
    private _cached;
    /**
     * Use this if you want to trick the constructor into setting undefined as
     * a real value. Note: this has no effect if setting your tracked value as
     * undefined later; it purely defines how the constructor initializes.
     * @private
     */
    private _valueAlreadySet;
    /**
     * Contains all one-off listeners.
     * @type {(function())[]}
     * @private
     */
    private _singleListeners;
    /**
     * Contains all listeners that should be notified for every change.
     * @type {(function())[]}
     * @private
     */
    private readonly _multiListeners;
    /**
     * Like _singleListeners, but ignored current value.
     * @type {(function())[]}
     * @private
     */
    private _nextListeners;
    /**
     * Static function that waits for all specified ChangeTracker instances to
     * perform at least one getOnce. Returns a ChangeTracker instance to keep
     * track of progress completion; this returned ChangeTracker will provide an
     * {error,results} style response with an array containing the results of the
     * trackers you provide, in order. The error object will be null unless a
     * timeout it set.
     *
     * You may specify a timeout. If the timeout is reached and everything has
     * not been resolved, then the returned ChangeTracker instance will emit an
     * error with partial results. If everything eventually completes, the
     * returned tracker will emit again, this time with full results.
     */
    static waitForAll(trackers: Array<ChangeTracker>, timeoutMs?: number): ChangeTracker<any>;
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
    constructor(initialValue?: any, { forceSetFlag }?: FlagType);
    /**
     * The exact value as it's currently stored. Note that this may be undefined,
     * and is not ideal for all cases.
     */
    get cachedValue(): ValueType;
    set cachedValue(value: ValueType);
    /**
     * Using this, you'll be notified the first time the value changes. If the
     * value has already been set, you'll be notified immediately.
     * @param {function} callback
     */
    getOnce(callback: (value: ValueType) => void): void;
    /**
     * Using this, you'll be notified every time the value changes. If the value
     * has already been set, you'll be notified immediately.
     * @param {function} callback
     */
    getEveryChange(callback: (value: ValueType) => void): void;
    /**
     * Notified you the next time the value changes. Does not return the current
     * value.
     * @param {function} callback
     */
    getNext(callback: (value: ValueType) => void): void;
    /**
     * Sets the value, then notifies those waiting for it.
     * @param {*} value
     */
    setValue(value: ValueType): void;
    /**
     * Sets the value, but does not notify anything listening for changes. This
     * should not be done in most cases, and is likely to create state corruption
     * bugs if used frivolously.
     * @param {*} value
     */
    setSilent(value: ValueType): void;
    /**
     * Removes a listener that was set using getOnce().
     * @param {function} listener - Function originally passed to getOnce().
     * @return {boolean} Returns true if removed, false if not found.
     */
    removeGetOnceListener(listener: Function): boolean;
    /**
     * Removes a listener that was set using getEveryChange().
     * @param {function} listener - Function originally passed to getEveryChange().
     * @return {boolean} Returns true if removed, false if not found.
     */
    removeGetEveryChangeListener(listener: Function): boolean;
    /**
     * Removes a listener that was set using getEveryChange().
     * @param {function} listener - Function originally passed to getEveryChange().
     * @return {boolean} Returns true if removed, false if not found.
     */
    removeGetNextListener(listener: Function): boolean;
}
export {};
