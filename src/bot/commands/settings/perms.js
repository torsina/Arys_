const db = require("../../util/rethink");
const BitField = require("../../util/BitField");
const constants = require("../../util/constants");

module.exports = {
    run: async (context) => {
        let role, channel, user, guild;
        if (context.flags.role) role = context.flags.role.id;
        if (context.flags.channel) channel = context.flags.channel.id;
        if (context.flags.user) user = context.flags.user.id;
        if (context.flags.guild) guild = context.guild.id;
        const IDs = { role, channel, user, guild };
        const scope = scopeChoice(channel, role, user, guild);
        switch (context.args[0]) {
            case ("allow" || "deny"): {
                // error handling
                if (context.args.length < 3) {
                    const error = {
                        error: "wiggle.missingArgs",
                        data: {
                            command: context.command.name,
                            usage: context.usage
                        }
                    };
                    const { embed } = new context.command.EmbedError(context, error);
                    return context.channel.send(embed);
                }
                const permissionNumber = BitField.resolveNode(context.args[1]);
                if (!permissionNumber) {
                    const { embed } = new context.command.EmbedError(context, { error: "permission.undefined", data: { node: context.args[1] } });
                    return context.channel.send(embed);
                } else if (typeof permissionNumber !== "number") {
                    const { embed } = new context.command.EmbedError(context, { error: "permission.notNumber", data: { node: context.args[1] } });
                    return context.channel.send(embed);
                }
                // start of process
                // mode = allow, option = true/false, scope, permissionNode, message, IDs
                try {
                    await editNumber(context.args[0], context.args[2], scope, context.args[1], IDs);
                } catch (err) {
                    return console.error(err);
                }
                break;
            }
            case "show": {
                break;
            }
        }
    },
    guildOnly: true,
    flags: [{
        name: "role",
        type: "role",
        short: "r"
    }, {
        name: "channel",
        short: "c",
        type: "channel"
    }, {
        name: "user",
        short: "u",
        type: "user"
    }, {
        name: "guild",
        short: "g",
        type: "boolean"
    }],
    args: [{
        name: "mode",
        label: "allow | deny | show",
        type: "text",
        optional: false,
        correct: ["allow", "deny", "show"]
    }, {
        name: "permission node",
        label: "Permission node",
        type: "text",
        optional: true
    }, {
        name: "option",
        label: "true | false",
        type: "boolean",
        optional: true
    }]
};

/**
 *
 * @param channel {Snowflake}
 * @param role {Snowflake}
 * @param user {Snowflake}
 * @param guild {Snowflake}
 * @returns {PermissionScope}
 */
function scopeChoice(channel, role, user, guild) {
    if (channel && user) {
        return "memberOverride";
    } else if (channel && role) {
        return "roleOverride";
    } else if (user && !role) {
        return "member";
    } else if (role && !user) {
        return "role";
    } else if (channel) {
        return "channel";
    } else if (guild) {
        return "guild";
    } else {
        return "undefined";
    }
}

/**
 * The scope in which a permission will be edited
 * @typedef {string} PermissionScope
 */

/**
 * Whether the permission will be set to 1 or 0
 * @typedef {boolean} PermissionAction
 */

/**
 * Whether the permission will be set on the allow or deny permission number
 * Can be: allow | deny
 * @typedef {string} PermissionType
 */

/**
 *
 * @param mode {PermissionType}
 * @param option {PermissionAction}
 * @param scope {PermissionScope}
 * @param permissionNode
 * @param IDs {Object<Snowflake>}
 * @returns {Promise.<*>}
 */
async function editNumber(mode, option, scope, permissionNode, IDs) {
    if (typeof option !== "boolean") throw new Error("Type error: option is not a Boolean");
    switch (scope) {
        case ("memberOverride" || "roleOverride"): {
            const channel = await db.getGuildChannel(IDs.channel);
            if (scope === "memberOverride") {
                const index = channel.overrides.members.findIndex(member => member.id === IDs.user);
                const memberOverride = channel.overrides.members[index];
                const input = memberOverride || {};
                try {
                    const output = buildObject(input, permissionNode, mode, option);
                    if (!memberOverride) channel.overrides.members.push(output);
                    else {
                        channel.overrides.members[index] = input;
                    }
                    await db.editGuildChannel(IDs.channel, channel);
                } catch (err) {
                    return console.error(err);
                }
            } else {
                const index = channel.overrides.roles.findIndex(role => role.id === IDs.role);
                const roleOverride = channel.overrides.roles[index];
                const input = roleOverride || {};
                try {
                    const output = buildObject(input, permissionNode, mode, option);
                    if (!roleOverride) channel.overrides.roles.push(output);
                    else {
                        channel.overrides.roles[index] = input;
                    }
                    await db.editGuildChannel(IDs.channel, channel);
                } catch (err) {
                    return console.error(err);
                }
            }
            break;
        }
        case "member": {
            const member = await db.getGuildMember(IDs.user, IDs.guild);
            const bitField = member.bitField || {};
            try {
                const output = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildMember(IDs.user, IDs.guild, { bitField: output });
            } catch (err) {
                return console.error(err);
            }
            break;
        }
        case "role": {
            const role = await db.getGuildRole(IDs.role);
            const bitField = role.bitField || {};
            try {
                const output = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildRole(IDs.role, { bitField: output });
            } catch (err) {
                return console.error(err);
            }
            break;
        }
        case "channel": {
            const channel = await db.getGuildChannel(IDs.channel);
            const bitField = channel.bitField || {};
            try {
                const output = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildChannel(IDs.channel, { bitField: output });
            } catch (err) {
                return console.error(err);
            }
            break;
        }
        case "guild": {
            // this case is for the @everyone role, which have the same id as the guild id
            const role = await db.getGuildRole(IDs.guild);
            const bitField = role.bitField || {};
            try {
                const output = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildRole(IDs.role, { bitField: output });
            } catch (err) {
                return console.error(err);
            }
            break;
        }
        case "undefined": {
            throw new Error("Type error: wrong permission scope");
        }
    }
}

/**
 *
 * @param input
 * @param permissionNode
 * @param mode
 * @param option
 * @returns {*}
 */

function buildObject(input, permissionNode, mode, option) {
    if (typeof option !== "boolean") throw new Error("Type error: option is not a Boolean");
    const path = permissionNode.split(".");
    const [pathCategory, pathCommand, pathNode] = path;
    const permissionBit = constants.PERMISSION_BITFIELD.commands[pathCategory][pathCommand][pathNode];
    // create the command categories object containing the categories
    if (!input.commands) input.commands = {};
    const cmdCategories = input.commands;

    // create the command category object containing the commands
    if (!cmdCategories[pathCategory]) cmdCategories[pathCategory] = {};
    const cmdCategory = cmdCategories[pathCategory];

    // create the command object containing the permission nodes
    if (!cmdCategory[pathCommand]) cmdCategory[pathCommand] = {};
    const cmd = cmdCategory[pathCommand];

    // creating the permission node object containing the allow and deny properties
    const number = cmd[mode];
    if (!number) cmd[mode] = 0;
    if ((number & permissionBit) === permissionBit) {
        // number does have permissionBit
        if (option) {
            if (number === 0) delete cmd[mode];
            return input;
        } else {
            cmd[mode] ^= permissionBit;
        }
    } else {
        // number does not have permissionBit
        if (option) { // eslint-disable-line no-lonely-if
            cmd[mode] ^= permissionBit;
        } else {
            if (number === 0) delete cmd[mode];
            return input;
        }
    }
    return input;
}
