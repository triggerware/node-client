import { Expose } from 'class-transformer';

export class TwRuntimeMeasure {
    @Expose({ name: 'runTime' })
    runTime!: number;

    @Expose({ name: 'gcTime' })
    gcTime!: number;

    @Expose({ name: 'bytes' })
    bytes!: number;
}
