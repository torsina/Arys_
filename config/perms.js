module.exports = {
    interaction: {
        all: false,
        trigger: {
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
        }
    }
};