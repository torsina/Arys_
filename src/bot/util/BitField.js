const constants = require("../../util/constants");
const db = require("./rethink");
const Misc = require("../../util/misc");
const util = require('util');
const constBitField = constants.PERMISSION_BITFIELD_DEFAULT;
const constValueField = constants.VALUEFIELD_DEFAULT;

class BitField {

    static async buildContext(message, guildSetting) {
        // we sort the member's roles by their position
        const rolesID = message.member.roles
            .filter(role => guildSetting.permission.roles.findIndex(guildRole => role.id === guildRole.roleID) !== -1)
            .sort((a, b) => { return message.guild.roles.get(a.id).position - message.guild.roles.get(b.id).position; })
            .keyArray();
        const channelID = message.channel.id;
        const memberID = message.member.id;
        const guildID = message.guild.id;
        const endContext = { bitField: {}, valueField: {} };
        // we get all the bitFields and valueFields needed for this context
        const data = await db.getBitFields(rolesID, channelID, memberID, guildID, guildSetting);
        // @everyone + packed roles -> member -> channel -> channel override (packed roles) -> channel override (member)
        for (let i = 0, n = data.bitField; i < n; i++) {
            const dataBitField = data.bitField[i];
            const options = {
                mode: "bitField",
                endObject: endContext.bitField,
                dataObject: dataBitField };
            this.stackContext(options);
        }
        for (let i = 0, n = data.valueField; i < n; i++) {
            const dataValueField = data.valueField[i];
            const options = {
                mode: "valueField",
                endObject: endContext.valueField,
                dataObject: dataValueField };
            this.stackContext(options);
        }
        const bitFieldOptions = {
            mode: "bitField",
            fill: true,
            endObject: endContext.bitField
        };
        const valueFieldOptions = {
            mode: "valueField",
            fill: true,
            endObject: endContext.valueField
        };
        this.stackContext(bitFieldOptions);
        this.stackContext(valueFieldOptions);
        return endContext;
    }
    /**
     * fill endObject with data from dataObject based on the structure of defaultObject
     * @param options.mode {"bitField" | "valueField"} whether we're processing a valueField or a bitField
     * @param options.fill {Boolean} whether we fill the gaps of dataObject with defaultObject or not
     * @param options.endObject {Object} the output object
     * @param options.dataObject {Object} the object containing the unfiltered data
     * @param options.defaultObject {Object} the object containing the value of each property, is already set by default for both bitField and valueField modes
     * @param options.start {Boolean} whether we started the recursion process or not
     * @param options.usedPath {Array}
     * @param options.index {Number}
     */
    static stackContext(options) {
        const { mode, fill = false, endObject = {}, dataObject = {}, defaultObject = {}, start = true, usedPath } = options;
        let { index = 0 } = options;
        if (start) {
            const varKeys = Misc.iterate(defaultObject);
            for (let i = 0, n = varKeys.length; i < n; i++) {
                const varKeyArray = varKeys[i].split(".");
                const nextOptions = {
                    mode,
                    fill,
                    endObject,
                    dataObject,
                    defaultObject,
                    start: false,
                    usedPath: varKeyArray,
                    index
                };
                this.stackContext(nextOptions);
            }
            return endObject;
        } else {
            let cursor = endObject;
            let dataCursor = dataObject;
            let constCursor = defaultObject;
            if (mode === "bitField") constCursor = constBitField;
            else if (mode === "valueField") constCursor = constValueField;
            else constCursor = defaultObject;
            let referenceCursor;
            while (index < usedPath.length) {
                const pathIndex = usedPath[index];
                constCursor = constCursor[pathIndex];
                // prevent `property` of undefined error
                if (dataCursor) dataCursor = dataCursor[pathIndex];
                // create the next layer of object if not already created
                if (!cursor[pathIndex] && Misc.isObject(constCursor)) cursor[pathIndex] = {};
                referenceCursor = cursor[pathIndex];
                if (!dataCursor && fill === true && !referenceCursor) {
                    if (Misc.isObject(constCursor)) {
                        Misc.mergeDeep(referenceCursor, constCursor);
                    } else if (Array.isArray(constCursor)) {
                        cursor[pathIndex] = constCursor[0];
                    } else {
                        cursor[pathIndex] = constCursor;
                    }
                    return;
                }
                if (dataCursor && index === usedPath.length - 1 && mode === "bitField") {
                    const { allow, deny } = dataCursor;
                    // (cmd | allow) & ~deny;
                    cursor[pathIndex] = (referenceCursor | allow) & ~deny;
                    return;
                }
                if (dataCursor && index === usedPath.length - 1 && mode === "valueField") {
                    let constValue, order;
                    if (Array.isArray(constCursor)) [constValue, order] = constCursor;
                    else constValue = constCursor;
                    switch (typeof dataCursor) {
                        case "number": {
                            if (!isNaN(dataCursor)) {
                                // if order is true, highest value win, constValue as minimum
                                // if order is false, lowest value win , constvalue as maximum
                                const compareValue = (!referenceCursor || isNaN(referenceCursor)) ? constValue : referenceCursor;
                                if(order) {
                                    cursor[pathIndex] = Math.max(dataCursor, compareValue);
                                } else {
                                    cursor[pathIndex] = Math.min(dataCursor, compareValue);
                                }
                            }
                            break;
                        }
                        default: {
                            cursor[pathIndex] = constValue;
                        }
                    }
                }
                cursor = referenceCursor;
                index++;
            }
        }
    }

