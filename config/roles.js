const config = require('./config');
module.exports.id = {
    fresh: "276647021790887937",
    trending: "248176040428437504",
    nsfw_god: "276058085641027584",
    eye: "242971198718345216",
    smurf: "253880732626321418",
    admin: "242684239223455755"
};

module.exports.perm = {
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