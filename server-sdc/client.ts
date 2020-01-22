import SimpleDataChannel from "../simple-data-channel";
import WebSocket from "isomorphic-ws";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";

const ws = new WebSocket('ws://localhost:8000');
const sdc = new SimpleDataChannel(ws);

let idx = 0;

sdc.on('message', function (msg: SdcMessageEvent) {
    console.log(`received pong ${msg.data}!`);
});

sdc.on('open', () => {
    setInterval(() => {
        console.log(`Sending ping ${idx}...`);
        sdc.send((idx++).toString());
    }, 500);
});
