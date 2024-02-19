import { settings } from './settings.mjs'
import { state } from './state.mjs'
import { websocket } from './websocket.mjs'
import { utils } from './utils.mjs'
import { log } from './log.mjs'
import crypto from 'crypto';
import http from 'http';

export const httpServer = {
    start: () => {
        const httpServer = http.createServer();
        httpServer.on('request', (req, res) => {
            // This is a sample route, you can implement your routing logic here
            const url = new URL(`http://127.0.0.1${req.url}`);
            const sendRaw = url.pathname === '/raw';
            let id = crypto.randomUUID();
            if (sendRaw) {
                if (!url.searchParams.get('id')) {
                    log.error('raw msg needs id param');
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('id required');
                    return;
                }
                id = url.searchParams.get('id');
            }
            if ((url.pathname === '/wrapped' || sendRaw) && req.method == 'POST') {
                req.setEncoding('utf8');
                const rb = [];
                req.on('data', (chunks)=>{
                    rb.push(chunks);
                });
                req.on('end', async ()=>{
                    const payload = rb.join("");
                    
                    let useConnection = null;
                    let tries = 0;
                    while (!useConnection) {
                        state.threadIdx++;
                        state.threadIdx = state.wsConnections.length <= state.threadIdx ? 0 : state.threadIdx;
                        useConnection = state.wsConnections[state.threadIdx];
                        if (tries > state.wsConnections.length) {
                            break;
                        }
                        tries++;
                    }
                    if (!useConnection) {
                        log.error('working socket not found, reject');
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('no connection');
                        return;
                    }
                    const msg = sendRaw ? payload : utils.prepareWrapped(settings.wrapperPayload, id, payload);
                    log.report(msg)
                    useConnection.sendUTF(msg);
                    if (settings.ignoreResponse) {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('OK');
                        return;
                    }
                    await new Promise((resolve, reject) => {
                        websocket.waitUntilResponse(
                            id,
                            {resolve, reject, sendRaw}
                        );
                        state.wsTimeouts[id] = setTimeout(() => {
                            //kill websocket connection, not working
                            if (settings.disconnectOnTimeout) {
                                websocket.resetConnection(state.threadIdx);
                            }
                            reject('timeout');
                        }, settings.timeout * 1000);
                    }).then(msg => {
                        clearTimeout(state.wsTimeouts[id]);
                        res.writeHead(200, { 'Content-Type': 'text/plain', 'x-wsproxy-url': settings.url });
                        res.end(JSON.stringify(msg));
                    }).catch((e) => {
                        clearTimeout(state.wsTimeouts[id]);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        if (settings.disconnectOnTimeout) {
                            log.error(e)
                        } else {
                            log.notice(e)
                        }
                        res.end('no response');
                    });
                });
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('wsproxy');
            }
        });

        httpServer.listen(settings.port, () => {
            log.report(`running wsproxy on ${settings.port}\nwrapped: POST http://127.0.0.1:${settings.port}/wrapped\nraw:     POST http://127.0.0.1:${settings.port}/raw?id=x`);
        });
    }
}