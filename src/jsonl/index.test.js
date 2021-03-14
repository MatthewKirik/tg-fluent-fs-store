const jsonl = require('./index');
const __path = require('path');
const __fs = require('fs').promises;

const testBasePath = '../../test/test-files';

const clear = async (path) => {
    try {
        await __fs.truncate(path, 0);
    } catch {}
}

(async () => {
    const path = __path.join(testBasePath, 'jsonl-test.jsonl');
    await clear(path);

    const object = { 
        string : "hello",
        number: 1, 
        date: new Date()
    };
    await jsonl.write(path, object);
})().then(() => {
    (async () => {
        const path = __path.join(testBasePath, 'jsonl-test.jsonl');
        await clear(path);
    
        const object = { 
            string : "hello",
            number: 1, 
            date: new Date()
        };
        await jsonl.write(path, object, object, object);
    })()
});