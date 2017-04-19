module.exports.perm = {
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
        force: false
    },
    report: {
        base: false,
        force: false
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
            max: 100,
            user: {
                base: false,
                max: 100,
                force: false
            }
        },
        logout: {
            base: false
        },
        perm: {
            base: false
        }
    },
};
const perm = require("./perms");
module.exports.getPermission = function (path) {

    if (!path)
        return path;

    const pathComponents = path.trim().split(/\./);
    let base = perm[pathComponents[0]];

    if (base === undefined) {
        return "ERROR: " + pathComponents[0] + " is undefined";
    }

    // Check if only the base is needed
    if (pathComponents.length > 1) {
        for (let i=1; i<pathComponents.length; i++) {
            let component = pathComponents[i];
            let test      = base[component];

            // Error,
            if (test === undefined) {
                return "ERROR: " + component + " is undefined";
            }

            // Go to next base
            base = test;
        }
    }

    // Either return list of permissions or a value
    if (base instanceof Object) {
        // Get list of permissions
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

