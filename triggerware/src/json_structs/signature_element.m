import { Expose } from 'class-transformer';

export class SignatureElement {
    @Expose({ name: 'attribute' })
    name!: string;

    @Expose({ name: 'type' })
    typeName!: string;
}
