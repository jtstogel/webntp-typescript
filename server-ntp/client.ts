import SimpleDataChannel from "../simple-data-channel";
import NTPClient from "../ntp/client";
import WebSocket from "isomorphic-ws";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";
const fetch = require('node-fetch');


function getLocal(): Promise<string> {
  // @ts-ignore
  return fetch('http://localhost:8080/time').then(res => res.text());
}


window.onload = () => {
    // @ts-ignore
    document.getElementById("button").onclick = () => {
        // @ts-ignore
        const hosts = document.getElementById("hosts").innerHTML.trim().split('\n').map(s => s.trim());
        console.log(hosts);
	const ntpClient = new NTPClient(hosts);
        const output = document.getElementById("output");
        setInterval(async () => {
            const tot = parseInt(await getLocal()) - Date.now();
            // @ts-ignore
            output.innerHTML = `offset: ${ntpClient.offset}, jitter: ${ntpClient.jitter}, actualoffset: ${tot}`;
        }, 2500);
    }
};

