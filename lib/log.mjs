import { die } from './utils.mjs'
import { io } from './io.mjs'
import { settings } from './settings.mjs'

export const log = {
    report: (s = '') => {
        console.log(`\x1b[36m${s}\x1b[0m`);
    },
    interesting: (s = '') => {
        console.log(`\x1b[35m??? ${s}\x1b[0m`);
    },
    action: (s = '') => {
        console.error(`\x1b[32m*** ${s}\x1b[0m`);
    },
    success: (s = '') => {
        console.error(`\x1b[33m${s}\x1b[0m`);
    },
    notice: (s = '') => {
        console.error(`\x1b[32m... ${s}\x1b[0m`);
    },
    notice_attr: (s = '', p = '') => {
        console.error(`\x1b[32m... ${s}\x1b[0m`, `\x1b[36m${p}\x1b[0m`);
    },
    info_attr: (s = '', p = '') => {
        console.error(`\x1b[32m... ${s}\x1b[0m`, `\x1b[37m${p}\x1b[0m`);
    },
    raw: (s = '') => {
        console.log(s);
    },
    info: (s = '') => {
        console.log(`\x1b[37m${s}\x1b[0m`);
    },
    query: (s = '') => {
        console.log(`\x1b[36m${s}\x1b[0m`);
    },
    docs: (s = '') => {
        console.log(`\x1b[37m${s}\x1b[0m`);
    },
    infoHighlight: (s = '') => {
        return `\x1b[37m${s}\x1b[0m`;
    },
    infoBlockInfo: (s = '') => {
        return `\x1b[33m${s}\x1b[0m`;
    },
    infoHeader: (s = '') => {
        return `\x1b[37m\x1b[1m${s}\x1b[0m\x1b[0m`;
    },
    attr: (s = '', p = '') => {
        console.log(`\x1b[32m*** ${s}\x1b[0m`, `\x1b[36m${p}\x1b[0m`);
    },
    action_attr: (s = '', p = '') => {
        console.log(`\x1b[32m*** ${s}\x1b[0m`, `${p}`);
    },
    action_success: (s = '', p = '') => {
        console.log(`\x1b[32m*** ${s}\x1b[0m`, `\x1b[33m${p}\x1b[0m`);
    },
    action_error: (s = '', p = '') => {
        console.log(`\x1b[32m*** ${s}\x1b[0m`, `\x1b[31m${p}\x1b[0m`);
    },
    error: (s = '') => {
        console.log(`\x1b[31m!!! ${s}\x1b[0m`);
    },
    alert: (s = '') => {
        console.log(`\x1b[31m### ${s}\x1b[0m`);
    },
    die: (s) => {
        log.error(s);
        die()
    },
    file: (s) => {
        if (settings.runTests) return;
        io.logFile().write(s.length ? `### ${new Date(Date.now() + (-1*new Date().getTimezoneOffset()*60000)).toISOString().substr(2, 17)} ### ${s}\n` : "\n");
    },
}