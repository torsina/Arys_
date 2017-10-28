const fs = require("fs");
const path = require("path");
const misc = {};
module.exports = misc;
misc.readFile = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = misc.readFile(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

misc.searchObject = (obj, key) => {
    if (typeof key === "undefined") {
        key = [];
    }
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === "string" || obj[key] instanceof String) {
                key.push(obj[key]);
            } else if (obj[key] !== null && typeof obj[key] === "object") {
                misc.searchObject(obj[key], key);
            }
        }
    }
    return key;
};

Array.prototype.reverse = function () { // eslint-disable-line func-names
    const { length } = this;
    let left = null;
    let right = null;
    for (left = 0; left < length / 2; left += 1) {
        right = length - 1 - left;
        const temporary = this[left];
        this[left] = this[right];
        this[right] = temporary;
    }
    return this;
};