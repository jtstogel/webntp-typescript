import SimpleDataChannel from "../../simple-data-channel";
import Timing from "../timing";
import {ClientReq, ServerResp} from "../messages";
import WebSocket = require("isomorphic-ws");
import {SdcMessageEvent} from "../../simple-data-channel/simple-data-channel";


export class NTPServer {
    wss: WebSocket.Server;

    constructor(wss: WebSocket.Server) {
        this.wss = wss;
        wss.on('connection', this._onWebSocketConnection.bind(this));
    }

    async _onWebSocketConnection(ws: WebSocket) {
        const sdc = new SimpleDataChannel(ws, { isServer: true });

        sdc.on('message', function (event: SdcMessageEvent) {
            const time = Timing.getTimeMillis();
            const req: ClientReq = JSON.parse(event.data);
            const resp: ServerResp = {
                precision: Timing.systemPrecision(),
                org: req.org,
                rec: time,
                xmt: time,
            };
            sdc.send(JSON.stringify(resp));
        });
    }
}

export default NTPServer;
