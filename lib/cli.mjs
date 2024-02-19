import { log } from './log.mjs'
import { io } from './io.mjs'
import { settings } from './settings.mjs'
import { utils, die } from './utils.mjs'

export const cli = {
    show_help: () => {
        log.success('WSPROXY 0.1');
        log.docs(`
${log.infoHeader(`### general arguments`)}

${log.infoHighlight(`--url / -u <url>`)}                        url for upgrade-request
${log.infoHighlight(`--port / -p <port>`)}                      port to open webserver on
${log.infoHighlight(`--threads / -t <threads>`)}                threads to websocket
${log.infoHighlight(`--timeout / -T <timeout>`)}                timeout in seconds until proxy responds with "no response"
${log.infoHighlight(`--header-file / -H <headers-or-file>`)}
    either one per header or the path to a file with headers to make the upgrade-request work
    examples:
        ${log.infoHighlight(`-H 'x-api-key: foo' -H 'x-csrf-token: xxx'`)}
        ${log.infoHighlight(`-H headers.txt`)}
        
${log.infoHighlight(`--proto <wsproto>`)}                       websocket protocol to use, default none, if connection failure it will also try without
${log.infoHighlight(`--gql`)}                                   for apollo and others, proto will be 'graphql-ws'
${log.infoHighlight(`--init-payload <payload>`)}                message to send on connect
${log.infoHighlight(`--wrapper-payload <payload>`)}             message to use when using /wrapped, needs %w:id% and %w:payload%
    default is:
    ${log.infoHighlight(settings.wrapperPayload)}

${log.infoHighlight(`--response-id <param>`)}                   what param that contains the ID, used for /raw, default is "id"
${log.infoHighlight(`--response-match <match>`)}                regex to match the response you want. default is responding with first message
    example:
    ${log.infoHighlight(`--response-match '"type":"data"'`)} will respond when there's a message containing ${log.infoHighlight(`"type":"data"`)}

${log.infoHeader(`### special toggles`)}

${log.infoHighlight(`--disconnect-on-timeout`)}                 reconnect the socket if request timed out
${log.infoHighlight(`--ignore-response`)}                       don't wait for response but respond directly

${log.infoHeader(`### sending wrapped messages`)}

sending a POST to /wrapped will use the wrapper-payload to send a message and will generate UUIDs automatically for each message
example:

${log.infoHighlight(`POST /wrapped HTTP/1.1
Content-type: application/json

{"query":"hello"}`)}

will by default send a websocket message as:

${log.infoHighlight(`{"id":"un1qu3-id-foo-bar","type":"start","payload":{"query":"hello"}}`)}

you can customize the wrapper-template using --wrapper-payload and the placeholders ${log.infoHighlight(`%w:id`)} and ${log.infoHighlight(`%w:payload`)}.

${log.infoHeader(`### sending raw messages`)}

sending a POST to /raw?id=uniqueId requires your POST-payload also to contain the same ID for a message to be returned
example:

${log.infoHighlight(`POST /raw?id=123-unique HTTP/1.1
Content-type: application/json

{"id":"123-unique","payload":{"query":"hello"}}`)}

will send the message as is. if you don't provide the same ID in the query parameter as in the payload,
the response will always timeout even if the websocket is recieving responses.
`)
        process.exit(0);
    },
    argument_parse: async (args) => {
        const list = args;
        let invalidCommand = false, headerData = '';
        if (list.length <= 2) {
            cli.show_help();
        }
        while (list.length > 2) {
            switch (list[2]) {
                case '--test':
                    settings.runTests = true;
                break;
                case '--help': case '-h':
                    cli.show_help();
                break;
                case '--port': case '-p':
                    list.shift();
                    settings.port = parseInt(utils.argValueOrNull(list, 2), 10);
                break;
                case '--timeout': case '-T':
                    list.shift();
                    settings.timeout = parseInt(utils.argValueOrNull(list, 2), 10);
                break;
                case '--init-payload':
                    list.shift();
                    settings.initPayload = utils.argValueOrNull(list, 2);
                break;
                case '--wrapper-payload':
                    list.shift();
                    settings.wrapperPayload = utils.argValueOrNull(list, 2);
                break;
                case '--disconnect-on-timeout':
                    settings.disconnectOnTimeout = true;
                break;
                case '--ignore-response': case '-g':
                    settings.ignoreResponse = true;
                break;
                case '--response-match':
                    list.shift();
                    settings.responseMatch = utils.argValueOrNull(list, 2);
                break;
                case '--response-id':
                    list.shift();
                    settings.responseIdParam = utils.argValueOrNull(list, 2);
                break;
                case '--proto': case '-P':
                    list.shift();
                    settings.wsProto = utils.argValueOrNull(list, 2);
                break;
                case '--gql':
                    settings.wsProto = 'graphql-ws';
                break;
                case '--url': case '-u':
                    list.shift();
                    settings.url = utils.argValueOrNull(list, 2);
                break;
                case '--header-file': case '-H':
                    list.shift();
                    const val = utils.argValueOrNull(list, 2);
                    settings.headerFile = val;
                    headerData += val !== null ? (headerData.length ? `\n` : '' ) + `${val}` : '';
                break;
                case '--threads': case '-t':
                    list.shift();
                    settings.threads = parseInt(utils.argValueOrNull(list, 2), 10);
                break;
                default:
                    invalidCommand = true;
                break;
            }
            list.shift();
        }
        if (invalidCommand) {
            log.error('invalid command, -h for help');
            die();
        }
        if (!settings.runTests) {
            if (settings.threads < 0) log.die('invalid threads');
            if (settings.port < 0) log.die('invalid port');
            if (!settings.url.match(/^(http|ws)s?:\/\//)) {
                log.die('url (-u) not a valid url');
            }
            if (settings.headerFile) {
                if (headerData.indexOf(':') !== -1) {
                    // we have a bunch of headers, put in header-cache as is
                    settings.headers = headerData;
                } else if (!await io.exists(settings.headerFile)) {
                    log.die('header-file not found');
                }
            }
        }
    },
}