    static resolveNode(options) {
        const { node, build = false} = options;
        console.log(node);
        let { object = constants.PERMISSION_BITFIELD } = options;
        let nodeArray = node.split(".");
        // if build is true, we only want the command property, which will be the built number for this command
        if (build) nodeArray = nodeArray.slice(0, 2);
        const b = [...nodeArray];
        for (let i = 0, n = b.length; i < n; ++i) {
            const k = b[i];
            if (k in object) {
                object = object[k];
            } else {
                return false;
            }
        }
        return object;
    }

    static async check(permissionString, message, guildSetting) {
        const permissionNode = this.resolveNode({ node: permissionString });
        if (!permissionNode) throw new message.command.EmbedError(message, { error: "permission.undefined", data: { node: permissionNode } });
        // we get all of the needed bitFields and build the total of them
        const fields = await this.buildContext(message, guildSetting);
        console.log(fields);
        if (typeof permissionNode === "number") {
            const bitFieldNode = this.resolveNode({ node: permissionString, object: fields.bitField, build: true });
            return !!(bitFieldNode & permissionNode);
        } else throw new message.command.EmbedError(message, { error: "permission.notNumber", data: { node: permissionNode } });
    }
    /**
     * * check if a user in the context of the message can use a permission node
     * @everyone + packed roles -> member -> channel -> channel override (packed roles) -> channel override (member)
     * This is the bitField hierarchy of the system, from lowest to highest
     * @param {String} permissionString (ex: util.ping.visible) <cmdCategory>.<cmd>.<node>.<sub-node>
     * @param {Message} message
     * @param {guildSetting} guildSetting
     */
    /**
     * The path to a permission node
     * <cmdCategory>.<cmd>.<node>.<sub-node>
     * (ex: util.ping.visible)
     * @typedef {string} permissionString
     */
    static checkSingle(permissionObject, message) {
        const result = [];
        const bitFieldOptions = {
            mode: "bitField",
            fill: true,
            endObject: permissionObject.bitField
        };
        const valueFieldOptions = {
            mode: "valueField",
            fill: true,
            endObject: permissionObject.valueField
        };
        this.stackContext(bitFieldOptions);
        this.stackContext(valueFieldOptions);
        const { bitField, valueField } = constants.PERMISSION_LIST;
        for (let i = 0, n = bitField.length; i < n; i++) {
            const node = bitField[i];
            const nodeNumber = this.resolveNode({ node });
            const permNumber = this.resolveNode({ node, object: permissionObject.bitField});
            result.push({ node, value: !!(permNumber & nodeNumber) });
        }
        for (let i = 0, n = valueField.length; i < n; i++) {
            const node = valueField[i];
            const nodeNumber = this.resolveNode({ node, object: constants.VALUEFIELD_DEFAULT });
            const permNumber = this.resolveNode({ node, object: permissionObject.valueField });
            result.push({ node, value: !!(permNumber & nodeNumber) });
        }
    }
}
module.exports = BitField;