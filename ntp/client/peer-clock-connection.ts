'use strict';

import events = require('events');
import WebSocket from "isomorphic-ws";
import SimpleDataChannel from "../../simple-data-channel";
import {Constants} from "../constants";
import Timing from "../timing";
import {ClientReq, ServerResp} from "../messages";

export class PeerClockConnection extends events.EventEmitter {
    host: string;
    sdc: SimpleDataChannel;
    ws: WebSocket;

    constructor(host: string) {
        super();
        this.host = host;
        this.ws = new WebSocket(`wss://${this.host}`);
        this.sdc = new SimpleDataChannel(this.ws);
        this.sdc.on('message', this.onMessage.bind(this));
    }

    public poll() {
        const req: ClientReq = {
            org: Timing.getTimeMillis()
        };
        this.sdc.send(JSON.stringify(req));
    }

    private onMessage(event: MessageEvent) {
        const dst = Timing.getTimeMillis();
        const resp: ServerResp = JSON.parse(event.data);

        const { org, rec, xmt, precision } = resp;

        // Compute and emit sample
        const rtt = dst - org;
        this.emit('sample', {
            offset: (rec - org) / 2 + (xmt - dst) / 2,
            delay: rtt - (xmt - rec),
            dispersion: Timing.systemPrecision() + precision + Constants.PHI * rtt,
            timeOfArrival: dst
        });
    }
}
