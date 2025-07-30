import { JsonRpcClient } from "jsonrpc";
import { ExecuteQueryResult, RelDataElement, RelDataGroup } from "./json_types.mjs";
import { TwRuntimeMeasure } from "./json_types.mjs";
import { Query, ResourceRestricted } from "./interfaces.mjs";
import { ResultSet } from "./result_set.mjs";
import { InvalidQueryException } from "./abstract_query.mjs";
import { PolledQuery } from "./polled_query.mjs";
import { Subscription } from "./subscription.mjs";
import { BatchSubscription } from "./batch_subscription.mjs";

/**
* A TriggerwareClient provides a connection to a Triggerware server. It contains some helpful
* methods for quickly executing and validating queries, but will mostly be passed around to
* different objects that need to interact with the server, such as PolledQueries and Subscriptions.
*/
export class TriggerwareClient extends JsonRpcClient {
    private _batchSubscriptionCounter = 0;
    private _polledQueryCounter = 0;
    private _subscriptionCounter = 0;

    /**
     * The default fetch size for all queries to be executed.
     */
    defaultFetchSize: number | null = 10;

    /**
     * The default timeout that any query (which is allowed to timeout) will use.
     */
    defaultTimeout: number | null = null;

    /**
     * Executes a query on the connected server.
     * @param query An object containing a query string and language/namespace restriction.
     * Recommended to be either a SqlQuery or a FolQuery.
     * @returns A ResultSet<T> that stores the rows provided by the server.
     */
    public async executeQuery<T>(
        query: Query,
        restriction?: ResourceRestricted
    ): Promise<ResultSet<T>> {
        const parameters: Record<string, unknown> = {
            query: query.query,
            language: query.language,
            namespace: query.schema,
        };
        if (restriction) {
            if (restriction.rowLimit !== null) {
                parameters["limit"] = restriction.rowLimit;
            }
            if (restriction.timeout !== null) {
                parameters["timelimit"] = restriction.timeout;
            }
        } else {
            if (this.defaultFetchSize !== null) {
                parameters["limit"] = this.defaultFetchSize;
            }
            if (this.defaultTimeout !== null) {
                parameters["timelimit"] = this.defaultTimeout;
            }
        }
        const result = await this.call<ExecuteQueryResult<T>>("execute-query", parameters);
        return new ResultSet<T>(this, result);
    }

    /**
     * Checks whether a query string is valid for its specified language and namespace.
     * @param query An object containing a query string and language/namespace restriction.
     * Recommended to be either a SqlQuery or a FolQuery.
     * @throws {InvalidQueryException} if the query is invalid
     */
    public async validateQuery(query: Query): Promise<void> {
        const parameters = [query.query, query.language, query.schema];
        try {
            await this.call<unknown>("validate", parameters);
        } catch (e: any) {
            throw new InvalidQueryException(e.message ?? "invalid query");
        }
    }

    /**
     * Noop request. Useful for performance testing.
     */
    public async noop(): Promise<void> {
        await this.call<void>("noop", []);
    }

    /**
     * Issue a request on this client's primary connection to obtain a time/space consumption
     * measurement from the TW server.
     * @returns The current TwRuntimeMeasure reported by the TW server.
     */
    public async getRuntimeMeasure(): Promise<TwRuntimeMeasure> {
        return await this.call<TwRuntimeMeasure>("runtime", []);
    }

    /**
    * Fetches a collection of connectors Triggerware supports, including their table names and
    * signatures.
    * @returns Connector data, grouped by category
    */
    public async getRelData(): Promise<RelDataGroup[]> {
        let rawData = await this.call<any[]>("reldata2017");
        return rawData.map((group: any[]) => {
            let name = group[0]
            let symbol = group[1]
            let elements: RelDataElement[] = []
            for (let i = 2; i < group.length; i++) {
                let element: RelDataElement = {
                    name: group[i][0],
                    signatureNames: group[i][1],
                    signatureTypes: group[i][2],
                    usage: group[i][3],
                    noIdea: group[i][4],
                    description: group[i][5]
                }
                elements.push(element);
            }

            return {
                name: name,
                symbol: symbol,
                elements: elements
            } as RelDataGroup
        })
    }

    /** @internal */
    public registerPolledQuery<T>(query: PolledQuery<T>): string {
        if (query.methodName != "")
            throw new TriggerwareClientException("PolledQuery has already been registered.");
        return "poll" + this._polledQueryCounter++;
    }

    /** @internal */
    public registerSubscription(subscription: Subscription<any>): string {
        if (subscription.label != "")
            throw new TriggerwareClientException("Subscription has already been registered.");
        return "sub" + this._subscriptionCounter++;
    }

    /** @internal */
    public registerBatchSubscription(batch: BatchSubscription): string {
        if (batch.methodName != "")
            throw new TriggerwareClientException("BatchSubscription has already been registered.");
        return "batch" + this._polledQueryCounter++;
    }
}

/**
 * TriggerwareClientException is the root class for exceptions that might be thrown by a TriggerwareClient
 * as a result of issuing a request to the server or handling a notification from the server.
 * A TriggerwareClientException is not a problem reported by the TW server.
 */
export class TriggerwareClientException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TriggerwareClientException";
    }
}


