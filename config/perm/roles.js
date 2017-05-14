const fs = require('fs');
module.exports.id = {
    fresh: "276647021790887937",
    trending: "248176040428437504",
    captain: "244175416460443649",
    op: "244050172768813058",
    oldfag: "288607952468836352",
    hot: "248164589458554883",
    nsfw_god: "276058085641027584", //276058085641027584
    eye: "242971198718345216",
    smurf: "253880732626321418",
    admin: "242684239223455755" //242684239223455755
};
//244175416460443649
module.exports.rolePermBase = {
    fresh: {
        base: true,
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
    captain: {
    },
    op : {
    },
    oldfag: {
    },
    hot : {
    },
    nsfw_god: {
        post: {
            force: true
        },
        report: {
            force: true
        }
    },
    eye: {
        mod: {
            purge: {
                all: true
            },
            reposter: {
                base: true,
                get: true
            }
        },
    },
    smurf: {
        mod: {
            logout: {
                base: true
            },
            perm: {
                base: true
            }
        }
    },
    admin: {
        mod: {
            reload: {
                base: true,
                command: true
            }
        }
    },
    bot_owner: {
        ping: {
            base: true
        },
        post: {
            reset: true
        },
        init: {
            base: true
        },
        mod: {
            reposter: {
                set: true,
                clear: true
            }
        }
    }
};

module.exports.JSON = {
    rolePerm: JSON.parse(fs.readFileSync('./config/perm/JSON/perms.json', 'utf8'))
};

module.exports.load = function() {
    let perm = require('./roles').JSON.rolePerm;
    let id = require('./roles').id;
    let assign = require('assign-deep');
    let perms = require('./perms');
    let objectPath = require('object-path');
    //make that every role extand from the one above
    assign(perm.trending, perm.fresh);
    assign(perm.captain, perm.trending);
    assign(perm.op, perm.captain);
    assign(perm.oldfag, perm.op);
    assign(perm.hot, perm.oldfag);
    assign(perm.nsfw_god, perm.hot);
    assign(perm.eye, perm.nsfw_god);
    assign(perm.smurf, perm.eye);
    assign(perm.admin, perm.smurf);
    assign(perm.bot_owner, perm.admin);
    perm.fresh.id = id.fresh;
    perm.trending.id = id.trending;
    perm.captain.id = id.captain;
    perm.op.id = id.op;
    perm.oldfag.id = id.oldfag;
    perm.hot.id = id.hot;
    perm.nsfw_god.id = id.nsfw_god;
    perm.eye.id = id.eye;
    perm.smurf.id = id.smurf;
    perm.admin.id = id.admin;
    Object.keys(perm).forEach(function(role) {
        // Pour chaque permission associée au role
        perms.check("", role).forEach(function(a) {
            // Si ta condition bizarre s'applique alors
            if(a.search(".all=true") !== -1) {
                // On coupe la permission au niveau du =, on prends la première partie, on la découpe sur les points
                let b = a.split('=')[0].split('.');
                // On taille tableau - 2 depuis la seconde entrée, on réassemble les éléments avec un . entre
                let c = b.splice(1,b.length-2).join('.');
                // Pour chaque perm check sur l'objet réassemblé
                perms.check(c).forEach(function(d) {
                    // On fait un objectpath
                    objectPath.set(perm, role + '.' + d.split('=')[0], true);
                })
            }
        });
    });

};