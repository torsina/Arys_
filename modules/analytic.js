const perms = require('../config/perm/perms');
const db = require('../util/db');
module.exports = {
    help: 'get dem data',
    func: (client, msg, args, role) => {
        if(perms.check("mod.analytic.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.analytic.base`");
            return;
        }
        if(args[0] === "get") { // 0 = get ; 1 = <orderby(least used; highest used; user> ; 2 = <emoji>  ;
            if (args[1] === "inc") {
                db.countAnalytic(msg.guild.id).then(doc => {
                    msg.channel.sendMessage(compare(doc));
                });
            }
            if(args[1] === "date") {
                let a, b, from, to;
                if(args.includes("-from")) {
                    a = args.indexOf("-from");
                    from = new Date;
                    let substr =  args[a+1].split("/");
                    from.setYear(substr[2]);
                    from.setMonth(substr[1]);
                    from.setDate(substr[0]);

                }
                if(args.includes("-to")) {
                    b = args.indexOf("-to");
                    to = new Date;
                    let substr =  args[b+1].split("/");
                    to.setYear(substr[2]);
                    to.setMonth(substr[1]);
                    to.setDate(substr[0]);
                }
                db.getAnalyticByDate(from, to, msg.guild.id).then(doc => {
                    for(i=0;i<doc.length; i++) {
                        let start = new Date(doc[i].start);
                        let end = new Date(doc[i].end);
                        msg.channel.sendMessage(start + "\n" + end + "\n" + doc[i].value);
                    }
                }).catch(console.error);
                if(a === undefined && b === undefined) {
                    msg.channel.sendMessage("you did not set the limits of the search \nplease use `-from <date>` and/or `-to <date>` to set the limits of the search");
                }
            }
            //db.getAnalyticByName("<:feelssmugman:246765996684083210>").then(doc => {console.log(Object.keys(doc).length)})
        }

        if(args[0] === "delete") {
            db.deleteAnalytic();
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
        str += array[i].item + " " + array[i].count + "\n";
    }
    return str;
}