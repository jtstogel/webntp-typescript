import express from "express";
import SimpleDataChannel from "../simple-data-channel";
import {SdcMessageEvent} from "../simple-data-channel/simple-data-channel";
import NTPServer from "../ntp/server";
import WebSocket from "isomorphic-ws";
// @ts-ignore
import browserify from "browserify-middleware";
import {join} from "path";
import https from "https";
import fs from "fs";

const app = express();
app.use('/index.html', express.static(join(__dirname, 'static', 'index.html')));
app.use('/client.js', browserify(join(__dirname, 'client.js')));

const sslPath = <string>process.env.SSL_PATH;
const httpsServer = https.createServer({
    key: fs.readFileSync(join(sslPath, 'privkey.pem')),
    cert: fs.readFileSync(join(sslPath, 'cert.pem'))
}, app);

const wss = new WebSocket.Server({
    server: httpsServer
});
const ntpServer = new NTPServer(wss);

const httpsPort = process.env.PORT || 8080;
httpsServer.listen(httpsPort, () => console.log(`Started on port ${httpsPort}`));
