import express from "express";
import SimpleDataChannel from "../simple-data-channel";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";
import NTPServer from "../ntp/server";
import WebSocket from "isomorphic-ws";
// @ts-ignore
import browserify from "browserify-middleware";
import {join} from "path";

const app = express();
app.use('/index.html', express.static(join(__dirname, 'static', 'index.html')));
app.use('/client.js', browserify(join(__dirname, 'client.js')));

const httpPort = process.env.HTTP_PORT || 8080;
app.listen(httpPort, () => console.log(`Started on port ${httpPort}`));


const wssPort = 8000;
const wss = new WebSocket.Server({
    port: wssPort
});
const ntpServer = new NTPServer(wss);

