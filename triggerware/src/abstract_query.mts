import { Query, TriggerwareObject, ResourceRestricted } from "./interfaces.mjs";
import { QueryRestriction } from "./query_restriction.mjs";
import { TriggerwareClient } from "./triggerware_client.mjs";

/**
 * Represents an abstract query in the Triggerware system.
 * @typeparam T The class that represents a single 'row' of the answer to the query.
 */
export abstract class AbstractQuery<T> implements TriggerwareObject, Query, ResourceRestricted {
    protected readonly baseParameters: Record<string, any>;

    public readonly query: string;
    public readonly language: string;
    public readonly schema: string;

    public readonly rowLimit?: number;
    public readonly timeout?: number;

    public readonly client: TriggerwareClient;
    /**
     * nameOfFunction
     */
    public nameOfFunction() {
    }

    protected _handle?: number;
    public get handle(): number | undefined {
        return this._handle;
    }

    /**
     * Constructor for the AbstractQuery class.
     * @param client A client connected to a Triggerware server to register this query on.
     * @param query An object containing a query string and language/namespace restriction.
     * @param restriction A QueryRestriction to control what is needed for this query.
     */
    constructor(client: TriggerwareClient, query: Query, restriction?: ResourceRestricted) {
        this.client = client;
        this.query = query.query;
        this.language = query.language;
        this.schema = query.schema;

        this.baseParameters = {
            query: query.query,
            language: query.language,
            namespace: query.schema,
        };

        if (restriction) {
            this.rowLimit = restriction.rowLimit;
            this.timeout = restriction.timeout;

            if (this.rowLimit !== undefined) {
                this.baseParameters["limit"] = this.rowLimit;
            }
            if (this.timeout !== undefined) {
                this.baseParameters["timelimit"] = this.timeout;
            }
        }
    }
}

/**
 * Base class for AbstractQuery exceptions.
 */
export class AbstractQueryException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AbstractQueryException";
    }
}

/**
 * Exception indicating that the query is invalid.
 */
export class InvalidQueryException extends AbstractQueryException {
    constructor(message: string) {
        super(message);
        this.name = "InvalidQueryException";
    }
}


