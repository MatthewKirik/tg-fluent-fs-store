const __fs = require('fs').promises;
const __path = require('path');
const _jsonl = require('./jsonl');

/**
 * @typedef {Object} TelegramMessagesFilter
 * 
* @property {Number} [unix_date] Date the message was sent in Unix Time format.
* @property {String} [sender_role] Message sender's role (i.e. "admin", "user", "bot").
* @property {Number} [sender_id] Message sender's id.
* @property {String[]} [tags] Tags attached to saved message. 
* Interpretation on this filter parameter is defined by the "tags_mode" filter parameter.
* @property {'all'|'any'|except} [mode] Defines the way filter parameters will be interpreted. 
* @property {'all'|'any'|except} [tags_mode] Defines the way filter tags will be interpreted. 
* Equals to the "mode" filter parameter if not set explicitly.
*/

/**
 * @typedef {Object} TelegramMessage
 * 
* @see https://core.telegram.org/bots/api#message 
*/

class FilesystemStore {

    constructor(basePath, tags) {
        return (async () => {
            await this.setDirectory(basePath);

            return this;
        })();
    }

    async setDirectory(basePath) {
        if(typeof basePath === 'string') this.basePath = basePath;
        else throw new Error('Base path should be a string.');

        let dataPath = __path.join(this.basePath, 'data');
        await __fs.mkdir(dataPath, {recursive: true});
    }

    _getPath(chatId) {
        return __path.join(this.basePath, chatId.toString());
    }

    /**
     * 
     * @param {TelegramMessageFilter} filter Filter to match message on.
     * @param {TelegramMessage} msg Message to examine.
     * @return {Boolean} True if message matches the filter, otherwise false.
     */
    _matchesFilter(filter, msg) {
        const matches = [];
        for (const key in filter) {
            if(key === 'tags') continue;
            if (Object.hasOwnProperty.call(filter, key)
                && Object.hasOwnProperty.call(msg, key)) {
                matches.push(filter[key] === msg[key]);
            }
        }
        if(!filter.mode) filter.mode = 'all';
        if(!!filter.tags) {
            if(!!filter.tags_mode) filter.tags_mode = filter.mode;
            if(filter.tags_mode == 'all') 
                matches.push(filter.tags.every(t => msg.tags.includes(t)));
            else if(filter.tags_mode == 'any') 
                matches.push(filter.tags.some(t => msg.tags.includes(t)));
            else if(filter.tags_mode == 'except') 
                matches.push(!filter.tags.some(t => msg.tags.includes(t)));
        }
        if(filter.mode == 'all') 
            return matches.every(m => m);
        else if(filter.mode == 'any') 
            return matches.some(m => m);
        else if(filter.mode == 'except') 
            return !matches.some(m => m);
    }

    async save(chatId, ...msgs) {
        await _jsonl.append(this._getPath(chatId), ...msgs);
    }

    async getById(chatId, messageId) {
        for await (let msg of _jsonl.readFromEnd(this._getPath(chatId))) {
            if (msg.id === messageId) return msg;
        }
        return null;
    }

    async findLast(chatId, filter, limit) {
        if(typeof limit !== 'undefined') {
            if(typeof limit !== 'number' || limit <= 0) 
                throw new Error('Limit should be positive number. Pass "undefined" for no limit.');
        }
        const matches = [];
        for await (let msg of _jsonl.readFromEnd(this._getPath(chatId))) {
            if (this._matchesFilter(filter, msg)) 
                matches.push(msg);
            if(limit != undefined && matches.length >= limit) break;
        }
        return matches;
    }

    update(chatId, messageId, tags, data) {

    }

    deleteById(chatId, messageId) {

    }

    deleteLast(chatId, filter, limit) {

    }
}

module.exports = FilesystemStore;