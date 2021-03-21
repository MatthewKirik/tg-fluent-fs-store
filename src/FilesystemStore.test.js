const __path = require('path');

const FilesystemStore = require('./FilesystemStore');

const testBasePath = __dirname + '../../test/test-files';

const clear = async (path) => {
    try {
        await __fs.truncate(path, 0);
    } catch {}
}

(async () => {
    const store = await (new FilesystemStore(testBasePath));
    const object = { 
        string : "hello",
        number: 1, 
        tags: ['admin', 'service']
    };
    await store.save(23232323, object);
    const found = await store.findLast(23232323, {string:"hello"}, 3);
    console.log(found);
})()
.then(() => (async () => {
    const store = await (new FilesystemStore(testBasePath));
    const object = { 
        id : 12,
        string : "hello",
        number: 1, 
        tags: ['admin', 'service']
    };
    await store.save(23232323, object);
    const found = await store.getById(23232323, 12);
    console.log(found);
})())
.then(() => (async () => {
    const store = await (new FilesystemStore(testBasePath));
    const object = { 
        id : 22,
        string : "hello",
        number: 1, 
        tags: ['admin', 'service']
    };
    await store.save(23232323, object);
    await store.save(23232323, {...object, id: 1});
    await store.deleteById(23232323, 22);
    const found = await store.getById(23232323, 22);
    console.log(found);
})())
.then(() => (async () => {
    const store = await (new FilesystemStore(testBasePath));
    const chatId = '3232323';
    await clear(__path.join(testBasePath, chatId));
    for(let i = 0; i < 10; i++) {
        const object = { 
            id : i,
            string : "hello",
            number: 1, 
            tags: ['admin', 'service']
        };
        await store.save(chatId, object);
    }
    await store.save(chatId, { string: "hihi", number: 1 });
    await store.delete(chatId, { string : "hello" });
    const found = await store.findLast(chatId, { number : 1 });
    console.log(found);
})());
