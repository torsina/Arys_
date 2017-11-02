const constants = require("../../util/constants");
const db = require("./rethink");
const util = require('util');
class BitField {

    /**
     * Creates a permission context to check permissions on
     * @param message
     * @param GuildSetting
     * @returns {Promise.<{commands: {}}>}
     */
    static async build(message, GuildSetting) {
        // we sort the member's roles by their position
        const rolesID = message.member.roles
            .filter(role => GuildSetting.permission.roles.findIndex(guildRole => role.id === guildRole.roleID) !== -1)
            .sort((a, b) => { return message.guild.roles.get(a.id).position - message.guild.roles.get(b.id).position; })
            .keyArray();
        const channelID = message.channel.id;
        const memberID = message.member.id;
        const guildID = message.guild.id;
        // we get all the bitFields needed for this command
        const data = await db.getBitFields(rolesID, channelID, memberID, guildID, GuildSetting);
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

    static resolveNode(_permissionString, object = constants.PERMISSION_BITFIELD, build = false) {
        let a = _permissionString.split(".");
        // if build is true, we only want the command property, which will be the built number for this command
        if (build) a = a.slice(0, 2);
        const b = ["commands", ...a];
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
        const permissionNode = this.resolveNode(permissionString);
        if (!permissionNode) throw new message.command.EmbedError(message, { error: "permission.undefined", data: { node: permissionNode } });
        // we get all of the needed bitFields and build the total of them
        const bitField = await this.build(message, guildSetting);
        if (typeof permissionNode === "number") {
            const bitFieldNode = this.resolveNode(permissionString, bitField, true);
            return !!(bitFieldNode & permissionNode);
        } else throw new message.command.EmbedError(message, { error: "permission.notNumber", data: { node: permissionNode } });
    }
    /**
     * * check if a user in the context of the message can use a permission node
     * @everyone + packed roles -> member -> channel -> channel override (packed roles) -> channel override (member)
     * This is the bitField hierarchy of the system, from lowest to highest
     * @param {String} permissionString (ex: util.ping.visible) <cmdCategory>.<cmd>.<node>.<sub-node>
     * @param {Message} message
     * @param {GuildSetting} guildSetting
     */
    /**
     * The path to a permission node
     * <cmdCategory>.<cmd>.<node>.<sub-node>
     * (ex: util.ping.visible)
     * @typedef {string} permissionString
     */
}
module.exports = BitField;