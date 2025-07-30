import { ExecuteQueryResult } from "./json_types.mjs";
import { TriggerwareClient } from "./triggerware_client.mjs";

/**
 * Represents a result set returned from a server query with async iteration capabilities.
 * Manages row caching and fetching additional batches as needed.
 * 
 * @typeparam T The type of row this result set handles.
 */
export class ResultSet<T> implements AsyncIterableIterator<T> {
    private _cache: T[] = [];
    private _cacheIdx = 0;
    private _current: T | undefined;
    private _exhausted = false;

    /**
     * Creates a new ResultSet instance.
     * 
     * @param client The Triggerware client used for server communication
     * @param initialResult The initial query execution result
     */
    constructor(
        private client: TriggerwareClient, 
        private initialResult: ExecuteQueryResult<T>,
        rowLimit?: number,
        timeout?: number
    ) {
        this._cache = initialResult.batch.tuples;
        this._exhausted = initialResult.handle === null;
        this.rowLimit = rowLimit ?? client.defaultFetchSize;
        this.timeout = timeout ?? client.defaultTimeout;
    }

    /** Whether the result set has been exhausted */
    get exhausted(): boolean {
        return this._exhausted;
    }

    /** The current row limit for fetching batches */
    rowLimit: number | null;

    /** The timeout for fetching batches */
    timeout: number | null;

    /** Server handle for this result set */
    get handle(): number | null {
        return this.initialResult.handle;
    }

    /**
     * Async iterator implementation for consuming rows
     */
    async next(): Promise<IteratorResult<T>> {
        // If current cache is exhausted, try to fetch next batch
        if (this._cacheIdx >= this._cache.length) {
            if (this._exhausted)
                return { done: true, value: undefined };

            this._current = this._cache[this._cacheIdx];
            this._cacheIdx++;

            if (this._cacheIdx >= this._cache.length || this._exhausted)
                return { done: false, value: this._current };

            // Fetch next batch from server
            const result = await this.client.call<ExecuteQueryResult<T>>(
                'next-resultset-batch', 
                [this.handle, this.rowLimit, this.timeout]
            );

            this._cache = result.batch.tuples;
            this._cacheIdx = 0;
            this._exhausted = result.batch.exhausted;

            // If no more rows, signal completion
            if (this._cache.length === 0)
                return { done: true, value: this._current};
        }

        // Return current row
        const value = this._cache[this._cacheIdx];
        this._cacheIdx++;
        return { done: false, value };
    }

    /**
     * Allows using the result set in a for-await-of loop
     */
    [Symbol.asyncIterator]() {
        return this;
    }

    /**
     * Fetches the next n rows from the result set
     * 
     * @param n Number of rows to pull
     * @returns Array of pulled rows
     */
    async pull(n: number): Promise<T[]> {
        const result: T[] = [];
        for (let i = 0; i < n; i++) {
            const { done, value } = await this.next();
            if (done) break;
            result.push(value!);
        }
        return result.filter(v => v !== undefined);
    }

    /**
     * Returns a copy of the current cache
     */
    cacheSnapshot(): T[] {
        // return [...this._cache];
        return this._cache;
    }

    /**
     * Closes the result set on the server
     */
    async close(): Promise<void> {
        await this.client.call('close-resultset', [this.handle]);
    }
}
