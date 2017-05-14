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
        owner: "306418399242747906"
    },
    db: {
        file: "Arys.db",
        host: "localhost",
        port: "28015"
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
    },
    reposter: "245501778018304001"

};
