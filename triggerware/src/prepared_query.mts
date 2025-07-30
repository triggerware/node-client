import { AbstractQuery } from "./abstract_query.mjs";
import { typeMap } from "./helpers.mjs";
import { Query, ResourceRestricted } from "./interfaces.mjs";
import { ExecuteQueryResult, PreparedQueryRegistration } from "./json_types.mjs";
import { QueryRestriction } from "./query_restriction.mjs";
import { ResultSet } from "./result_set.mjs";
import { TriggerwareClient } from "./triggerware_client.mjs";

export class PreparedQuery<T> extends AbstractQuery<T> {
    private registered: Promise<void>;
    protected preparedParameters: any[] = [];
    private _inputSignatureNames: string[] = [];
    private _inputSignatureTypes: string[] = [];
    private _usesNamedParameters: boolean = false;

    public get inputSignatureNames(): string[] {
        return [...this._inputSignatureNames];
    }

    public get inputSignatureTypes(): string[][] {
        return [...(this._inputSignatureTypes.map(x => [...x]))];
    }

    constructor(client: TriggerwareClient, query: Query, restriction?: QueryRestriction) {
        super(client, query, restriction);

        this.registered = this.register();
    }

    private async register(): Promise<void> {
        let registration: PreparedQueryRegistration;
        registration = await this.client.call("prepare-query", this.baseParameters);
        this._inputSignatureNames = registration.inputSignature.map((param) => param.attribute);
        this._inputSignatureTypes = registration.inputSignature.map((param) => param.type);
        this._usesNamedParameters = registration.usesNamedParameters;
        this._handle = registration.handle;
    }

    /**
    * Sets an unbound value in the query string to a specific value
    * @param position an index if the query uses positional parameters, or a string if the query
    * uses named parameters
    * @param param the value to set the parameter to
    * @throws {PreparedQueryException} if the query uses the wrong type of parameters
    */
    public async setParameter(position: string | number, param: any) {
        await this.registered;
        if (!this._usesNamedParameters && typeof position === "string")
            throw new PreparedQueryException("This query uses positional parameters.")

        if (this._usesNamedParameters && typeof position === "number")
            throw new PreparedQueryException("This query uses named parameters.")

        let index = typeof position === "string" ?
            this._inputSignatureNames.indexOf(position) : position;

        if (index < 0 || index >= this._inputSignatureNames.length)
            throw new PreparedQueryException("Invalid parameter name or position.");

        if (this.language == "sql" && !typeMap[this._inputSignatureTypes[index]](param))
            throw new PreparedQueryException(
                `expected type ${this._inputSignatureTypes[index]}, got ${typeof param}`
            );

        this.preparedParameters[index] = param;
    }

    /**
    * Gets the value of a parameter in the query string
    * @param position an index if the query uses positional parameters, or a string if the query
    * uses named parameters
    * @returns the value of the parameter
    * @throws {PreparedQueryException} if the query uses the wrong type of parameters
    */
    public async getParameter(position: string | number): Promise<any> {
        if (!this._usesNamedParameters && typeof position === "string")
            throw new PreparedQueryException("This query uses positional parameters.")

        if (this._usesNamedParameters && typeof position === "number")
            throw new PreparedQueryException("This query uses named parameters.")

        let index = typeof position === "string" ?
            this._inputSignatureNames.indexOf(position) : position;

        if (index < 0 || index >= this._inputSignatureNames.length)
            throw new PreparedQueryException("Invalid parameter name or position.");

        return this.preparedParameters[index];
    }

    /**
     * Clones this prepared query with the same parameters.
     * @returns A new PreparedQuery instance.
     */
    public clone(): PreparedQuery<T> {
        let clone = new PreparedQuery<T>(this.client, this, this) 
        clone.preparedParameters = [...this.preparedParameters];
        return clone;
    }

    /**
     * Executes this query on the connected Triggerware server.
     * @param restriction An optional QueryRestriction to control execution limits.
     * @returns A ResultSet<T> that stores the rows provided by the server.
     */
    async execute(restriction?: ResourceRestricted): Promise<ResultSet<T>> {
        const parameters: Record<string, any> = {
            handle: this._handle,
            inputs: this.preparedParameters
        };
        if (restriction) {
            if (restriction.rowLimit !== undefined) {
                parameters["limit"] = restriction.rowLimit;
            }
            if (restriction.timeout !== undefined) {
                parameters["timelimit"] = restriction.timeout;
            }
        }
        const eqResult = await this.client.call<ExecuteQueryResult<T>>(
            "create-resultset",
            parameters
        );
        return new ResultSet<T>(this.client, eqResult);
    }
}

class PreparedQueryException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreparedQueryException";
    }
}
