'use strict';

const fsBase = require('fs');
const fs = fsBase.promises;
const readline = require('readline');
const { dirname, basename, join } = require('path');

const delimeter = '\n';

const serialize = async (obj) => JSON.stringify(obj) + delimeter;
const deserialize = async (str) => JSON.parse(str);

const append = async (path, ...objects) => {
    const fileHandle = await fs.open(path, 'a');
    if (fileHandle === undefined) throw new Error('Could not open the file!');
    try {
        for (const obj of objects) {
            const string = await serialize(obj);
            await fileHandle.write(string);
        }
    } finally {
        await fileHandle.close();
    }
};

const readFromEnd = async function* (path, bufferSize = 1024) {
    const fileHandle = await fs.open(path, 'r');

    try {
        if (fileHandle === undefined)
            throw new Error('Could not open the file!');
        const stats = await fileHandle.stat();

        const buffer = new Buffer.alloc(bufferSize);
        let rest = '';
        let pos = stats.size;
        let length;
        do {
            pos -= bufferSize;
            length = pos < 0 ? bufferSize + pos : bufferSize;
            const readingResult = await fileHandle.read(
                buffer,
                0,
                length,
                Math.max(pos, 0)
            );

            const string =
                buffer.toString('utf-8', 0, readingResult.bytesRead) + rest;
            const strings = string.split(delimeter);

            if (pos > 0) rest = strings.shift();
            else rest = '';

            for (let i = strings.length; i >= 0; i--) {
                try {
                    const obj = await deserialize(strings[i]);
                    yield obj;
                } catch {}
            }
        } while (pos > 0);
    } finally {
        await fileHandle.close();
    }
};

const mapLines = async (path, map) => {
    if (typeof func !== 'function')
        throw new TypeError('Map callback should be of type function.');

    const fileStream = await fsBase.createReadStream(path);
    const tempPath = join(dirname(path), basename(path) + '.sav');
    const tempFile = await fs.open(tempPath, 'a');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const obj = await deserialize(line);
        await tempFile.write(map(obj));
    }
    tempFile.close();
    await fs.unlink(path);
    await fs.rename(tempPath, path);
};

const filterLines = async (path, predicate) => {
    const fileStream = await fsBase.createReadStream(path);
    const tempPath = join(dirname(path), basename(path) + '.sav');
    const tempFile = await fs.open(tempPath, 'a');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    const filteredOut = [];
    for await (const line of rl) {
        const obj = await deserialize(line);
        if (predicate(obj)) await tempFile.write(line);
        else filteredOut.push(obj);
    }

    tempFile.close();
    await fs.unlink(path);
    await fs.rename(tempPath, path);
    return filteredOut;
};

module.exports = {
    append,
    readFromEnd,
    filterLines,
    mapLines,
};
