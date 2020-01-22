import SimpleDataChannel from "../simple-data-channel";
import NTPClient from "../ntp/client";
import WebSocket from "isomorphic-ws";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";



window.onload = () => {
    // @ts-ignore
    document.getElementById("button").onclick = () => {
        // @ts-ignore
        const hosts = document.getElementById("hosts").innerHTML.trim().split('\n').map(s => s.trim());
        console.log(hosts);
	const ntpClient = new NTPClient(hosts);
        const output = document.getElementById("output");
        setInterval(() => {
            // @ts-ignore
            output.innerHTML = `offset: ${ntpClient.offset}, jitter: ${ntpClient.jitter}`;
        }, 2500);
    }
};

