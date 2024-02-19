export function die(c = 1, s) {
    if(s != undefined) console.log(s);
    process.exit(c);
}

export const utils = {
    argValueOrNull: (val, idx) => {
        if (val && val[idx]) {
            return val[idx];
        }
        return null;
    },
    ensureHttp: (url) => {
        return url.replace(/^ws/, 'http');
    },
    ensureWs: (url) => {
        return url.replace(/^http/, 'ws');
    },
    getHeader: (name, headers) => {
        for (const key in headers) {
            if (key.toLowerCase() == name) {
                return headers[key];
            }
        }
        return null;
    },
    prepareWrapped: (wrapper, id, payload) => {
        return wrapper.replace(/%w:id%/g, JSON.stringify(`${id}`)).replace(/%w:payload%/g, payload);
    }
}