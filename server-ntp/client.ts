import SimpleDataChannel from "../simple-data-channel";
import NTPClient from "../ntp/client";
import WebSocket from "isomorphic-ws";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";

const ntpClient = new NTPClient(['localhost:8000']);
