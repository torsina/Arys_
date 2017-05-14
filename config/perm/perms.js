module.exports.perm = {
    base: false,
    interaction: {
        all: false,
        trigger: {
            base: false
        },
        pet: {
            base: false
        }
    },
    help: {
        base: false
    },
    ping: {
        base: false
    },
    post: {
        base: false,
        max : 5,
        force: false,
        reset: false
    },
    report: {
        base: false,
        force: false
    },
    init: {
        base: false
    },
    mod: {
        all: false,
        reload: {
            base: false,
            command: false
        },
        purge: {
            all: false,
            base: false,
            bypass: false,
            force: false,
            user: {
                base: false,
                force: false
            }
        },
        logout: {
            base: false
        },
        perm: {
            base: false
        },
        reposter: {
            base: false,
            set: false,
            clear: false
        }
    },
};
const basePerm = require("./perms").perm;
const perms = require('./perms');
let fs = require('fs');
let rolesPerm = require('./roles').JSON.rolePerm;
let userPerm = require('./users').JSON.userPerm;
const Arys = require('../../Arys');

module.exports.getPermission = function (path, source) {
    if (!path)
        return path;
    let base;
    const pathComponents = path.trim().split(/\./);
    if (source === "user") {
        base = userPerm[pathComponents[0]]; //from the user table
    } else if (source === "role") {
        base = rolesPerm[pathComponents[0]]; //from the role table
    } else if(path === "") {
        base = basePerm.perm[pathComponents[0]]; //from default table, full tree
    } else {
        base = basePerm[pathComponents[0]]; //from default table, a part of the tree
    }

    if (base === undefined) {
        console.error("ERROR1: " + pathComponents[0] + " is undefined");
        return -1;
    }

    // Check if only the base is needed
    if (pathComponents.length > 1) {
        for (let i=1; i<pathComponents.length; i++) {
            let component = pathComponents[i];
            let test      = base[component];

            // Error,
            if (test === undefined) {
                //console.error("ERROR2: " + component + " is undefined");
                return -1;
            }

            // Go to next base
            base = test;
        }
    }

    // Either return list of permissions or a value
    if (base instanceof Object) { // Get list of permissions

        const list = [];
        getBase(base, pathComponents.join(".") + ".", list);
        return list;
    } else {
        return base;
    }
};
function getBase(base, path, list) {
    const keys = Object.keys(base);

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let permEntity = base[key];

        if (permEntity instanceof Object) {
            getBase(permEntity, path + key + ".", list);
        } else {
            list.push(path + key + "=" + permEntity);
        }
    }
}

module.exports.check = function (path, role, user) {
    if(user !== undefined) {
        let input;
        if (path === "") {
            input = user; //full tree user
        }
        else {
            input = user + "." + path; //not full tree user
        }
        console.log(input + " input");
        if(perms.getPermission(input, "user") !== -1) {
            console.log("user used : " + perms.getPermission(input, "user"));
            return perms.getPermission(input, "user");
        }
    }
    if(role !== undefined) {
        let input;
        if (path === "") {
            input = role; //full tree role
        }
        else {
            input = role + "." + path; //not full tree role
        }
        console.log(input + " input");
        if(perms.getPermission(input, "role") !== -1) { //role used
            return perms.getPermission(input, "role");
        }
    }
    if(perms.getPermission(path) !== -1) { //default used
        return perms.getPermission(path);
    }
    else {
        return "wrong permission";
    }
};
