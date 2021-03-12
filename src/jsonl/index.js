const __fs = require('fs').promises;
const __path = require('path');

const serialize = async (obj) => JSON.stringify(obj) + '\n';

const write = async (path, ...objects) => {
    fileHandle = await __fs.open(path, 'a');
    if(fileHandle === undefined) throw new Error('Could not open the file!'); 

    for (const obj of objects) {
        string = await serialize(obj);
        await fileHandle.write(string);
    }

    await fileHandle.close();
}

module.exports = {
    write,
};