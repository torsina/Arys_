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
        // perms
        const { guildSetting } = context;
        let role, channel, user;
        if (context.flags.role) role = context.flags.role.id;
        if (context.flags.channel) channel = context.flags.channel.id;
        if (context.flags.user) user = context.flags.user.id;
        const guild = context.guild.id;
        const IDs = { role, channel, user, guild };
        const scope = scopeChoice(channel, role, user, guild);
        switch (context.args[0]) {
            case "show": {
                break;
            }
            default: {
                // fieldType = bitField || valueField
                // nodeString = node path
                // resolvedNode = permission bit for bitField
                // subType = allow || deny for bitField
                let fieldType, nodeString, permissionBit, subField, userInput;
                console.log(context.args);
                if (context.args[0] === "deny" || context.args[0] === "allow") {
                    fieldType = "bitField";
                    subField = context.args[0];
                    nodeString = context.args[1];
                    userInput = context.args[2];
                    permissionBit = BitField.resolveNode({ node: nodeString });
                    if (!permissionBit) {
                        const { embed } = new context.command.EmbedError(context, { error: "permission.undefined", data: { node: nodeString } });
                        return context.channel.send(embed);
                    }
                } else {
                    fieldType = "valueField";
                    nodeString = context.args[0];
                    userInput = context.args[1];
                    // we don't store the resolved node in the resolvedNode var because what we want here is just to know if this node exist
                    const valueFieldCheck = BitField.resolveNode({ node: nodeString, object: context.message.constants.VALUEFIELD_DEFAULT });
                    if (!valueFieldCheck) {
                        const { embed } = new context.command.EmbedError(context, { error: "permission.undefined", data: { node: nodeString } });
                        return context.channel.send(embed);
                    }
                }
                // start of process
                // mode, scope, node, IDs, guildSetting, subField, permissionBit, userInput
                // for a bitField, allow will be the user input true/false, value will be the permission bit as a int
                // value is either the permission bit we're targeting or the input data
                let output;
                const editFieldOptions = {
                    mode: fieldType,
                    scope,
                    node: nodeString,
                    IDs,
                    guildSetting,
                    subField,
                    permissionBit,
                    userInput
                };
                try {
                    const result = await editField(editFieldOptions);
                    const embedResult = BitField.checkSingle(result, context.message);
                    console.log(embedResult);
                } catch (err) {
                    return console.error(err);
                }
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
    // %perms ?<allow/deny> <node> <value>
    argTree: {
        defaultLabel: "permission",
        choice: {
            show: null,
            set: {
                defaultLabel: "permission node",
                last: true,
                choice: {
                    VALUE: {
                        choice: {

                        }
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
 * @property {string|number} [userInput] the value we want to edit
 * @property {Object} [IDs]
 * @property {string} [subField] if mode === "bitField", is the choice between the deny or allow bitField
 * @property {boolean} [permissionBit] if mode === "bitField", whether if we allow or disallow this bit from the permission number
 */

/**
 *
 * @param options {editFieldNodeOptions}
 * @returns {{}}
 */
function editFieldNode(options) {
    const { userInput, object = {}, start, mode, subField, permissionBit } = options;
    let { nodeArray, cursor } = options;
    // if the recursion has not started, we initialize the cursor
    if (!start) cursor = object;
    // propName is the name of the property we want to add/go through/edit
    const propName = nodeArray[0];
    // we stop at length === 2 because the command object only contain allow and deny properties
    // on the user side, the paths of the bitField follow this schema : <cmdCategory>.<cmd>.<action>
    // on the dev side, the paths of the bitField follow this schema: <cmdCategory>.<cmd>.<allow/deny>
    // here, we're using the dev side of the bitField, so the schema <cmdCategory>.<cmd>.<allow/deny>
    // and our nodeArray will look like this : [cmdCategory, cmd]
    if (nodeArray.length === 2 && mode === "bitField") {
        // we're preventing a TypeError <type> of undefined
        if (!cursor[propName]) {
            cursor[propName] = {};
        }
        // here, subField is whether "deny" or "allow", cf the dev side of the bitField
        // we're initializing the allow/deny field if it hasn't been done yet
        if (!cursor[propName][subField]) {
            cursor[propName][subField] = 0;
        }
        const permissionNumber = cursor[propName][subField];
        const isValueInPermissionNumber = (permissionBit | permissionNumber) === permissionNumber;
        // here, the permission number for this subField was already set,
        // we now need to change the value of the bit we want if needed

        // here are the 2 cases where we need to modify the permissionNumber, as the 2 other cases does nothing
        if (isValueInPermissionNumber && !userInput) {
            // if permissionNumber does contain our permission bit and we want to diallow it
            // we use a XOR to remove the permission bit
            cursor[propName][subField] ^= permissionBit;
        } else if (!isValueInPermissionNumber && userInput) {
            // if permissionNumber does not contain our permission bit and we want to allow it
            // we use a OR to add the permission bit
            cursor[propName][subField] |= permissionBit;
        }
        return object;
    } else if (nodeArray.length === 1 && mode === "valueField") {
        // check if above min/ below max
        cursor[propName] = userInput;
        return object;
    } else if (!cursor.hasOwnProperty(propName)) {
        cursor[propName] = {};
    }
    cursor = cursor[propName];
    nodeArray = nodeArray.slice(1);
    const nextOptions = {
        nodeArray,
        userInput,
        object,
        cursor,
        start: true,
        mode,
        subField,
        permissionBit
    };
    return editFieldNode(nextOptions);
}

/**
 *
 * @param options {editFieldOptions}
 * @returns {Promise<void>}
 */
async function editField(options) {
    const { mode, scope, node, IDs, guildSetting, subField, permissionBit, userInput } = options;
    // we consider that the value of the node was already resolved, aka
    if (mode !== "valueField" && mode !== "bitField") throw new Error(`${mode} is not a valid field mode`);
    if (mode === "bitField" && subField !== "allow" && subField !== "deny") throw new Error(`${subField} is not a valid type`);
    const nodeArray = node.split(".");
    const editFieldNodeOptions = {
        nodeArray,
        userInput,
        mode,
        subField,
        permissionBit
    };
    try {
        switch (scope) {
            case "memberOverride":
            case "roleOverride": {
                let overrideType, OverrideClass, isNew = false;
                if (scope.includes("role")) overrideType = "role";
                else overrideType = "member";
                if (overrideType === "role") OverrideClass = RoleOverride;
                else OverrideClass = MemberOverride;

                const channel = await db.getGuildChannel(IDs.channel);
                // overrides is wether channel.overrides.members or channel.overrides.roles
                const overrides = channel.overrides[`${overrideType}s`];
                let override = overrides.find(_override => _override[`${overrideType}ID`] === IDs[overrideType]);
                if (!override) {
                    override = { [`${overrideType}ID`]: IDs[overrideType] };
                    isNew = true;
                }
                override = new OverrideClass(override);
                // finish the configuration of the createNodeOptions object
                // override[mode] is wether override.bitField or override.valueField
                editFieldNodeOptions.object = override[mode];
                // build a object with the node based on the field of the override
                editFieldNode(editFieldNodeOptions);
                // we add the override to the array of overrides if it's a new one
                if (isNew) overrides.push(override);
                await db.editGuildChannel(IDs.channel, channel);
                return override;
            }
            case "member": {
                const member = await db.getGuildMember(IDs.member, IDs.guild, guildSetting);
                // we don't need to check if the member exists because getGuildMember already instantiate a GuildMember for us
                editFieldNodeOptions.object = member[mode];
                editFieldNode(editFieldNodeOptions);
                await db.editGuildMember(member);
                return member;
            }
            case "guild":
            case "role": {
                const id = scope === "guild" ? IDs.guild : IDs.role;
                const role = await db.getGuildRole(id);
                // we don't need to check if the role exists because getGuildRole already instantiate a GuildRole for us
                editFieldNodeOptions.object = role[mode];
                editFieldNode(editFieldNodeOptions);
                await db.editGuildRole(role);
                return role;
            }
        }
    } catch (err) {
        throw err;
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
                        if (Object.keys(memberOverride.bitField).length !== 0) { // eslint-disable-line no-lonely-if
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
                        if (Object.keys(roleOverride.bitField).length !== 0) { // eslint-disable-line no-lonely-if
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

                const index = guildSetting.permission.roles.findIndex(settingRole => settingRole === IDs.role);
                if (index === -1 && Object.keys(role.bitField).length !== 0) guildSetting.permission.roles.push(role.roleID);
                else if (index !== -1 && Object.keys(role.bitField).length === 0) guildSetting.permission.roles.splice(index, 1);
                await db.editGuildSetting(guildSetting.guildID, guildSetting);

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
