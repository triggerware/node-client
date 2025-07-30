import { Expose } from 'class-transformer';

export class SubscriptionMatch<T> {
    @Expose({ name: 'label' })
    label!: string;

    @Expose({ name: 'tuples' })
    tuples!: T[];
}
