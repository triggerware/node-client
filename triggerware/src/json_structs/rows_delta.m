import { Expose } from 'class-transformer';

export class RowsDelta<T> {
    @Expose({ name: 'added' })
    added!: T[];

    @Expose({ name: 'deleted' })
    deleted!: T[];
}
