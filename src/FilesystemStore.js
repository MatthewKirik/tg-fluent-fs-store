const __fs = require('fs').promises;
const __path = require('path');

class FilesystemStore {

    constructor(basePath, tags) {
        return (async () => {
            await this.setDirectory(basePath);

            return this;
        });
    }

    async setDirectory(basePath) {
        if(typeof basePath === 'string') this.basePath = basePath;
        else throw new Error('Base path should be a string.');

        let dataPath = __path.join(path, 'data');
        await __fs.mkdir(dataPath, {recursive: true});
    }

    _getPath(chatId) {
        return __path.join(this.basePath, chatId);
    }

    save(data) {

    }

    getById(chatId, messageId) {

    }

    findLast(chatId, filter, limit) {

    }

    update(chatId, messageId, tags, data) {

    }

    deleteById(chatId, messageId) {

    }

    deleteLast(chatId, filter, limit) {

    }
}