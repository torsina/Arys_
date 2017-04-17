/*const test = require ('./mod');

let listeFonction = Object.keys(test);

for (let i=0; i<listeFonction.length;i++){
    console.log(test[listeFonction[i]].help);
}
*/
const fs = require('fs');
const path = require('path');


module.exports = {
    help: 'Plz send help!!',
    func: (Client, msg, args) => {


            if (args[0] in Client.commands && Client.commands[args[0]].help)
                msg.channel.sendCode('asciidoc', `${args[0]} :: ${Client.commands[args[0]].help}`);
            else {
                let help = "";
                for (var command in Client.commands) {
                    help += `${command} :: ${Client.commands[command].help}\n`
                }
                msg.channel.sendCode('asciidoc', help);
            }

        /*
        const list = fs.readdirSync('./modules/');
        let listeFonction = Object.keys(list);

        for (let i=0; i<listeFonction.length;i++){
            msg.channel.sendMessage(list[listeFonction[i]].name + list[listeFonction[i]].help);
        }*/
    }

}
/*
//const main = requite ('test')
const moduleList = fs.readdirSync('./');
for (i=0; i = moduleList.length; i++){
    console.log(moduleList[i]);
}

/*
const module = require ('./mod');

let listeFonction = Object.keys(module);

for (let i=0; i<listeFonction.length;i++){
    console.log(module[listeFonction[i]].name + ' : ' + module[listeFonction[i]].help);
}*/