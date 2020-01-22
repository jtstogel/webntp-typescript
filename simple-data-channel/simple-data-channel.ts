'use strict';

import RTCSignaler from "./signaler";
import EventEmitter from "events";
const { RTCPeerConnection } = require('wrtc');
import WebSocket from 'isomorphic-ws';

export interface SdcMessageEvent {
    data: any
}

interface DataChannelOptions {
    maxRetransmits: number,
    ordered: boolean
}

interface PeerConnectionConfig {
    sdpSemantics: string,
    iceServers: Array<object>,
}

interface SimpleDataChannelOptions {
    dataChannelConfig?: DataChannelOptions,
    peerConnectionConfig?: PeerConnectionConfig,
    isServer?: boolean
}

const defaultClientOptions = {
    dataChannelConfig: {
        maxRetransmits: 0,
        ordered: false
    },
    peerConnectionConfig: {
        sdpSemantics: 'unified-plan',
        iceServers: [
            {urls: 'stun:stun.l.google.com:19302'}
        ],
    },
    isServer: false,
};

class SimpleDataChannel extends EventEmitter {
    ws: WebSocket;
    pc: RTCPeerConnection | null;
    signaler: RTCSignaler | null;
    dc: RTCDataChannel | null;
    options: SimpleDataChannelOptions;

    constructor(ws: WebSocket, options: SimpleDataChannelOptions = {}) {
        super();
        this.ws = ws;
        this.pc = null;
        this.signaler = null;
        this.dc = null;
        this.options = {
            ...defaultClientOptions,
            ...options
        };

        this._createPeerConnection();
    }

    _beforeOffer(pc: RTCPeerConnection): void {
        const channel = pc.createDataChannel('data-channel', this.options.dataChannelConfig);
        this._setupNewDataChannel(channel);
    }

    _beforeAnswer(pc: RTCPeerConnection): void {
        pc.ondatachannel = this._onDataChannel.bind(this);
    }

    _sdpUpdate(sdp: string): string {
        return sdp;
    }

    _iceCandidateFilter(candidate: RTCIceCandidate) {
        // TODO: determine a suitable filter and create an error if no suitable ice candidate matches the filter
        // const allowableTypes = ["host", "srflx", "prflx", "relay"];
        // candidate.protocol === "udp" && allowableTypes.includes(candidate.type)
        return true;
    }

    _onDataChannel(event: RTCDataChannelEvent) {
        this._setupNewDataChannel(event.channel);
    }

    _createPeerConnection() {
        this.pc = new RTCPeerConnection(this.options.peerConnectionConfig);

        this.signaler = new RTCSignaler(this.ws, this.pc, {
            beforeAnswer: this._beforeAnswer.bind(this),
            beforeOffer: this._beforeOffer.bind(this),
            sdpUpdate: this._sdpUpdate.bind(this),
            iceCandidateFilter: this._iceCandidateFilter.bind(this)
        });

        if (this.options.isServer) {
            this.signaler.initiateConnection();
        }
    }

    _setupNewDataChannel(channel: RTCDataChannel) {
        this.dc = channel;
        const eventsToRelay = ['open', 'close', 'message', 'error'];
        eventsToRelay.forEach(eventType => {
            channel.addEventListener(eventType, event => this.emit(eventType, event));
        });
    }

    send(data: string) {
        if (this.dc === null) {
            console.log('DC is null');
            return;
        }
        return this.dc.send(data);
    }
}

export default SimpleDataChannel;
