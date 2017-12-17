const db = require("../../util/rethink");
const BitField = require("../../util/BitField");
const GuildMember = require("../../structures/GuildMember");
const GuildRole = require("../../structures/GuildRole");
const RoleOverride = require("../../structures/RoleOverride");
const MemberOverride = require("../../structures/MemberOverride");
const constants = require("../../../util/constants");
const util = require('util');
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        let role, channel, user;
        if (context.flags.role) role = context.flags.role.id;
        if (context.flags.channel) channel = context.flags.channel.id;
        if (context.flags.user) user = context.flags.user.id;
        const guild = context.guild.id;
        const IDs = { role, channel, user, guild };
        const scope = scopeChoice(channel, role, user, guild);
        switch (context.args[0]) {
            case "allow":
            case "deny": {
                // error handling
                const fieldValue = BitField.resolveNode({ node: context.args[1] });
                if (!fieldValue) {
                    const valueFieldCheck = BitField.resolveNode({ node: context.args[1], object: context.message.constants.VALUEFIELD_DEFAULT });
                    if (!valueFieldCheck) {
                        // inclure les 2 type de chemin de nodes dans le même argument
                        const { embed } = new context.command.EmbedError(context, { error: "permission.undefined", data: { node: context.args[1] } });
                        return context.channel.send(embed);
                    }
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
                const _role = context.flags.role ? context.flags.role.name : null;
                const _channel = context.flags.channel ? context.flags.channel.toString() : null;
                const isChanged = checkSame(output, node);
                let old;
                if (isChanged) {
                    old = set ? ":x:" : ":white_check_mark:";
                } else {
                    old = set ? ":white_check_mark:" : ":x:";
                }
                const now = set ? ":white_check_mark:" : ":x:";
                switch (scope) {
                    case "memberOverride": {
                        embed.setDescription(context.t("perms.success.memberOverride", { mode, node, set, member, channel: _channel }));
                        break;
                    }
                    case "roleOverride": {
                        embed.setDescription(context.t("perms.success.roleOverride", { mode, node, set, channel: _channel, role: _role }));
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
                embed.addField(context.t("words.oldValue"), old, true)
                    .addField(context.t("words.newValue"), now, true);
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
    argTree: {
        choice: {
            show: null,
            allow: {
                label: "",
                choice: {
                    VALUE: {
                        type: "boolean",
                        choice: { VALUE: null}
                    }
                }
            },
            deny: {
                choice: {
                    VALUE: {
                        type: "boolean",
                        choice: { VALUE: null}
                    }
                }
            }
        }
    }
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
 * @typedef {Object} editFieldNodeOptions
 * @property {array} [nodeArray] array from node path
 * @property {Object} [object] the object used in the function
 * @property {string|number} [value] the value we want to edit
 * @property {boolean} [start] whether the recursion already started or not
 * @property {string} [mode] bitField or valueField
 * @property {PermissionType} [subField]
 * @property {PermissionAction} [allow]
 */

/**
 * @typedef {Object} editFieldOptions
 * @property {string} [mode] bitField or valueField
 * @property {PermissionScope} [scope]
 * @property {string} [node] field node path
 * @property {string|number} [value] the value we want to edit
 * @property {Object} [IDs]
 * @property {string} [subField] if mode === "bitField", is the choice between the deny or allow bitField
 * @property {boolean} [allow] if mode === "bitField", whether if we allow or disallow this bit from the permission number
 */

/**
 *
 * @param options {editFieldNodeOptions}
 * @returns {{}}
 */
function editFieldNode(options) {
    const { value, object = {}, start, mode, subField, allow } = options;
    let { nodeArray, cursor } = options;
    if (!start) cursor = object;
    const propName = nodeArray[0];
    // we stop at length === 2 because the command object only contain allow and deny properties
    if (nodeArray.length === 2 && mode === "bitField") {
        if (!cursor[propName]) {
            cursor[propName] = {};
        }
        if (!cursor[propName][subField] || isNaN(cursor[propName][subField])) {
            cursor[propName][subField] = 0;
        }
        const permissionNumber = cursor[propName];
        const isInPermissionNumber = (value | permissionNumber) === permissionNumber;
        // here, the permission number for this subField was already set,
        // we now need to change the value of the bit we want if needed

        // here are the 2 cases where we need to modify the permissionNumber, as the 2 other cases does nothing
        if (isInPermissionNumber && !allow) {
            // if permissionNumber does contain our permission bit and we want to diallow it
            // we use a XOR to remove the permission bit
            cursor[propName][subField] ^= value;

        } else if (!isInPermissionNumber && allow) {
            // if permissionNumber does not contain our permission bit and we want to allow it
            // we use a OR to add the permission bit
            cursor[propName][subField] |= value;
        }
        return object;
    } else if (nodeArray.length === 1 && mode === "valueField") {
        cursor[propName] = value;
        return object;
    } else if (!cursor.hasOwnProperty(propName)) {
        cursor[propName] = {};
    }
    cursor = cursor[propName];
    nodeArray = nodeArray.slice(1);
    const nextOptions = {
        nodeArray,
        value,
        object,
        cursor,
        start: true,
        mode,
        subField,
        allow
    };
    return editFieldNode(nextOptions);
}

/**
 *
 * @param options {editFieldOptions}
 * @returns {Promise<void>}
 */
async function editField(options) {
    const { mode, scope, node, IDs, guildSetting, subField, allow } = options;
    let { value } = options;
    if (mode !== "valueField" && mode !== "bitField") throw new Error(`${mode} is not a valid field mode`);
    if (mode === "bitField" && subField !== "allow" && subField !== "deny") throw new Error(`${subField} is not a valid type`);
    const nodeArray = node.split(".");
    if (mode === "bitField") value = BitField.resolveNode({ node });
    const editFieldNodeOptions = {
        nodeArray,
        value,
        mode,
        subField,
        allow
    };
    switch (scope) {
        case "memberOverride":
        case "roleOverride": {
            let overrideType, OverrideClass, isNew = false;
            if (scope.includes("role")) overrideType = "role";
            else overrideType = "member";
            if (overrideType === "role") OverrideClass = RoleOverride;
            else OverrideClass = MemberOverride;

            const channel = await db.getGuildChannel(IDs.channel);
            const overrides = channel.overrides[`${overrideType}s`];
            let override = overrides.find(_override => _override[`${overrideType}ID`] === IDs[overrideType]);
            if (!override) {
                override = { [`${overrideType}ID`]: IDs[overrideType] };
                isNew = true;
            }
            override = new OverrideClass(override);
            // finish the configuration of the createNodeOptions object
            editFieldNodeOptions.object = override[mode];
            // build a object with the node based on the field of the override
            editFieldNode(editFieldNodeOptions);
            if (isNew) overrides.push(override);
            await db.editGuildChannel(IDs.channel, channel);
            break;
        }
        case "member": {
            const member = await db.getGuildMember(IDs.member, IDs.guild, guildSetting);
            // we don't need to check if the member exists because getGuildMember already instantiate a GuildMember for us
            editFieldNodeOptions.object = member[mode];
            editFieldNode(editFieldNodeOptions);
            await db.editGuildMember(member);
            break;
        }
        case "guild":
        case "role": {
            const id = scope === "guild" ? IDs.guild : IDs.role;
            const role = await db.getGuildRole(id);
            // we don't need to check if the member exists because getGuildMember already instantiate a GuildRole for us
            editFieldNodeOptions.object = role[mode];
            editFieldNode(editFieldNodeOptions);
            await db.editGuildRole(IDs.role);
            break;
        }
    }
}
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
                const index = channel.overrides.members.findIndex(member => member.memberID === IDs.user);
                const storedMemberOverride = channel.overrides.members[index];
                let usedMemberOverride;
                if (storedMemberOverride) {
                    storedMemberOverride.insideGuild = true;
                    usedMemberOverride = new GuildMember(storedMemberOverride);
                } else {
                    usedMemberOverride = new GuildMember({ memberID: IDs.user, insideGuild: true });
                }
                try {
                    const output = buildObject(usedMemberOverride.bitField, permissionNode, mode, option);
                    const memberOverride = new GuildMember({ memberID: IDs.user, bitField: output.bitField, insideGuild: true });
                    if (!storedMemberOverride) {
                        if (Object.keys(memberOverride.bitField).length !== 0) {
                            channel.overrides.members.push(memberOverride);
                        }
                    } else {
                        if (Object.keys(memberOverride.bitField).length !== 0) {
                            channel.overrides.members[index] = memberOverride;
                        } else {
                            channel.overrides.members.splice(index, 1);
                        }
                    }
                    await db.editGuildChannel(IDs.channel, channel, true);
                    return { old: output.old, now: output.now };
                } catch (err) {
                    return console.error(err);
                }
            } else {
                const index = channel.overrides.roles.findIndex(role => role.roleID === IDs.role);
                const storedRoleOverride = channel.overrides.roles[index];
                let usedRoleOverride;
                if (storedRoleOverride) {
                    usedRoleOverride = new GuildRole(storedRoleOverride);
                } else usedRoleOverride = new GuildRole({ roleID: IDs.role });
                try {
                    const output = buildObject(usedRoleOverride.bitField, permissionNode, mode, option);
                    const roleOverride = new GuildRole({ roleID: IDs.role, bitField: output.bitField });
                    if (!storedRoleOverride) {
                        if (Object.keys(roleOverride.bitField).length !== 0) {
                            channel.overrides.roles.push(roleOverride);
                        }
                    } else {
                        if (Object.keys(roleOverride.bitField).length !== 0) {
                            channel.overrides.roles[index] = roleOverride;
                        } else {
                            channel.overrides.roles.splice(index, 1);
                        }
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
                const output = buildObject(bitField, permissionNode, mode, option);
                member.bitField = output.bitField;
                await db.editGuildMember(member, true);
                return { old: output.old, now: output.now };
            } catch (err) {
                return console.error(err);
            }
        }
        case "role": {
            const role = await db.getGuildRole(IDs.role);
            const bitField = role.bitField || {};
            try {
                const output = buildObject(bitField, permissionNode, mode, option);
                role.bitField = output.bitField;
                await db.editGuildRole(IDs.role, role, true);

                const index = GuildSetting.permission.roles.findIndex(settingRole => settingRole === IDs.role);
                if (index === -1 && Object.keys(role.bitField).length !== 0) GuildSetting.permission.roles.push(role.roleID);
                else if (index !== -1 && Object.keys(role.bitField).length === 0) GuildSetting.permission.roles.splice(index, 1);
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
                const output = buildObject(bitField, permissionNode, mode, option);
                channel.bitField = output.bitField;
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
                const output = buildObject(bitField, permissionNode, mode, option);
                role.bitField = output.bitField;
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
    if (!input) input = {};
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
                const keys = Object.keys(input.commands);
                if (keys.length === 0) input = {};
            }
        }
    }
    return { bitField: input, old: number, now: cmd[mode] };
}

function checkSame({ old, now }, permissionString) {
    const permissionNode = BitField.resolveNode(permissionString);
    if (old || now) return !(old & now & permissionNode);
    else return false;
}
