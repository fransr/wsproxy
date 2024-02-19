import { log } from './lib/log.mjs'
import { cli } from './lib/cli.mjs'
import { websocket } from './lib/websocket.mjs'
import { httpServer } from './lib/http-server.mjs'

await cli.argument_parse(process.argv);

log.success('I AM WSPROXY');

await websocket.start();
httpServer.start();
