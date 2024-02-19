import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';

const CWD = resolve(`${(new URL('.', import.meta.url)).pathname}/..`);

export const io = {
    cwd: () => CWD,
    exists: async path => !!(await stat(path).catch(e => false)),
    content: async (path) => {  
        try {
            return await readFile(path, 'utf8');
        } catch (e) {
            log.notice(`file ${path} not found, ignoring...`);
            return '';
        }
    },
};