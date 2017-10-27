const db = require("../../util/rethink");
const BitField = require("../../util/BitField");
const constants = require("../../../util/constants");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        let role, channel, user, guild;
        if (context.flags.role) role = context.flags.role.id;
        if (context.flags.channel) channel = context.flags.channel.id;
        if (context.flags.user) user = context.flags.user.id;
        if (context.flags.guild) guild = context.guild.id;
        const IDs = { role, channel, user, guild };
        const scope = scopeChoice(channel, role, user, guild);
        console.log(context.message.GuildSetting);
        switch (context.args[0]) {
            case "allow":
            case "deny": {
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
                let output;
                try {
                    output = await editNumber(context.args[0], context.args[2], scope, context.args[1], IDs, context.message.GuildSetting);
                } catch (err) {
                    return console.error(err);
                }
                const embed = new RichEmbed()
                    .setTimestamp()
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setColor("GREEN");
                const mode = context.args[0];
                const node = context.args[1];
                const set = context.args[2];
                const member = context.flags.user ? context.flags.user.toString() : null;
                const _role = context.flags.role ? context.flags.role.toString() : null;
                const _channel = context.flags.channel ? context.flags.channel.toString() : null;
                const isChanged = checkSame(output, node);
                const old = (isChanged && set) ? ":x:" : ":white_check_mark:";
                const now = set ? ":white_check_mark:" : ":x:";
                switch (scope) {
                    case "memberOverride": {
                        embed.setDescription(context.t("perms.success.memberOverride", { mode, node, set, member, channel: _channel }));
                        break;
                    }
                    case "roleOverride": {
                        embed.setDescription(context.t("perms.success.roleOverride", { mode, node, set, member, role: _role }));
                        break;
                    }
                    case "role": {
                        embed.setDescription(context.t("perms.success.role", { mode, node, set, role: _role }));
                        break;
                    }
                    case "channel": {
                        embed.setDescription(context.t("perms.success.channel", { mode, node, set, channel: _channel }));
                        break;
                    }
                    case "member": {
                        embed.setDescription(context.t("perms.success.member", { mode, node, set, member }));
                        break;
                    }
                }
                embed.addField(context.t("words.value"), context.t("perms.values", { old, now }));
                context.channel.send(embed);
                break;
            }
            case "show": {
                break;
            } default: {
                console.log("end");
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
        return null;
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
async function editNumber(mode, option, scope, permissionNode, IDs, GuildSetting) {
    if (typeof option !== "boolean") throw new Error("Type error: option is not a Boolean");
    switch (scope) {
        case "roleOverride":
        case "memberOverride": {
            const channel = await db.getGuildChannel(IDs.channel);
            if (scope === "memberOverride") {
                const index = channel.overrides.members.findIndex(member => member.id === IDs.user);
                const memberOverride = channel.overrides.members[index];
                const input = memberOverride || {};
                try {
                    let output;
                    if (!memberOverride) {
                        output = buildObject(input, permissionNode, mode, option);
                        channel.overrides.members.push(output.bitField);
                    } else {
                        channel.overrides.members[index] = input;
                    }
                    await db.editGuildChannel(IDs.channel, channel, true);
                    return { old: output.old, now: output.now };
                } catch (err) {
                    return console.error(err);
                }
            } else {
                const index = channel.overrides.roles.findIndex(role => role.id === IDs.role);
                const roleOverride = channel.overrides.roles[index];
                const input = roleOverride || {};
                try {
                    let output;
                    if (!roleOverride) {
                        output = buildObject(input, permissionNode, mode, option);
                        channel.overrides.roles.push(output);
                    } else {
                        channel.overrides.roles[index] = input;
                    }
                    await db.editGuildChannel(IDs.channel, channel, true);
                    return { old: output.old, now: output.now };
                } catch (err) {
                    return console.error(err);
                }
            }
        }
        case "member": {
            const member = await db.getGuildMember(IDs.user, IDs.guild);
            const bitField = member.bitField || {};
            try {
                const output = member.bitField = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildMember(IDs.user, IDs.guild, member, true);
                return { old: output.old, now: output.now };
            } catch (err) {
                return console.error(err);
            }
        }
        case "role": {
            const role = await db.getGuildRole(IDs.role);
            const bitField = role.bitField || {};
            try {
                const output = role.bitField = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildRole(IDs.role, role, true);
                const settingRoleIndex = GuildSetting.permission.roles.findIndex(settingRole => settingRole.roleID === IDs.role);
                if (settingRoleIndex === -1 && Object.keys(output.commands).length) GuildSetting.permission.roles.push(role);
                else if (settingRoleIndex !== -1 && !Object.keys(output.commands).length) GuildSetting.permission.roles[settingRoleIndex] = undefined;
                await db.editGuildSetting(GuildSetting.guildID, GuildSetting);
                return { old: output.old, now: output.now };
            } catch (err) {
                return console.error(err);
            }
        }
        case "channel": {
            const channel = await db.getGuildChannel(IDs.channel);
            const bitField = channel.bitField || {};
            try {
                const output = channel.bitField = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildChannel(IDs.channel, channel, true);
                return { old: output.old, now: output.now };
            } catch (err) {
                return console.error(err);
            }
        }
        case "guild": {
            // this case is for the @everyone role, which have the same id as the guild id
            const role = await db.getGuildRole(IDs.guild);
            const bitField = role.bitField || {};
            try {
                const output = role.bitField = buildObject(bitField, permissionNode, mode, option);
                await db.editGuildRole(IDs.role, role, true);
                return { old: output.old, now: output.now };
            } catch (err) {
                return console.error(err);
            }
        }
        case undefined:
        case null: {
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
        if (!option) {
            cmd[mode] ^= permissionBit;
        }
    } else {
        // number does not have permissionBit
        if (option) { // eslint-disable-line no-lonely-if
            cmd[mode] ^= permissionBit;
        }
    }
    if (cmd[mode] === 0) {
        delete cmd[mode];
        const commandKeys = Object.keys(cmdCategory[pathCommand]);
        if (commandKeys.length === 0) {
            delete cmdCategory[pathCommand];
            const categoryKeys = Object.keys(cmdCategories[pathCategory]);
            if (categoryKeys.length === 0) {
                delete cmdCategories[pathCategory];
            }
        }
    }
    return { bitField: input, old: number, now: cmd[mode] };
}

function checkSame({ old, now }, permissionString) {
    const permissionNode = BitField.resolveNode(permissionString);
    return !!(old & now & permissionNode);
}
