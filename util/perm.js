const perm = module.exports = {};
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const db = require('./rethinkdb');

let bitFields = {};

perm.load = () => {
     let directory = files();
     directory.forEach(function (item) {
         item = item.replace(/\\/g,"/");
         let parts = item.split("/");
         let name = parts[parts.length-1];
         bitFields[name.split(".")[0]] = require("../" + item).bitField;
     });
     console.log(bitFields);
};
/**
 *
 * @param _guild {String} - guild ID
 * @param _roles {Array} - Array of all the roles name of the guildMember
 * @param _member {String} - member ID
 * @returns {Promise.<void>}
 */
perm.processUser = async (_guild, _roles, _member) => {
    if(_member === config.discord.owner) return await db.setGuildMemberPerm(_guild, _member, bitFields); //all values to true
    let roles = [];
    for(let i=0;i<_roles.length;i++) {
        let doc = await db.getRolePerm(_guild, _roles[i]);
        if(doc) {
            roles.push(doc);
        }
    }
    roles.sort(compare);
    roles = reverse(roles);
    let commands = Object.keys(bitFields);
    let workBitFields = {};
    let userBitFields = {};
    for(let i=0;i<commands.length;i++) {
        workBitFields[commands[i]] = {};
        roles.forEach(role => {
            if(role.perm[commands[i]] && role.perm[commands[i]].allow) workBitFields[commands[i]].allow = workBitFields[commands[i]].allow | role.perm[commands[i]].allow;
            if(role.perm[commands[i]] && role.perm[commands[i]].deny) workBitFields[commands[i]].deny = workBitFields[commands[i]].deny | role.perm[commands[i]].deny;
        }); //allow and deny set from all roles
        if(!workBitFields[commands[i]].allow) workBitFields[commands[i]].allow = 0;
        if(!workBitFields[commands[i]].deny) workBitFields[commands[i]].deny = 0;
        userBitFields[commands[i]] = ~workBitFields[commands[i]].deny & workBitFields[commands[i]].allow;
    }
    return await db.setGuildMemberPerm(_guild, _member, userBitFields);
};

perm.check = async (_guildMember, _perm) => {
    let command = _perm.split(".")[0];
    let permName =_perm.split(".");
    delete permName[0];
    permName = permName.join("_");
    permName = permName.slice(1, permName.length);
    let output = !!(_guildMember.perm[command] & bitFields[command][permName]);
    if(output === true) return;
    if(output === false) throw new Error("You lack the permission " + _perm)
};

perm.addToRole = async (_guild, _role, _perm, _message, _type) => {
    if(!_type) throw new Error("No type provided.");
    if(_type !== "allow" && _type !== "deny") throw new Error("Wrong type provided");
    let command = _perm.split(".")[0];
    let permName =_perm.split(".");
    delete permName[0];
    permName = permName.join("_");
    permName = permName.slice(1, permName.length);
    let permResult = [];
    let permList = Object.keys(bitFields[command]);
    for(let i = 0;i<permList.length;i++) {
        console.log(permList[i] + "   " + permName);
        if(permList[i] === permName) {
            permResult = [permName];
            break;
        } else if(permList[i].includes(permName)) {
            permResult.push(permList[i]);
        }
    }
    let roleBitField = await db.getRolePerm(_guild, _role);
    if(roleBitField) roleBitField = roleBitField.perm;
    console.error(permResult);
    permResult.forEach(function (p) {
        console.log(p);
        addBitField(p)
    });
    function addBitField (_permName) {
        if(bitFields[command][_permName]) {
            if(!roleBitField) {
                roleBitField = {}
            }
            if(!roleBitField[command]) {
                roleBitField[command] = {};
                roleBitField[command][_type] = bitFields[command][_permName];
            } else {
                roleBitField[command][_type] = roleBitField[command][_type] ^ bitFields[command][_permName];
            }
            console.error(roleBitField);
            console.error("here");
        } else throw new Error(_perm + " does not exist.");
    }
    await db.setRolePerm(_guild, _role, roleBitField, _message);
    return !!(roleBitField[command][_type] & bitFields[command][permName]); //if perm was added or removed
};

perm.addToUser = async (_guild, _member) => {
    await db.setGuildMemberPerm(_guild, _member, bitFields);
};

perm.getBitField = () => {
    return bitFields;
};

function files() {
    function getFilesFromDir(dir, fileTypes) {
        let filesToReturn = [];
        function walkDir(currentPath) {
            let files = fs.readdirSync(currentPath);
            for (let i in files) {
                let curFile = path.join(currentPath, files[i]);
                if (fs.statSync(curFile).isFile() && fileTypes.indexOf(path.extname(curFile)) !== -1) {
                    filesToReturn.push(curFile.replace(dir, ''));
                } else if (fs.statSync(curFile).isDirectory()) {
                    walkDir(curFile);
                }
            }
        }
        walkDir(dir);
        return filesToReturn;
    }
    return getFilesFromDir("./modules", [".js"]);
}

function compare(a,b) {
    return a.position - b.position;
}

function reverse(array) {
    let length = array.length;
    let left = null;
    let right = null;
    for (left = 0; left < length / 2; left += 1)
    {
        right = length - 1 - left;
        let temporary = array[left];
        array[left] = array[right];
        array[right] = temporary;
    }
    return array;
}

function propName(prop, value){
    for(let i in prop) {
        if (prop[i] === value){
            return i;
        }
    }
    return false;
}