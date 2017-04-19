module.exports.id = {
    fresh: "276647021790887937",
    trending: "248176040428437504",
    nsfw_god: "276058085641027584",
    eye: "242971198718345216",
    smurf: "253880732626321418",
    admin: "242684239223455755"
};

module.exports.rolePerm = {
    fresh: {
        help: {
            base: true
        }
    },
    trending: {
        interaction: {
            all: true
        },
        report: {
            base: true,
        },
        post: {
            base: true,
            max : 5,
        }
    },
    nsfw_god: {
        post: {
            force: true
        }
    },
    eye: {
        purge: {
            all: true
        },
    },
    smurf: {
        logout: {
            base: true
        },
        perm: {
            base: true
        }
    },
    admin: {
        reload: {
            base: true,
            command: true
        }
    },
    bot_owner: {
    }
};
module.exports.load = function() {
    const perm = require('./roles').rolePerm;
    const id = require('./roles').id;
    perm.trending = Object.assign(perm.trending, perm.fresh);
    perm.nsfw_god = Object.assign(perm.nsfw_god, perm.trending);
    perm.eye = Object.assign(perm.eye, perm.nsfw_god);
    perm.smurf = Object.assign(perm.smurf, perm.eye);
    perm.admin = Object.assign(perm.admin, perm.smurf);
    perm.bot_owner = Object.assign(perm.bot_owner, perm.admin);
    perm.fresh.id = id.fresh;
    perm.trending.id = id.trending;
    perm.nsfw_god.id = id.nsfw_god;
    perm.eye.id = id.eye;
    perm.smurf.id = id.smurf;
    perm.admin.id = id.admin;
    console.log("perm : " + perm.bot_owner.logout.base);
    console.log("id : " + perm.admin.id);
};