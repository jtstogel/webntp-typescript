import SimpleDataChannel from "../simple-data-channel";
import NTPClient from "../ntp/client";
import WebSocket from "isomorphic-ws";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";

const ntpClient = new NTPClient([
    'ntp-0.webntp.org:6789',
    'ntp-1.webntp.org:6789',
]);
