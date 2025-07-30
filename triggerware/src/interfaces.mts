import { TriggerwareClient } from "./triggerware_client.mjs";

export interface Query {
    /**
     * A query string written in the specified language.
     */
    query: string;

    /**
     * The language this query is written in, either "sql" or "fol".
     */
    language: string;

    /**
     * The namespace this query is written in.
     */
    schema: string;
}

export interface ResourceRestricted {
    /**
     * The maximum number of rows that can be returned by the server at one time.
     */
    rowLimit?: number;

    /**
     * A time limit for a query response.
     */
    timeout?: number;
}
export interface TriggerwareObject {
    /**
     * The TriggerwareClient this object is associated with.
     */
    client: TriggerwareClient;

    /**
     * The handle of this object on the server. Null if not registered.
     */
    handle?: number;
}


