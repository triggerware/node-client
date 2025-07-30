import { Expose } from 'class-transformer';

export class Batch<T> {
    @Expose({ name: 'count' })
    count!: number;

    @Expose({ name: 'tuples' })
    rows!: T[];

    @Expose({ name: 'exhausted' })
    exhausted!: boolean;
}
