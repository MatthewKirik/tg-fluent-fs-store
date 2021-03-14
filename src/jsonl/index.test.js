const jsonl = require('./index');
const __path = require('path');
const __fs = require('fs').promises;
const __assert = require('assert').strict;

const testBasePath = __dirname + '../../../test/test-files';

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
        tags: ['admin', 'service']
    };
    await jsonl.write(path, object);
    const objects = jsonl.readFromEnd(path);
    const readObject = (await objects.next()).value;
    __assert.deepStrictEqual(object, readObject, 'Read/write single object');
})()
.then(() => {
    (async () => {
        const path = __path.join(testBasePath, 'jsonl-test.jsonl');
        await clear(path);
    
        const object = { 
            index : 0,
            string : "hello",
            number: 1, 
            tags: ['admin', 'service']
        };
        const arr = [];
        for (let i = 0; i < 10000; i++) {
            arr.push({ ...object, index: i});
        }
        await jsonl.write(path, ...arr);
        
        const readArr = [];
        for await(let obj of jsonl.readFromEnd(path)) {
            readArr.unshift(obj);
        }

        __assert.deepStrictEqual(arr, readArr, 'Read/write 10000 objects');
    })()
});