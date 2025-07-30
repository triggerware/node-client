import { ResourceRestricted } from "./interfaces.mjs";

/**
 * A resource restriction on queries executed on a Triggerware server.
 */
export class QueryRestriction implements ResourceRestricted {
    /**
     * A limit to how many rows the server can return at a time.
     */
    readonly rowLimit?: number;

    /**
     * A time limit for a query response.
     */
    readonly timeout?: number;

    constructor(rowLimit?: number, timeout?: number) {
        this.rowLimit = rowLimit;
        this.timeout = timeout;
    }
}


