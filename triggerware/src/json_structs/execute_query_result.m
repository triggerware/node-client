import { Expose, Type } from 'class-transformer';
import { Batch } from './batch.mjs';
import { SignatureElement } from './signature_element.mjs';

export class ExecuteQueryResult<T> {
    @Expose({ name: 'handle' })
    handle!: number | null;

    @Expose({ name: 'batch' })
    @Type(() => Batch)
    batch!: Batch<T>;

    @Expose({ name: 'signature' })
    signature!: SignatureElement[];
}
