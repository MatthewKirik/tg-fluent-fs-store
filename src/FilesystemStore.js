'use strict';

const fs = require('fs').promises;
const { join } = require('path');
const jsonl = require('./jsonl.js');
const { writeStrings, readStrings } = require('./strings.js');

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

const filterPredicates = {
    all: (collection, lambda) => collection.every(lambda),
    any: (collection, lambda) => collection.some(lambda),
    except: (collection, lambda) => !collection.some(lambda),
};

const DEFAULTS = {
    HISTORY_LIMIT: 10,
};
class FilesystemStore {
    constructor(basePath, params = {}) {
        if (typeof params === 'object') {
            params.historyLimit = params.historyLimit || DEFAULTS.HISTORY_LIMIT;
            this.params = params;
        }
        return this.initialize(basePath);
    }

    async initialize(basePath) {
        await this.setDirectory(basePath);
    }

    async setDirectory(basePath) {
        if (typeof basePath === 'string') this.basePath = basePath;
        else throw new Error('Base path should be a string.');

        this.dataPath = join(this.basePath, 'data');
        await fs.mkdir(this.dataPath, { recursive: true });

        this.historyPath = join(this.basePath, 'history');
        await fs.mkdir(this.historyPath, { recursive: true });
    }

    _getMessagesPath(chatId) {
        return join(this.dataPath, chatId.toString());
    }

    _getHistoryPath(chatId) {
        return join(this.historyPath, chatId.toString());
    }

    /**
     *
     * @param {TelegramMessageFilter} filter Filter to match message on.
     * @param {TelegramMessage} msg Message to examine.
     * @return {Boolean} True if message matches the filter, otherwise false.
     */
    _matchesFilter(filter, msg) {
        const matches = [];
        for (const key of Object.keys(filter)) {
            if (key === 'tags') continue;
            const isKeyInMessage = Object.hasOwnProperty.call(msg, key);
            const isKeyInFilter = Object.hasOwnProperty.call(filter, key);
            if (isKeyInMessage && isKeyInFilter) {
                matches.push(filter[key] === msg[key]);
            }
        }

        if (!filter.mode) filter.mode = 'all';
        if (filter.tags) {
            if (filter.tags_mode) filter.tags_mode = filter.mode;
            filterPredicates[filter.tags_mode](filter.tags, (t) =>
                msg.tags.includes(t)
            );
        }
        filterPredicates[filter.mode](filter.tags, (t) => t);
    }

    async save(chatId, ...msgs) {
        await jsonl.append(this._getMessagesPath(chatId), ...msgs);
    }

    async getById(chatId, messageId) {
        const msgPath = this._getMessagesPath(chatId);
        const iterator = jsonl.readFromEnd(msgPath);
        for await (const msg of iterator) {
            if (msg.id === messageId) return msg;
        }
        return null;
    }

    async findLast(chatId, filter, limit) {
        const limitType = typeof limit;
        const isLimitOfWrongType =
            limitType !== 'undefined' && limitType !== 'number';
        if (isLimitOfWrongType || limit <= 0) {
            throw new Error(
                'Limit should be positive number. Pass "undefined" for no limit.'
            );
        }
        const matches = [];
        for await (const msg of jsonl.readFromEnd(
            this._getMessagesPath(chatId)
        )) {
            if (this._matchesFilter(filter, msg)) matches.push(msg);
            if (limit !== undefined && matches.length >= limit) break;
        }
        return matches;
    }

    async update(chatId, messageId, data) {
        await jsonl.mapLines(this._getMessagesPath(chatId), (msg) =>
            msg.id === messageId ? { ...msg, ...data } : msg
        );
    }

    async deleteById(chatId, messageId) {
        const deletedMsgs = await jsonl.filterLines(
            this._getMessagesPath(chatId),
            (msg) => msg.id !== messageId
        );
        if (deletedMsgs.length === 0) {
            throw new Error('Message with this id was not found in the chat');
        }
    }

    async delete(chatId, filter) {
        return await jsonl.filterLines(
            this._getMessagesPath(chatId),
            (msg) => !this._matchesFilter(filter, msg)
        );
    }

    async deleteLast(chatId, filter, limit) {
        const msgsToDelete = this.findLast(chatId, filter, limit);
        const deletedMsgs = await jsonl.filterLines(
            this._getMessagesPath(chatId),
            (msg) => !msgsToDelete.some((msgToDelete) => msgToDelete.id === msg)
        );
        return deletedMsgs;
    }

    async pushHistory(chatId, ...entities) {
        const path = this._getHistoryPath(chatId);
        let strings = await readStrings(path);
        const overflow =
            this.params.historyLimit - (strings.length + entities.length);
        if (overflow > 0) {
            strings = strings.splice(overflow);
        }
        strings.push(entities);
        await writeStrings(path, strings);
    }

    async popHistory(chatId, limit = undefined) {
        const path = this._getHistoryPath(chatId);
        let strings = await readStrings(path);
        const popped = strings.reverse().splice(0, limit);
        strings = strings.splice(-limit);
        await writeStrings(path, strings);
        return popped;
    }

    async readHistory(chatId, limit) {
        const path = this._getHistoryPath(chatId);
        const strings = await readStrings(path);
        const history = strings.reverse().splice(0, limit);
        return history;
    }
}

module.exports = FilesystemStore;
