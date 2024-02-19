# wsproxy 0.1

### installation

```
git clone git@github.com:fransr/wsproxy.git .
npm install

echo "alias wsproxy='node $(pwd)/wsproxy.mjs'" >> ~/.bash_profile
source ~/.bash_profile
```

### general arguments

```
--url / -u <url>                        url for upgrade-request
--port / -p <port>                      port to open webserver on
--threads / -t <threads>                threads to websocket
--timeout / -T <timeout>                timeout in seconds until proxy responds with "no response"
--header-file / -H <headers-or-file>
    either one per header or the path to a file with headers to make the upgrade-request work
    examples:
        -H 'x-api-key: foo' -H 'x-csrf-token: xxx'
        -H headers.txt

--init-payload <payload>                message to send on connect
--wrapper-payload <payload>             message to use when using /wrapped, needs %w:id% and %w:payload%
    default is:
    {"id":%w:id%,"type":"start","payload":%w:payload%}

--response-id <param>                   what param that contains the ID, used for /raw, default is "id"
--response-match <match>                regex to match the response you want. default is responding with first message
    example:
    --response-match '"type":"data"' will respond when there's a message containing "type":"data"
```

### sending wrapped messages

sending a POST to `/wrapped` will use the wrapper-payload to send a message and will generate UUIDs automatically for each message
example:

```http
POST /wrapped HTTP/1.1
Content-type: application/json

{"query":"hello"}
```

will by default send a websocket message as:

```json
{"id":"un1qu3-id-foo-bar","type":"start","payload":{"query":"hello"}}
```

you can customize the wrapper-template using --wrapper-payload and the placeholders %w:id and %w:payload.

### sending raw messages

sending a POST to `/raw?id=uniqueId` requires your POST-payload also to contain the same ID for a message to be returned
example:

```http
POST /raw?id=123-unique HTTP/1.1
Content-type: application/json

{"id":"123-unique","payload":{"query":"hello"}}
```

will send the message as is. if you don't provide the same ID in the query parameter as in the payload,
the response will always timeout even if the websocket is recieving responses.

