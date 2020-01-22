'use strict';

import WebSocket from "isomorphic-ws";
// @ts-ignore
import {RTCPeerConnection, RTCSessionDescription} from "wrtc";

interface CommonSignalerOptions {
    sdpUpdate: (sdp: string) => string,
    iceCandidateFilter: (candidate: RTCIceCandidate) => boolean
}

interface ClientSignalerOptions extends CommonSignalerOptions {
    beforeAnswer: (pc: RTCPeerConnection) => RTCPeerConnection
}

interface ServerSignalerOptions extends CommonSignalerOptions {
    beforeOffer: (pc: RTCPeerConnection) => RTCPeerConnection
}

interface IceCandidateMessage {
    candidate: RTCIceCandidate
}

interface OfferMessage {
    offer: any
}

interface AnswerMessage {
    answer: any
}

interface SignalingMessage {
    type: string,
    body: IceCandidateMessage | OfferMessage | AnswerMessage
}

class RTCSignaler {
    ws: WebSocket;
    options: ServerSignalerOptions | ClientSignalerOptions;
    pc: RTCPeerConnection;

    /**
     * Creates a new `RTCSignaler`.
     * @param {WebSocket} ws The web socket with which to negotiate the RTC connection
     * @param {RTCPeerConnection} pc The newly instantiated peer connection object to set up
     * @param {ServerSignalerOptions | ClientSignalerOptions} options
     */
    constructor(ws: WebSocket, pc: RTCPeerConnection, options: ServerSignalerOptions | ClientSignalerOptions) {
        this.ws = ws;
        this.pc = pc;
        this.options = {
            beforeAnswer(pc) {},
            beforeOffer(pc) {},
            sdpUpdate(sdp) { return sdp },
            iceCandidateFilter(candidate) { return true },
            ...options
        };

        this.ws.onmessage = this.onSignalingMessage.bind(this);
        this.attachIceListeners(pc);
    }

    /**
     * Handles incoming signaling messages and dispatches the data to the correct handler
     */
    async onSignalingMessage(event: WebSocket.MessageEvent) {
        const { type, body } = JSON.parse(event.data.toString());
        console.log(type, body);
        if (type === 'icecandidate') {
            this.onRemoteIceCandidate(body);
        } else if (type === 'offer') {
            this.acceptOffer(body)
        } else if (type === 'answer') {
            this.acceptAnswer(body);
        }
    }

    /**
     * Send a message via the signaler connection.
     */
    sendToRemote(msg: SignalingMessage) {
        return this.ws.send(JSON.stringify(msg));
    }

    /**
     * Initiates the wrtc protocol by sending an offer to the client. To be run by the connection initiator.
     */
    async sendOffer(): Promise<void> {
        const { beforeOffer } = <ServerSignalerOptions>this.options;
        beforeOffer(this.pc);
        const originalOffer = await this.pc.createOffer();
        const offer = this.updateRtcDescription(originalOffer);
        await this.pc.setLocalDescription(offer);
        await this.sendToRemote({ type: 'offer', body: { offer } });
    }

    /**
     * Accepts the offer and response with an answer. To be run by the connection receiver.
     */
    async acceptOffer(msg: OfferMessage): Promise<void> {
        await this.pc.setRemoteDescription(msg.offer);

        const { beforeAnswer } = <ClientSignalerOptions>this.options;
        beforeAnswer(this.pc);

        const originalAnswer = await this.pc.createAnswer();
        const answer = this.updateRtcDescription(originalAnswer);
        await this.pc.setLocalDescription(answer);

        await this.sendToRemote({ type: 'answer', body: { answer } });
    }

    /**
     * Accepts the answer. To be run by the connection initiator.
     */
    async acceptAnswer(msg: AnswerMessage): Promise<void> {
        await this.pc.setRemoteDescription(msg.answer);
    }

    /**
     * Initiates the connection by sending an offer. The caller is defined to be the connection initiator.
     */
    initiateConnection(): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.sendOffer();
        } else {
            this.ws.onopen = () => this.sendOffer();
        }
    }

    /**
     * Uses the `sdpUpdate` function provided in `options` to generate a modified `RTCSessionDescription`.
     */
    updateRtcDescription(rtcDesc: RTCSessionDescription): RTCSessionDescription {
        const { sdpUpdate } = this.options;
        return new RTCSessionDescription({
            type: rtcDesc.type,
            sdp: sdpUpdate(rtcDesc.sdp)
        });
    }

    attachIceListeners(pc: RTCPeerConnection): void {
        pc.onicecandidate = this.onLocalIceCandidate.bind(this);
    }

    onLocalIceCandidate(event: RTCPeerConnectionIceEvent): void {
        if (event.candidate !== null) {
            this.sendToRemote({ type: 'icecandidate', body: { candidate: event.candidate }});
        }
    }

    onRemoteIceCandidate(msg: IceCandidateMessage): void {
        const { iceCandidateFilter } = this.options;
        if (iceCandidateFilter(msg.candidate)) {
            return this.pc.addIceCandidate(msg.candidate);
        }
    }
}

export default RTCSignaler;
