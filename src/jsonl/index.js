const __fs = require('fs').promises;
const __path = require('path');

const delimeter = '\n';

const serialize = async (obj) => JSON.stringify(obj) + delimeter;
const deserialize = async (str) => JSON.parse(str);

const write = async (path, ...objects) => {
    const fileHandle = await __fs.open(path, 'a');
    if (fileHandle === undefined) throw new Error('Could not open the file!');
    try {
        for (const obj of objects) {
            string = await serialize(obj);
            await fileHandle.write(string);
        }
    }
    finally {
        await fileHandle.close();
    }
}

const readFromEnd = async function* (path, bufferSize = 1024) {
    const fileHandle = await __fs.open(path, 'r');

    try {
        if (fileHandle === undefined) throw new Error('Could not open the file!');
        const stats = await fileHandle.stat();

        const buffer = new Buffer.alloc(bufferSize);
        let rest = '';
        let pos = stats.size;
        let length;
        do {
            pos = pos - bufferSize;
            length = (pos < 0) ? bufferSize + pos : bufferSize;
            const readingResult = await fileHandle.read(buffer, 0, length, Math.max(pos, 0));

            const string = buffer.toString("utf-8", 0, readingResult.bytesRead) + rest;
            const strings = string.split(delimeter);

            if (pos > 0) rest = strings.shift();
            else rest = '';

            for (let i = strings.length; i >= 0; i--) {
                try {
                    const obj = await deserialize(strings[i]);
                    yield obj;
                } catch { };
            }
        } while (pos > 0);

    }
    finally {
        await fileHandle.close();
    }
}

module.exports = {
    write,
    readFromEnd
};