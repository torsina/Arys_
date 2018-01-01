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
    /**
     * }
     *
     * Creates a permission context to check permissions on
     * @param message
     * @param guildSetting
     * @returns {Promise.<{commands: {}}>}
     */
    static async build(message, guildSetting) {
        // we sort the member's roles by their position
        const rolesID = message.member.roles
            .filter(role => guildSetting.permission.roles.findIndex(guildRole => role.id === guildRole.roleID) !== -1)
            .sort((a, b) => { return message.guild.roles.get(a.id).position - message.guild.roles.get(b.id).position; })
            .keyArray();
        const channelID = message.channel.id;
        const memberID = message.member.id;
        const guildID = message.guild.id;
        // we get all the bitFields needed for this command
        const data = await db.getBitFields(rolesID, channelID, memberID, guildID, guildSetting);
        const arrayBitField = [];
        let rolesOverrides, memberOverrides;
        // add the sorted roles to the array, then the channel, then the member
        if (data.roles) {
            for (let i = 0, n = data.roles.length; i < n; i++) {
                const role = data.roles[i];
                arrayBitField.push(role.bitField);
            }
        }
        if (data.member) arrayBitField.push(data.member);
        if (data.channel && data.channel.own) arrayBitField.push(data.channel.own);
        // check for role overrides
        if (data.channel && data.channel.overrides) {
            const { roles, members } = data.channel.overrides;
            if (roles && roles.length > 0) {
                // filter then sort by position the roles overrides for the roles that the member has
                rolesOverrides = data.channel.overrides.roles
                    .filter(role => message.member.roles.keyArray().indexOf(role.id))
                    .sort((a, b) => { return message.guild.roles.get(a.id).position - message.guild.roles.get(b.id).position; });
                // push them to the array
                rolesOverrides.forEach((role) => {
                    arrayBitField.push(role.bitField);
                });
            }
            // check for member overrides
            if (members && members.length > 0) {
                // get the member's override if exist
                memberOverrides = data.channel.overrides.members
                    .filter(member => member.memberID === memberID)[0];
                // push it to the array
                arrayBitField.push(memberOverrides.bitField);
            }
        }
        // get a array of the command categories
        const cmdCategories = Object.keys(constants.PERMISSION_BITFIELD.commands);
        // declare the final bitField
        const endBitField = { commands: {} };
        // loop through all of the bitFields in the array
        for (let i = 0, n = arrayBitField.length; i < n; i++) {
            const bitField = arrayBitField[i];
            // if empty skip loop
            if (bitField && bitField.commands) {
                // loop over the command categories
                for (let j = 0, m = cmdCategories.length; j < m; j++) {
                    let cmdCategory = endBitField.commands[cmdCategories[j]];
                    // assign this category in the end bitField to an object if not already assigned
                    if (!cmdCategory) cmdCategory = endBitField.commands[cmdCategories[j]] = {};
                    const bitFieldCategory = bitField.commands[cmdCategories[j]];
                    // if empty skip loop
                    if (bitFieldCategory) {
                        // array of all the commands in this category
                        const cmds = Object.keys(constants.PERMISSION_BITFIELD.commands[cmdCategories[j]]);
                        // loop over the commands in the category
                        for (let k = 0, o = cmds.length; k < o; k++) {
                            let cmd = cmdCategory[cmds[k]];
                            // set this command perm number to 0 if does not already initialized
                            if (!cmd) cmd = cmdCategory[cmds[k]] = 0; // eslint-disable-line max-depth
                            // do this to prevent unnecessarily long lines
                            const bitFieldCmd = bitFieldCategory[cmds[k]];
                            const allow = bitFieldCmd.allow || 0;
                            const deny = bitFieldCmd.deny || 0;
                            // compile the allow and deny permission number into one (deny overrides allow if true)
                            // and add this to the final perm number for the command
                            cmdCategory[cmds[k]] = (cmd | allow) & ~deny;
                        }
                    }
                }
            }
        }
        return endBitField;
    }

    static resolveNode(options) {
        const { node, build = false} = options;
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
}
module.exports = BitField;