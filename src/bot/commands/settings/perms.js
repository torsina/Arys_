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
        const { message: { guildSetting } } = context;
        let role, channel, member;
        if (context.flags.role) role = context.flags.role.id;
        if (context.flags.channel) channel = context.flags.channel.id;
        if (context.flags.user) member = context.flags.user.id;
        const guild = context.guild.id;
        const IDs = { role, channel, member, guild };
        const scope = scopeChoice(channel, role, member, guild);
        switch (context.args[0]) {
            case "show": {
                break;
            }
            default: {
                // fieldType = bitField || valueField
                // nodeString = node path
                // resolvedNode = permission bit for bitField
                // subType = allow || deny for bitField

                //console.log(util.inspect(context, {showHidden: false, depth: null}));
                let fieldType, permissionBit, subField;
                const nodeString = context.args[1];
                let userInput = context.args[2];
                let nodeInfo;
                try {
                    nodeInfo = checkNode({ nodeString, context });
                    fieldType = nodeInfo.fieldType;
                    permissionBit = nodeInfo.permissionBit;
                    userInput = nodeInfo.userInput;
                    subField = context.args[3];
                } catch (e) {
                    const { embed } = e;
                    return context.channel.send(embed);
                }
                // start of process
                // mode, scope, node, IDs, guildSetting, subField, permissionBit, userInput
                // for a bitField, allow will be the member input true/false, value will be the permission bit as a int
                // value is either the permission bit we're targeting or the input data
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
                    //console.log(result);
                    //const embedResult = BitField.checkSingle(result, context.message);
                    //console.error(util.inspect(result, false, null));
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
    // %perms set <node> <value> ?<allow/deny>
    argTree: {
        defaultLabel: "permission",
        choice: {
            // display all the permissions for given context
            show: null,
            // set a permission to a given value
            set: {
                defaultLabel: "permission node",
                last: true,
                choice: {
                    // VALUE will be the permission node, ex : settings.perms.set
                    VALUE: {
                        // we want the next argument to be a possible end of the chain
                        last: true,
                        choice: {
                            // here, VALUE will be the user input
                            defaultLabel: "new value",
                            VALUE: {
                                last: true,
                                choice: {
                                    allow: null,
                                    deny: null
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 *
 * This function define the type of the field of this permission & handle the user input & error handling
 *
 * We will first try to check if the permission is contained in the bitField
 * if the permission is contained in it but but the user has not used allow/deny, it will throw an error
 * if the permission is contained in it and the user used allow/deny,
 * we will return the permission bit & the type of the field used
 *
 * if the permission is not contained in the bitField
 * & if it is contained inside the valueField -
 * if the user used allow/deny, it will throw an error -
 * if the new value is not in the same type as the permission, it will throw an error -
 * if the new value is a number, we will check if it follows the rule included in the reference field -
 * we will return that the permission is valid & the type of the field
 */
function checkNode(data) {
    const { nodeString, context } = data;
    const result = {};
    const bitFieldCheck = BitField.resolveNode({ node: nodeString });
    // if the permission is contained in the bitField
    if (bitFieldCheck) {
        const userInput = context.args[2];
        if (~["enable", "yes", "true", "1"].indexOf(userInput)) result.userInput = true;
        else if (~["disable", "no", "false", "0"].indexOf(userInput)) result.userInput = false;
        else throw new context.command.EmbedError(context, { error: "wiggle.resolver.error.booleanError" });
        // if user used allow/deny
        if (context.args[3]) {
            result.fieldType = "bitField";
            result.permissionBit = bitFieldCheck;
            return result;
        } else {
            throw new context.command.EmbedError(context, { error: "perms.error.missingSubField", data: { node: nodeString } });
            // error did not use allow/deny while it should
        }
        // if the permission is not contained in the bitField
    } else {
        const valueFieldCheck = BitField.resolveNode({ node: nodeString, object: context.message.constants.VALUEFIELD_DEFAULT });
        // if the permission is contained in the valueField
        if (valueFieldCheck) {
            if (context.args[3]) {
                result.warning = new context.command.EmbedError(context, { error: "perms.error.notNeededSubField" });
                // warning allow/deny useless in valueField
            }
            const [ruleValue, rule] = valueFieldCheck;
            // we compare the expected data type for this permission and the type of the user input
            const expectedType = typeof ruleValue;
            // we need to parse the user input as best as we can to what it should normally be
            // inputData is the new value of the permission
            const inputData = context.args[2];
            // the rule variable contains a global Symbol saying what rule should be applied to filter off the bad values
            switch (expectedType) {
                case "number": {
                    const parsedUserInput = parseInt(inputData);
                    if (isNaN(parsedUserInput)) {
                        throw new context.command.EmbedError(context, { error: "perms.error.wrongType",
                            data: { value: inputData, expectedType} });
                        // error expecting a number
                    } else if (rule === Symbol.for("<") && parsedUserInput > ruleValue) {
                        throw new context.command.EmbedError(context, { error: "perms.error.notFollowingNumberRule",
                            data: { value: inputData, rule: context.t("words.high"), limit: ruleValue } });
                        // error higher number than maximum
                    } else if (rule === Symbol.for(">") && parsedUserInput < ruleValue) {
                        throw new context.command.EmbedError(context, { error: "perms.error.notFollowingNumberRule",
                            data: { value: inputData, rule: context.t("words.low"), limit: ruleValue } });
                        // error lower number than minimum
                    } else {
                        result.fieldType = "valueField";
                        return result;
                    }
                }
            }
        }
    }

}

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
            cursor[propName][subField] = permissionNumber ^ permissionBit;
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
                if (scope === "roleOverride") overrideType = "role";
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
                console.error(override);
                override.bitField = cleanFields(override.bitField);
                override.valueField = cleanFields(override.valueField);
                console.error(override);
                if (isNew) overrides.push(override);
                await db.editGuildChannel(IDs.channel, channel);
                return override;
            }
            case "channel": {
                const channel = await db.getGuildChannel(IDs.channel);
                editFieldNodeOptions.object = channel[mode];
                editFieldNode(editFieldNodeOptions);
                await db.editGuildChannel(IDs.channel, channel);
                return channel;
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
                await db.editGuildRole(role.roleID, role);
                return role;
            }
        }
    } catch (err) {
        throw err;
    }
}

function cleanFields(parent) {
    for (const property in parent) {
        if (property === 0 || Object.keys(property).length === 0) {
            parent[property] = undefined;
        } else {
            cleanFields(property);
        }
    }
    return parent;
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
