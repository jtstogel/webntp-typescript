'use strict';

import Timing from "../timing";
import {Constants} from "../constants";

export interface RawSample {
    offset: number;
    delay: number;
    dispersion: number;
    timeOfArrival: number;
}

export interface FilteredSample {
    offset: number;
    delay: number;
    dispersion: number;
    jitter: number;
    timeOfArrival: number;
}

const MAX_DISP = 16.0e3; // 16 seconds
export const INFTY_SAMPLE: RawSample = { offset: 0, delay: MAX_DISP, dispersion: MAX_DISP, timeOfArrival: 0 };
export const INFTY_FILTERED_SAMPLE: FilteredSample = { offset: 0, delay: MAX_DISP, dispersion: MAX_DISP, jitter: MAX_DISP, timeOfArrival: 0 };

export class ClockFilter {
    samples: Array<RawSample>;
    nStage: number;

    constructor(nStage: number = 8) {
        /* Initialize the sample list to default tuples */
        this.nStage = nStage;
        this.samples = ClockFilter.defaultList(nStage);
    }

    private static defaultList(nStage: number) {
        const samples = [];
        for (let i = 0; i < nStage; i++) {
            samples.push(INFTY_SAMPLE);
        }
        return samples;
    }

    private shift(sample: RawSample) {
        this.samples.push(sample);
        this.samples.shift();
    }

    public static currentDispersion(sample: RawSample, timeMillis: number): number {
        return sample.dispersion + Constants.PHI * (timeMillis - sample.timeOfArrival);
    }

    public accept(sample: RawSample): FilteredSample {
        this.shift(sample);

        const sorted = [...this.samples].sort((a, b) => a.delay - b.delay);

        const time = Timing.getTimeMillis();
        let dispersion = 0, jitter = 0;
        for (let i = 0; i < this.nStage; i++) {
            dispersion += ClockFilter.currentDispersion(sorted[i], time) / 2 ** (i + 1);
            jitter += (sorted[i].offset - sorted[0].offset) ** 2;
        }
        jitter = Math.max(Math.sqrt(jitter), Timing.systemPrecision());

        return {
            ...sorted[0],
            dispersion,
            jitter,
        };
    }
}

