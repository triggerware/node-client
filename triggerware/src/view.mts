import { ExecuteQueryResult } from "./json_types.mjs";
import { AbstractQuery, InvalidQueryException } from "./abstract_query.mjs";
import { Query, ResourceRestricted } from "./interfaces.mjs";
import { QueryRestriction } from "./query_restriction.mjs";
import { PreparedQuery } from "./prepared_query.mjs";
import { ResultSet } from "./result_set.mjs";
import { TriggerwareClient } from "./triggerware_client.mjs";

/**
* A simple reusable view of a query. May be executed any number of times. Unlike other queries such
* as PreparedQuery, Views do not have a handle to a Triggerware server and are only stored locally.
*/
export class View<T> extends AbstractQuery<T> {
    constructor(
        client: TriggerwareClient,
        query: Query,
        restriction?: ResourceRestricted
    ) {
        super(client, query, restriction);
    }

    /**
     * Executes this query on the connected Triggerware server.
     * @param restriction An optional QueryRestriction to control execution limits.
     * @returns A ResultSet that stores the rows provided by the server.
     */
    async execute(restriction?: ResourceRestricted): Promise<ResultSet<T>> {
        const parameters = { ...this.baseParameters };
        if (restriction) {
            if (restriction.rowLimit !== undefined) {
                parameters["limit"] = restriction.rowLimit;
            }
            if (restriction.timeout !== undefined) {
                parameters["timelimit"] = restriction.timeout;
            }
        }
        const eqResult = await this.client.call<ExecuteQueryResult<T>>(
            "execute-query",
            parameters
        );
        return new ResultSet<T>(this.client, eqResult);
    }

    /**
     * Checks whether a view is valid for its specified language and namespace.
     * @throws {InvalidQueryException} if the query is invalid
     */
    async validate(): Promise<void> {
        await this.client.validateQuery(this);
    }
}


