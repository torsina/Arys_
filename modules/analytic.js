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
                db.countAnalytic().then(doc => {
                    msg.channel.sendMessage(compare(doc));
                });
            }
            if(args[1] === "date") {
                let a, b, from, to;
                if(args.includes("-from")) {
                    a = args.indexOf("-from");
                    from = args[a+1];
                }
                if(args.includes("-to")) {
                    b = args.indexOf("-to");
                    to = args[b+1];
                }
                db.getAnalyticInDate(from, to).then(doc => {
                    msg.channel.sendMessage(compare(doc));
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