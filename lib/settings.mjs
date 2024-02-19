export const settings = {
    runTests: false,
    threads: 3,
    url: '',
    port: 8123,
    timeout: 6,
    initPayload: null,
    wrapperPayload: `{"id":%w:id%,"type":"start","payload":%w:payload%}`,
    responseMatch: null,
    responseIdParam: 'id',
    headerFile: null,
    headers: null,
    wsProto: 'graphql-ws',
};