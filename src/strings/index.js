'use strict';

const fs = require('fs').promises;

const encoding = 'utf-8';

const readStrings = async (path) => {
    const data = await fs.readFile(path, {
        encoding,
    });
    const strings = data.trim().split('\n');
    return strings;
};

const writeStrings = async (path, strings) => {
    for (let i = 0; i < strings.length; i++) {
        strings[i] = strings[i].trim() + '\n';
    }
    const stringToWrite = strings.concat();
    await fs.writeFile(path, stringToWrite, { encoding: 'utf8' });
};

module.exports = {
    readStrings,
    writeStrings,
};
