import { Expose } from 'class-transformer';

export class SubscriptionNotification<T> {
    @Expose({ name: 'update#' })
    updateNumber!: number;

    @Expose({ name: 'label' })
    label!: string;

    @Expose({ name: 'tuple' })
    tuple!: T;
}
