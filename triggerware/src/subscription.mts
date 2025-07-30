import { TriggerwareClient, TriggerwareClientException } from './triggerware_client.mjs';
import { BatchSubscription } from './batch_subscription.mjs';
import { Query } from './interfaces.mjs';
import { AbstractQuery } from './abstract_query.mjs';

/**
* A `Subscription` represents some future change to the data managed by the TW server about which
* a client would like to be notified. Once created, this subscription will accept notifications from
* the server when a change occurs, then call the overridden method handleNotification.
*
* By default, subscriptions are **active** when they are created—they are immediately registered
* with the server and start receiving notifications. This behavior may be changed upon construction,
* or by calling either the activate or deactivate methods. 
*
* Subscriptions may either be created by passing in a TriggerwareClient, in which case they
* are immediately registered with the server, OR by passing in a BatchSubscription. See
* BatchSubscription documentation for more information.
*
* @typeparam T - The expected type of one data tuple.
*/
export abstract class Subscription<T> extends AbstractQuery<T> {
    private _label: string = "";
    public get label(): string {
        return this._label;
    }

    private _batch?: BatchSubscription;
    public get batch(): BatchSubscription | undefined {
        return this._batch;
    }

    private _active: boolean = false;
    public get active(): boolean {
        return this._active;
    }

    constructor(
        clientOrBatch: TriggerwareClient | BatchSubscription,
        query: Query,
        active: boolean = true
    ) {
        let client = clientOrBatch instanceof TriggerwareClient ?
            clientOrBatch : clientOrBatch.client;
        super(client, query);

        this._label = this.client.registerSubscription(this);
        this.baseParameters["label"] = this._label;

        if (clientOrBatch instanceof TriggerwareClient) {
            if (active) this.activate();
        } else {
            this.addToBatch(clientOrBatch);
        }
    }


    /**
    * Activates the subscription, enabling notifications to be sent from the server. Subscriptions
    * that are apart of a batch cannot be deactivated or activated individually.
    * @throws SubscriptionException - If the subscription is apart of a batch.
    */
    public async activate(): Promise<void> {
        if (this._batch)
            throw new SubscriptionException (
                "Cannot activate a subscription which is apart of a batch.")

        if (this._active)
            throw new SubscriptionException("Subscription is already active.");

        const params: Record<string, any> = {
            ...this.baseParameters,
            method: this._label,
            combine: false
        }
        await this.client.call("subscribe", params);
        this.client.addMethod(this._label, (data: any) => this.handleNotification(data.tuple));
        this._active = true;
    }


    /**
    * Deactivates the subscription, disabling future notifications to be sent from the server.
    * Subscriptions that are apart of a batch cannot be deactivated or activated individually.
    * @throws SubscriptionException - If the subscription is apart of a batch.
    */
    public async deactivate(): Promise<void> {
        if (this._batch)
            throw new SubscriptionException(
                "Cannot deactivate a subscription which is apart of a batch.")

        if (!this._active)
            throw new SubscriptionException("Subscription is already not active.");

        const params: Record<string, any> = {
            ...this.baseParameters,
            method: this._label,
            combine: false
        }

        await this.client.call("unsubscribe", params);
        this.client.removeMethod(this._label);
        this._active = false;
    }

    /**
    * Adds this subscription to a specified batch. Alternatively you can use the batch's
    * addSubscription method.
    * @param batch The batch to add this subscription to.
    * @throws SubscriptionException - if this subscription is apart of another batch or is active.
    */
    public async addToBatch(batch: BatchSubscription) {
        if (this._batch)
            throw new SubscriptionException("Subscription is already apart of a batch.");
        if (this.active)
            throw new SubscriptionException("Cannot add an active subscription to a batch.");
        if (this.client != batch.client)
            throw new SubscriptionException("BatchSubscription must be from the same client.");

        const params: Record<string, any> = {
            ...this.baseParameters,
            method: batch.methodName,
            combine: true
        }
        await this.client.call("subscribe", params);
        batch.registerSubscription(this)
        this._batch = batch;
    }

    /**
    * Removes this subscription from the batch it is part of. Alternatively you can use the batch's
    * removeSubscription method.
    * @throws SubscriptionException - If the subscription is not apart of a batch.
    */
    public removeFromBatch() {
        if (!this._batch)
            throw new SubscriptionException("Subscription is not part of a batch.");

        const params: Record<string, any> = {
            ...this.baseParameters,
            method: this._batch.methodName,
            combine: true
        }
        this.client.call("unsubscribe", params);
        this._batch.unregisterSubscription(this);
        this._batch = undefined;
    }

    /**
    * Overload this function in an inheriting class to handle notifications that triggering the
    * query will cause this function to activate.
    */
    public abstract handleNotification(data: T): void;

    /** @internal */
    public handleNotificationFromBatch(data: T[]) {
        data.forEach(d => this.handleNotification(d));
    }
}


export class SubscriptionException extends TriggerwareClientException {
}
