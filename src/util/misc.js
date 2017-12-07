const fs = require("fs");
const path = require("path");

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
class Misc {
    /**
     * this method will create endObject based on dataObject,
     * it will paste every property of dataObject that already exist in defaultObject
     * if dataObject doesn't have all of the needed properties, the gaps will be filled with defaultObject's values
     * @param endObject - the created object
     * @param dataObject - the data that you want to be filtered
     * @param defaultObject - the property map of the endObject
     * @param start - whether the iteration started or not
     * @param usedPath
     * @param index
     */
    setup(endObject = {}, dataObject = {}, defaultObject = {}, start = true, usedPath, index) {
        if (start) {
            const varKeys = this.iterate(defaultObject);
            for (let i = 0, n = varKeys.length; i < n; i++) {
                const varKeyArray = varKeys[i].split(".");
                this.setup(endObject, dataObject, defaultObject, false, varKeyArray, 0);
            }
            return endObject;
        } else {
            let cursor = endObject;
            let dataCursor = dataObject;
            let constCursor = defaultObject;
            let referenceCursor;
            while (index < usedPath.length) {
                const pathIndex = usedPath[index];
                cursor[pathIndex] = {};
                constCursor = constCursor[pathIndex];
                dataCursor = dataCursor[pathIndex];
                referenceCursor = cursor[pathIndex];
                if (!dataCursor) {
                    if (typeof constCursor === "object" && constCursor !== null) this.mergeDeep(referenceCursor, constCursor);
                    else cursor[pathIndex] = constCursor;
                    return;
                }
                if (dataCursor && index === usedPath.length - 1) {
                    cursor[pathIndex] = dataCursor;
                    return;
                }
                cursor = referenceCursor;
                index++;
            }
        }
    }

    static isObject(item) {
        return (item && typeof item === "object" && !Array.isArray(item) && item !== null);
}

    /**
     * perform a deep merge into target from the sources
     * @param target
     * @param sources
     * @returns {*}
     */
    static mergeDeep(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.mergeDeep(target, ...sources);
    }

    /**
     * will get a array of the properties's paths of the object
     * ex: ["foo.bar.something", "foo.bar.somethingNice", "foo.test"]
     * @param obj - input object
     * @param stack
     * @param result
     * @returns {Array}
     */
    static iterate(obj, stack = "", result = []) {
        for (const property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (this.isObject(obj[property])) {
                    this.iterate(obj[property], `${stack}.${property}`, result);
                } else {
                    // cut the first dot off the string
                    result.push(`${stack}.${property}`.slice(1));
                }
            }
        }
        return result;
    }

    /**
     * create a array of all the file's paths
     * @param dir
     * @param filelist
     * @returns {Promise}
     */
    static listFiles(dir, filelist = []) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) reject(err);
                files.forEach((file) => {
                    if (fs.statSync(path.join(dir, file)).isDirectory()) {
                        filelist = this.listFiles(path.join(dir, file), filelist);
                    } else {
                        filelist.push(path.join(dir, file));
                    }
                });
                resolve(filelist);
            });
        });
    }
}

module.exports = Misc;