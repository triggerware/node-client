import { Expose } from 'class-transformer';
import { SignatureElement } from './signature_element.mjs';

export class PolledQueryRegistration {
    @Expose({ name: 'handle' })
    handle!: number;

    @Expose({ name: 'signature' })
    signature!: SignatureElement[];
}
