import { Query } from "./interfaces.mjs";

/**
 * A raw FOL query.
 */
export class FolQuery implements Query {
    /**
     * The query string written in FOL.
     */
    readonly query: string;

    /**
     * The language of the query, always "fol".
     */
    readonly language: string = "fol";

    /**
     * The schema namespace for the query. Defaults to "AP5".
     */
    readonly schema: string;

    constructor(query: string, schema: string = "AP5") {
        this.query = query;
        this.schema = schema;
    }
}
