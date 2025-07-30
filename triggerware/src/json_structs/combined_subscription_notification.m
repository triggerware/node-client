import { Expose } from 'class-transformer';
import { SubscriptionMatch } from './subscription_match.mjs';

export class CombinedSubscriptionNotification {
    @Expose({ name: 'update#' })
    updateNumber!: number;

    @Expose({ name: 'matches' })
    matches!: SubscriptionMatch<object>[];
}
