import { Query } from "./interfaces.mjs";

/**
 * A raw FOL query.
 */
export class SqlQuery implements Query {
    /**
     * The query string written in FOL.
     */
    readonly query: string;

    /**
     * The language of the query, always "sql".
     */
    readonly language: string = "sql";

    /**
     * The schema namespace for the query. Defaults to "AP5".
     */
    readonly schema: string;

    constructor(query: string, schema: string = "AP5") {
        this.query = query;
        this.schema = schema;
    }
}
    

