import { Expose } from 'class-transformer';
import { SignatureElement } from './signature_element.mjs';

export class PreparedQueryRegistration {
    @Expose({ name: 'handle' })
    handle!: number;

    @Expose({ name: 'inputSignature' })
    inputSignature!: SignatureElement[];

    @Expose({ name: 'signature' })
    signature!: SignatureElement[];

    @Expose({ name: 'usesNamedParameters' })
    usesNamedParameters!: boolean;
}
