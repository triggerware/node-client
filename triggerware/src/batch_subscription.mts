import { TriggerwareObject } from "./interfaces.mjs";
import { CombinedSubscriptionNotification } from "./json_types.mjs";
import { Subscription, SubscriptionException } from "./subscription.mjs";
import { TriggerwareClient, TriggerwareClientException } from "./triggerware_client.mjs";

/**
* A BatchSubscription groups one or more Subscription instances. Over time, new instances
* may be added to the BatchSubscription, and/or existing members may be removed. This is useful
* because a single transaction of a change in data on the triggerware server may be associated withr
* multiple subscriptions.
*
* By grouping these subscriptions, notifications may be properly handled by as many Subscription
* instances as necessary.
*/
export class BatchSubscription implements TriggerwareObject {
    public readonly client: TriggerwareClient;
    public readonly handle?: number | undefined;

    private _subscriptions: Map<string, Subscription<any>> = new Map();

    private _methodName: string;
    public get methodName(): string {
        return this._methodName;
    }

    constructor(client: TriggerwareClient) {
        this.client = client;
        this._methodName = client.registerBatchSubscription(this);
        this.client.addMethod(this._methodName, this.HandleNotification);
    }

    /** 
    * Adds the specified subscription to this batch. Alternatively you can use the subscription's
    * addToBatch method.
    * @param subscription The subscription to add to this batch.
    * @throws SubscriptionException If the subscription is already apart of a batch or is
    * already active.
    */
    public addSubscription<T>(subscription: Subscription<T>) {
        subscription.addToBatch(this);
    }

    /** 
    * Removes a subscription from this batch. Alternatively you can use the subscription's
    * removeFromBatch method.
    * @param subscription The subscription to remove.
    * @throws SubscriptionException If the subscription is not apart of this batch.
    */
    public removeSubscription<T>(subscription: Subscription<T>) {
        if (subscription.batch !== this)
            throw new SubscriptionException("Subscription is not apart of this batch.");
        subscription.removeFromBatch();
    }

    /** @internal */
    public registerSubscription<T>(subscription: Subscription<T>) {
        this._subscriptions.set(subscription.label, subscription);
    }

    /** @internal */
    public unregisterSubscription(subscription: Subscription<any>) {
        this._subscriptions.delete(subscription.label);
    }

    /** @internal */
    public HandleNotification(notification: CombinedSubscriptionNotification) {
        notification.matches.forEach(match => {
            let subscription = this._subscriptions.get(match.label);
            if (subscription) subscription.handleNotificationFromBatch(match.tuples);
        })
    }
}
