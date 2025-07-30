import { AbstractQuery } from "./abstract_query.mjs";
import { Query, ResourceRestricted } from "./interfaces.mjs";
import { PolledQueryControlParameters, PolledQueryRegistration, PolledQuerySchedule, RowsDelta } from "./json_types.mjs";
import { TriggerwareClient } from "./triggerware_client.mjs";

/**
* A `PolledQuery` is a query that is executed by the TW server on a set schedule. 
* As soon as a `PolledQuery` is created, it is executed by the server, and the response (a set of
* "rows") establishes a "current state" of the query. For each succeeding execution (referred to as
* *polling* the query):
*
* - The new answer is compared with the current state, and the differences are sent to the
*   Triggerware client in a notification containing a `RowsDelta<T>` value.
* - The new answer then becomes the current state to be used for comparison with the result of the
*   next poll of the query.
*
* Like any other query, a `PolledQuery` has a query string, a language (FOL or SQL), and a namespace.
*
* A polling operation may be performed at any time by executing the Poll method.
* Some details of reporting and polling can be configured with a PolledQueryControlParameters
* value that is supplied to the constructor of a `PolledQuery`.
*
* An instantiable subclass of `PolledQuery` must provide a HandleNotification method to
* handle notifications of changes to the current state. Errors can occur during a polling operation
* (e.g., timeout, inability to contact a data source). When such an error occurs, the TW Server will
* send an "error" notification. An instantiable subclass of `PolledQuery` may provide a
* HandleError method to handle error notifications.
*
* Polling may be terminated when Dispose is called.
*
* If a polling operation is ready to start (whether due to its schedule or an explicit poll request)
* and a previous poll of the query has not completed, the poll operation that is ready to start is
* skipped, and an error notification is sent to the client.
* @typeparam T The type of data returned by the query.
* @extends AbstractQuery<T>
*/
export abstract class PolledQuery<T> extends AbstractQuery<T> {
    private _methodName: string = "";
    private _registered: Promise<void>;

    public get methodName(): string {
        return this._methodName;
    }

    constructor(
        client: TriggerwareClient,
        query: Query,
        restriction?: ResourceRestricted,
        controls?: PolledQueryControlParameters,
        schedule?: PolledQuerySchedule
    ) {
        super(client, query, restriction);
        this._methodName = client.registerPolledQuery(this);
        this.baseParameters["method"] = this._methodName;
        if (schedule) {
            validateSchedule(schedule);
            this.baseParameters["schedule"] = schedule;
        }
        if (controls) {
            this.baseParameters["report-initial"] = controls.reportInitial;
            this.baseParameters["report-unchanged"] = controls.reportUnchanged;
            this.baseParameters["delay"] = controls.delay;
        }
        this._registered = this.register();
    }

    private async register(): Promise<void> {
        let registration = await this.client.call<PolledQueryRegistration>(
            "create-polled-query",
            this.baseParameters
        );

        this._handle = registration.handle;
        this.client.addMethod(this._methodName, this.handleNotification);
    }

    /**
    * Perform an on-demand poll of this query (temporarily disregarding the set schedule).
    */
    public async poll() {
        await this._registered;
        var parameters: Record<string, any> = { handle: this._handle };
        if (this.timeout) parameters["timeout"] = this.timeout;
        await this.client.call("poll-now", parameters);
    }

    /**
    * Override this method to handle the polled query's changes in data. The polled query's
    * schedule determines when this method will be called.
    * @param delta The changes in the polled query's data - any added or deleted rows are included.
    */
    public abstract handleNotification(delta: RowsDelta<T>): void
}

const timezoneRegex = /^[A-Za-z]+(?:_[A-Za-z]+)*(?:\/[A-Za-z]+(?:_[A-Za-z]+)*)*$/;
const validateSchedule = (schedule: PolledQuerySchedule) => {
    if (typeof schedule === 'number') return;
    
    if (Array.isArray(schedule)) {
        schedule.forEach(validateSchedule);
        return;
    }
    if (schedule.minutes) validateTime("Minutes", schedule.minutes, 0, 59);
    if (schedule.hours) validateTime("Hours", schedule.hours, 0, 23);
    if (schedule.days) validateTime("Days", schedule.days, 1, 31);
    if (schedule.months) validateTime("Months", schedule.months, 1, 12);
    if (schedule.weekdays) validateTime("Weekdays", schedule.weekdays, 0, 6);
    if (schedule.timezone && !timezoneRegex.test(schedule.timezone))
        throw new PreparedQueryException("Invalid timezone format.");
}

const validateTime = (unit: string, value: string, min: number, max: number) => {
    if (value == "*") return;
    var parts = value.split(",").flatMap(x => x.split("-"));
    parts.forEach(p => {
        let parsed = parseInt(p);
        if (isNaN(parsed)) throw new PreparedQueryException("Invalid number in time unit.");
        if (parsed < min || parsed > max)
            throw new PreparedQueryException(`${unit} must be between ${min} and ${max}.`);
    });
}

export class PreparedQueryException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PreparedQueryException";
    }
}


