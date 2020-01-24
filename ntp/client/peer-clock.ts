'use strict';

import {ClockFilter, FilteredSample, INFTY_FILTERED_SAMPLE, RawSample} from "./clock-filter";
import {PeerClockConnection} from "./peer-clock-connection";
import {SelectionFilter} from "./selection-filter";
import events = require('events');

export interface PeerClockOptions {
    pollIntervalMilli: number;
}

export class PeerClock extends events.EventEmitter {
    host: string;
    options: PeerClockOptions;
    clockFilter: ClockFilter;
    pcc: PeerClockConnection;
    state: FilteredSample;
    pollIntervalHandler: NodeJS.Timeout;

    constructor(host: string, options?: PeerClockOptions) {
        super();
        this.host = host;
        this.options = {
            pollIntervalMilli: 812,
            ...options,
        };
        this.state = INFTY_FILTERED_SAMPLE;
        this.pcc = new PeerClockConnection(host);
        this.clockFilter = new ClockFilter();

        this.pcc.on('sample', this.onRawSample.bind(this));
        this.pollIntervalHandler = setInterval(() => this.pcc.poll(), this.options.pollIntervalMilli);
    }

    private onRawSample(sample: RawSample) {
        console.log("Sample:", sample);
        const filteredSample = this.clockFilter.accept(sample);
        if (SelectionFilter.isAcceptable(filteredSample)) {
            this.state = filteredSample;
        }
    }

    public getState(): FilteredSample {
        return this.state;
    }
}
