exports.fiz = function () {
    console.log('fiz!');
};

exports.list = function (obj) {
        let walked = [];
        let stack = [{obj: obj, stack: ''}];
        let j = 0;
        let array = new Array();
        while(stack.length > 0)
        {
            let item = stack.pop();
            let obj = item.obj;
            for (let property in obj)
            {
                if (obj.hasOwnProperty(property))
                {
                    if (typeof obj[property] === "object")
                    {
                        let alreadyFound = false;
                        for(let i = 0; i < walked.length; i++)
                        {
                            if (walked[i] === obj[property])
                            {
                                alreadyFound = true;
                                break;
                            }
                        }
                        if (!alreadyFound)
                        {
                            walked.push(obj[property]);
                            stack.push({obj: obj[property], stack: item.stack + '.' + property});
                        }
                    }
                    else
                        {
                        let output;
                        if (property === "all")
                        {
                            output = item.stack + '.' + "*" + "=" + obj[property];
                        }
                        else if (property === "base")
                        {
                            output = item.stack + "=" + obj[property];
                        }
                        else {
                            output = item.stack + '.' + property + "=" + obj[property];
                        }
                        output = output.slice( 1 );

                        array[j] = output;
                        j++
                    }
                }
            }
        }
        return array;
};



module.exports.perm = {
    interaction: {
        all: false,
        trigger: {
            base: false
        },
        pet: {
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
        },
        perm: {
            base: false
        }
    },
};