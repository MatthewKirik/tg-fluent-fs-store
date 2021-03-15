const FilesystemStore = require('./FilesystemStore');

const testBasePath = __dirname + '../../test/test-files';

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
})();