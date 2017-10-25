const constants = require("./constants");
const db = require("./rethink");
class BitField {
    constructor(bitField) {
        /**
         * An object containing the permission numbers of the bot
         * Can come from a GuildRole, GuildRole, or GuildMember
         * @typedef {Object} Permission
         */
        /**
         * Converts a database bitField to a valid bitField
         * @param {Permission}
         */
        this.bitField = this.fill(bitField);
        this.type = bitField.type;
    }

    /**
     * Creates a comparable bitField from a database entry
     * @param {PermissionResolvable} _bitField
     * @returns {Permission}
     */
    /** @constructs */
    static fill(_bitField) {
        // default full bitField
        const baseBitField = constants.PERMISSION_BITFIELD_DEFAULT;
        // command categories array
        const cmdCategories = Object.keys(constants.PERMISSION_BITFIELD.commands);
        const endBitField = {
            commands: {}
        };
        // if empty assign to default non built bitField and skip whole loop
        if (!_bitField.commands) endBitField.commands = baseBitField.commands;
        else {
            // loop over the command categories
            for (let i = 0; i < cmdCategories.length; i++) {
                // do this to prevent unnecessarily long lines
                let cmdCategory = endBitField.commands[cmdCategories[i]] = {};
                const baseCmdCategory = baseBitField.commands[cmdCategories[i]];
                const _bitFieldCmdCategory = _bitField.commands[cmdCategories[i]];
                // if empty assign to default non built bitField and skip iteration
                if (!_bitFieldCmdCategory) {
                    cmdCategory = baseCmdCategory;
                    continue;
                }
                // commands from command category array
                const cmds = Object.keys(constants.PERMISSION_BITFIELD.commands[cmdCategories[i]]);
                // loop over the commands
                for (let j = 0; j < cmds.length; j++) {
                    // do this to prevent unnecessarily long lines
                    const baseBitFieldCmd = baseBitField.commands[cmdCategories[i]][cmds[j]];
                    const _bitFieldCmd = _bitField.commands[cmdCategories[i]][cmds[j]];
                    // if empty assign to default non built bitField and skip iteration
                    if (!_bitFieldCmd) {
                        cmdCategory[cmds[j]] = baseBitFieldCmd;
                        continue;
                    }
                    // compile the allow and deny permission number into one (deny overrides allow if true)
                    const allow = _bitFieldCmd.allow || 0;
                    const deny = _bitFieldCmd.deny || 0;
                    cmdCategory[cmds[j]] = allow & ~deny;
                }
            }
        }
        return endBitField;
    }

    /**
     *
     * @param message
     * @param guildSetting
     * @returns {Promise.<{commands: {}}>}
     */
    static async build(message, guildSetting) {
        // we sort the member's roles by their position
        const rolesID = message.member.roles
            .filter(role => guildSetting.permission.roles.indexOf(role.id) !== -1)
            .sort((a, b) => { return message.guild.roles.get(a.id).position - message.guild.roles.get(b.id).position; })
            .keyArray();
        const channelID = message.channel.id;
        const memberID = message.member.id;
        const guildID = message.guild.id;
        // we get all the bitFields needed for this command
        const data = await db.getBitFields(rolesID, channelID, memberID, guildID);
        const arrayBitField = [];
        const base = constants.PERMISSION_BITFIELD_DEFAULT;
        let rolesOverrides, memberOverrides;
        // add the sorted roles to the array, then the channel, then the member
        if (data.roles) arrayBitField.push(...data.roles);
        if (data.channel && data.channel.own) arrayBitField.push(data.channel.own);
        if (data.member) arrayBitField.push(data.member);
        // check for role overrides
        if (data.channel && data.channel.overrides) {
            const { roles, members } = data.channel.overrides;
            if (roles && roles.length > 0) {
                // filter then sort by position the roles overrides for the roles that the member has
                rolesOverrides = data.channel.overrides.roles
                    .filter(role => message.member.roles.indexOf(role.id))
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
                    .filter(member => member.id === memberID);
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
            // loop over the command categories
            for (let j = 0, m = cmdCategories.length; j < m; j++) {
                let cmdCategory = endBitField.commands[cmdCategories[j]];
                // assign this category in the end bitField to an object if not already assigned
                if (!cmdCategory) cmdCategory = endBitField.commands[cmdCategories[j]] = {};
                const bitFieldCategory = bitField.commands[cmdCategories[j]];
                // if empty assign to default bitField and skip loop
                if (!bitFieldCategory) {
                    bitField.commands[cmdCategories[j]] = base.commands[cmdCategories[j]];
                } else {
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
        return endBitField;
    }

    static resolveNode(_permissionString, object = constants.PERMISSION_BITFIELD, build = false) {
        let a = _permissionString.split(".");
        if (build) a = a.slice(0, 2);
        const b = ["commands", ...a];
        console.log(object);
        for (let i = 0, n = b.length; i < n; ++i) {
            const k = b[i];
            console.log(k);
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
            console.log(bitFieldNode, permissionNode);
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