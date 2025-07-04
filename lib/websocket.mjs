import client from 'websocket';
import tunnel from 'tunnel';
import { settings } from './settings.mjs'
import { io } from './io.mjs'
import { log } from './log.mjs'
import { utils } from './utils.mjs'
import { state } from './state.mjs'
const { client: WebSocketClient } = client;

export const websocket = {
    initConnection: (wsclient, idx, wsProto) => {
        wsclient.on('connectFailed', async (error) => {
            log.action(`${idx} connection error: ${error.toString()}`);
            if (error.toString().indexOf('Expected a Sec-WebSocket-Protocol header') !== -1 && wsProto) {
                settings.wsProto = null;
                log.notice('trying without ws-proto...')
                await websocket.addConnection(idx);
            }
        });
        wsclient.on('connect', (connection) => {
            log.action_success(idx, 'connected client');
            state.wsConnections[idx] = connection;
            connection.on('error', (error) => {
                log.error(`${idx} connection error: ${error.toString()}`);
            });
            connection.on('close', async () => {
                log.action(`${idx} connection closed`);
                state.wsConnections[idx] = null;
                await websocket.addConnection(idx);
            });
            connection.on('message', (message) => {
                if (message.type === 'utf8') {
                    let data;
                    if (!settings.quiet) {
                        log.info(utils.compactLine(message.utf8Data));
                    }
                    try {
                        data = JSON.parse(message.utf8Data);
                    } catch (e) {
                        return;
                    }
                    let queueData, queueKey;
                    if (settings.matchResponse) {
                        for (const qKey in state.queue) {
                            if (message.utf8Data.match(qKey)) {
                                queueKey = qKey;
                                queueData = state.queue[qKey];
                            }
                        }
                    }
                    if (queueData && (!settings.responseMatch || message.utf8Data.match(settings.responseMatch))
                    ) {
                        const sendRaw = queueData.sendRaw;
                        state.queue[queueKey].resolve(sendRaw ? data : data.payload);
                        delete state.queue[queueKey];
                    }
                }
            });
            websocket.init(connection);
        });
    },
    init: (connection) => {
        if (connection.connected && settings.initPayload) {
            connection.sendUTF(settings.initPayload);
        }
    },
    start: async () => {
        state.queue = [];
        for (let i = 0; i < settings.threads; i++) {
            await websocket.addConnection(i);
        }
    },
    resetConnection: async (idx) => {
        state.wsConnections[idx] = null;
        await websocket.addConnection(idx);
    },
    addHeaders: async (headers) => {
        const headerData = (settings.headers ?
            settings.headers
            :
            (settings.headerFile ? await io.content(settings.headerFile) : '')
        ).split(`\n`);

        for (const header of headerData) {
            const data = header.split(':');
            const headerKey = data[0];
            if (!headerKey.length) continue;
            data.shift();
            const headerValue = data.join(':').trim(`\r`);
            if(
                !headerKey.trim().length ||
                headerKey.toLowerCase() == 'content-type' ||
                headerKey.toLowerCase() == 'accept-encoding' ||
                headerKey.toLowerCase() == 'content-length'
            ) {
                continue;
            }
            headers[headerKey] = headerValue;
        }
        return headers;
    },
    addConnection: async (idx) => {
        const headers = await websocket.addHeaders([]);
        let wsProto = !settings.wsProto ? null : settings.wsProto;
        let wsProtoList = wsProto;
        if (utils.getHeader('sec-websocket-protocol', headers)) {
            wsProto = utils.getHeader('sec-websocket-protocol', headers).split(/,/).map(e => e.trim());
            wsProtoList = wsProto.join(', ');
        }
        const wsclient = new WebSocketClient({
            tlsOptions: {checkServerIdentity: (e) => { return false }
        }});
        websocket.initConnection(wsclient, idx, wsProto);
        log.action(`${idx} connecting to socket using ${wsProtoList}`);
        const origin = utils.getHeader('origin', headers);
        let tunnelingAgent = null;
        const requestOptions = {};
        if (settings.proxy) {
            const proxyUrl = new URL(settings.proxy);
            const destUrl = new URL(settings.url);
            let tunnelFunc = tunnel.httpOverHttp;
            if (destUrl.protocol == 'https:') {
                tunnelFunc = tunnel.httpsOverHttp;
            }
            tunnelingAgent = tunnelFunc({
                proxy: {
                  host: proxyUrl.hostname,
                  port: proxyUrl.port || 8000,
                },
                rejectUnauthorized: false,
              });
              requestOptions.agent = tunnelingAgent;
        }
        wsclient.connect(
            utils.ensureWs(settings.url),
            wsProto,
            origin ? origin : utils.ensureHttp(settings.url),
            headers,
            requestOptions
        );
    },
    waitUntilResponse: (id, promise) => {
        state.queue[id] = promise;
    },
};