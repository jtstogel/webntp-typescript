'use strict';

import { PeerClock } from "./peer-clock";

export class NTPClient {
    hosts: Array<string>;
    peerClocks: Array<PeerClock>;
    offsetUpdateIntervalHandler: NodeJS.Timeout;
    offset: number;
    jitter: number;

    constructor(hosts: Array<string>) {
        this.hosts = hosts;
        this.peerClocks = hosts.map(h => new PeerClock(h));
        this.offsetUpdateIntervalHandler = setInterval(this.offsetUpdate.bind(this), 963);
        const def = this.offsetUpdate();
        this.offset = def.offset;
        this.jitter = def.jitter;
    }

    private offsetUpdate(): { offset: number, jitter: number } {
        const sorted = [...this.peerClocks]
            .sort((a, b) => NTPClient.dist(a) - NTPClient.dist(b));

        let norm = 0, offset = 0, jitter = 0;
        for (const pc of sorted) {
            const p = pc.getState();
            const dist = NTPClient.dist(pc);
            norm += 1 / dist;
            offset += p.offset / dist;
            jitter += (p.offset - sorted[0].getState().offset) ** 2 / dist;
        }
        offset = offset / norm;
        jitter = Math.sqrt(jitter / norm);

        // filter
        this.offset = offset;
        this.jitter = jitter;
        console.log("Updated Offset", this.offset, "and jitter", this.jitter, "with max error", sorted[0].getState());

        return { offset, jitter }
    }

    private static dist(pc: PeerClock) {
        const p = pc.getState();
        return p.delay / 2 + p.dispersion;
    }

    public getTimeMillis(): number {
        return Date.now() + this.offset;
    }
}

export default NTPClient;
