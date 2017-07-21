const perms = require('../util/perm');
const db = require('../util/rethinkdb');

const bitField = {
    help: 1 << 0,
    get: 1 << 1
};

module.exports = {
    help: 'get dem data',
    func: async (client, msg, args, guildMember) => {
        if(args[0] === "get") {// 0 = get ; 1 = <orderby(least used; highest used; user> ; 2 = <emoji>  ;
            try{await perms.check(guildMember, msg.channel.id, "analytic.get")}catch(e) {return msg.channel.send(e.message)}
            if (args[1] === "inc") {
                db.countAnalytic(msg.guild.id).then(doc => {
                    msg.channel.send(compare(doc)).catch(console.error);
                });
            }
            if(args[1] === "date") {
                let a, b, from, to;
                if(args.includes("-from")) {
                    a = args.indexOf("-from");
                    from = new Date;
                    let substr =  args[a+1].split("/");
                    from.setYear(substr[2]);
                    from.setMonth(substr[1]-1);
                    from.setDate(substr[0]);

                }
                if(args.includes("-to")) {
                    b = args.indexOf("-to");
                    to = new Date;
                    let substr =  args[b+1].split("/");
                    to.setYear(substr[2]);
                    to.setMonth(substr[1]-1);
                    to.setDate(substr[0]);
                }
                db.countAnalyticByDate(msg.guild.id, from, to).then(doc => {
                    for(i=0;i<doc.length; i++) {
                        let start = new Date(doc[i].start);
                        let end = new Date(doc[i].end);
                        msg.channel.send(start + "\n" + end + "\n" + doc[i].value);
                    }
                }).catch(console.error);
                if(a === undefined && b === undefined) {
                    msg.channel.send("you did not set the limits of the search \nplease use `-from <date>` and/or `-to <date>` to set the limits of the search");
                }
            }
        }
    }
};

function compare(doc) {
    let array = doc.map(str => {
        let [item, count] = str.split(" "); return { item, count }
    });
    array.sort(function(a, b){
        return a.count-b.count;
    });
    let str = "";
    for(let i=0;i<array.length; i++) {
        console.log(array[i].item);
        str += array[i].item + " " + array[i].count  + "\n";
    }
    return str;
}
module.exports.bitField = bitField;