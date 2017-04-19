const token = require('../token');
module.exports = {
    discord: {
        token: {
            bot: token.bot,
            dummy: token.dummy,
            main: token.main
        },
        prefix: "$",
        wait: 5000,
        owner: "245614884786667520"
    },
    db: {
        file: "Arys.db"
    },
    purge: {
        safe: 20,
        max: 100
    },
    post: {
        safe: 5,
        file: "hentai"
    },
    report: {
        need: 3
    }

};
