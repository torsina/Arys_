const config = require('../config/config.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = module.exports = {};

let serverSchema = new Schema({
    id: String,
    config: {
        prefix: String,
        registeredRoles: Array,
        perm: Object,
        report: Number,
        channel: {
            log: String,
            nsfw: Array //of object
        },
        mod: {
            purge: {
                safe: Boolean,
                value: Number
            }
        }
    }
});

let imagePostSchema = new Schema({
    id_image: String,
    id_message: String,
    id_file: String,
    channel: String,
    guild: String,
    report_count: Number
});

let reposterSchema = new Schema({
    id: String,
    enter: String,
    exit: String,
    guild: String,
    role: String
});

let userSchema = new Schema({
    id: String,
    post: String,
    perm: Object
});

let eventSchema = new Schema({
    guild: String,
    name: String,
    creator: String,
    desc: String,
    prize: Object,
    winners: Object,
    schedule: {
        every: String,
        day: String,
        dates: Array //dates out of schedule
    }
});

let analyticSchema = new Schema({
    item: String,
    user: String,
    channel: String,
    guild: String,
    date: Number
});

let imagePost = mongoose.model('imagePost', imagePostSchema);
let reposter = mongoose.model('reposter', reposterSchema);
let event = mongoose.model('event', eventSchema);
let analytic = mongoose.model('analytic', analyticSchema);
/**
 * create the connection with the database
 */
db.load = () => {
    mongoose.connect("mongodb://192.168.1.30/arys"); //id_image, id_message, id_file, report_count
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("connected to mongodb server");
    });
};
/**
 * get the date
 * @returns {string}
 */
function date() {
    let timestamp = new Date();
    return timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ":" + timestamp.getSeconds();
}
/**
 * create a new post in the collection
 * @param {String} image - the line in the file + 1
 * @param {String} message - id of the message of the post
 * @param {String} file - which file does this post come from
 * @param {String} channel - channel id where this is posted
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.createPost = (image, message, file, channel, guild) => {
    let query = new imagePost({
        id_image: image,
        id_message: message,
        id_file: file,
        channel: channel,
        guild: guild,
        report_count: 0
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 * get a precise post from the list
 * @param {String} image - the line in the file + 1
 * @param {String} file - which file does this post come from
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.getPost = (image, file, guild) => {
    let query  = imagePost.where({
        id_image: image,
        id_file: file,
        guild: guild
    });
    return new Promise((resolve, reject) => {
        query.findOne().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            if (doc) {
                resolve(doc);
            }
        }).catch(reject);
    })

};
/**
 * get the post entries with the defined parameters
 * @param {Number} image - the line in the file + 1
 * @param {String} message - id of the message of the post
 * @param {String} file - which file does this post come from
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.getAllPost = (image, message, file, guild) => {
    let searchobj = {};
    if(image !== undefined) searchobj.id_image = image;
    if(message !== undefined) searchobj.id_message = message;
    if(file !== undefined) searchobj.id_file = file;
    searchobj.guild = guild;
    let query = imagePost.where(searchobj);
    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 * add 1 to the report count of the post
 * @param {String} message - id of the message of the post
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.reportPost = (message, guild) => {
    let query  = imagePost.where({
        id_message: message,
        guild: guild
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.report_count++;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};
/**
 * delete the entry from the post collection
 * @param {String} message - id of the message of the post
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.deletePost = (message, guild) => {
    let query  = imagePost.where({
        id_message: message,
        guild: guild
    });
    return new Promise((resolve, reject) => {
        query.findOneAndRemove.then(doc => { //error, no entry found to delete
            if (doc === null) return reject(new Error('no entry found to delete'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 * add a new entry in the reposter collection
 * @param {String} member - id of the user being logged
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.createReposter = (member, guild) => {
    let query = new reposter({
        id: member,
        guild: guild,
        enter: date()
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 * add the end date to the reposter entry
 * @param {String} member - id of the user being logged
 * @param {String} guild - guild id where this is posted
 * @returns {Promise}
 */
db.endReposter = (member, guild) => {
    let query  = reposter.where({
        id: member,
        guild: guild
    });
    return new Promise((resolve, reject) => {
        query.find(function (err, doc) {
            if (err) {
                return reject(new Error('no entry found'));
            }
            db.getReposter().then((member) => {
                for (let i = 0; i < member.length; i++) {
                    if (member[i].exit === undefined) {
                        member[i].exit = date();
                        member[i].save();
                        resolve(member[i]);
                        return;
                    }
                }
            }).catch(reject);
        });
    });
};
/**
 * get the reposter entries with the defined parameters
 * @param guild - mandatory, guild id where this is posted
 * @param member - id of the user being logged
 * @returns {Promise}
 */
db.getReposter = (guild, member) => {
    if(member !== undefined) {
        let query = reposter.where({
            id: member,
            guild: guild
        });

        return new Promise((resolve, reject) => {
            if(guild === undefined) return reject(new Error('no guild scope was used'));
            query.find().then(doc => {
                if (Object.keys(doc).length === 0) {
                    return reject(new Error('no entry found'));
                }
                resolve(doc);
            }).catch(reject);
        });
    } else {
        return new Promise((resolve, reject) => {
            if(guild === undefined) return reject(new Error('no guild scope was used'));
            let query = reposter.where({
                guild: guild
            });
            query.find().then(doc => {
                if (Object.keys(doc).length === 0) {
                    return reject(new Error('no entry found'));
                }
                resolve(doc);
            }).catch(reject);
        });
    }
};
/**
 * delete the reposter collection
 * @returns {*}
 */
db.deleteReposter = () => {
    return reposter.collection.drop();
};

/*
db.createEvent = (name) => {
    let query = new event({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};

db.getEvent = () => {
    return new Promise((resolve, reject) => {
        event.find(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            resolve(doc);
        }).catch(reject);
    });
};

db.deleteEvent = () => {
    let query = new event({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOneAndRemove(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            resolve(doc);
        }).catch(reject);
    });
};

db.editEventCreator = (name, creator) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.creator = creator;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};

db.editEventDescription = (name, desc) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.desc = desc;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};

db.editEventCreator = (name, creator) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.creator = creator;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};

db.editEventPrize = (name, prize) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.prize = prize;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};

db.addEventWinners = (name, winners) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.winners = winners;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};

db.editEventScheduleRegular = (name, every, day) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            doc.schedule.every = every;
            doc.schedule.day = day;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};

db.editEventScheduleIrregular = (name, date) => {
    let query  = event.where({
        name: name
    });
    return new Promise((resolve, reject) => {
        query.findOne(function (err, doc) {
            if (err) return reject(new Error('no entry found'));
            let length = doc.schedule.dates.length + 1;
            doc.schedule.dates[length] = date;
            doc.save();
            resolve(doc);
        }).catch(reject);
    });
};
*/
/**
 * create a new analytic in the collection
 * @param {String} item - full id of the emote being registered
 * @param {String} member - id of the member who used the emote
 * @param {String} channel - id of the channel where emote was used
 * @param {String} guild - id of the guild where emote was used
 * @returns {Promise}
 */
db.createAnalytic = (item, member, channel, guild) => { //
    let query = new analytic({
        item: item,
        user: member,
        channel: channel,
        guild: guild,
        date: Date.now()
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 * get the analytic entries with the defined parameters
 * @param {String} item - full id of the emote being registered
 * @param {String} guild - id of the guild where you want to search
 * @returns {Promise}
 */
db.getAnalytic = (item, guild) => { //
    let query = analytic.where({
        item: item,
        guild: guild
    });
    return new Promise((resolve, reject) => {
        if(guild === undefined) return reject(new Error('no guild scope was used'));
        query.find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 *
 * @param {Object} obj
 * @returns {Promise}
 */
db.getDifferentAnalytic = (obj) => { //
    return new Promise((resolve, reject) => {
        obj.find().distinct('item').then(doc => {
            if (doc === null) return reject(new Error('table is empty'));
            resolve(doc);
        }).catch(reject);
    });
};
/**
 *
 * @param {String} name
 * @param {Object} obj
 * @returns {Promise}
 */
db.countAnalyticByName = (name, obj) => { //
    return new Promise((resolve, reject) => {
        obj.where({item: name}).find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            console.log(Object.keys(doc).length);
            resolve(Object.keys(doc).length);
        }).catch(reject);
    });
};
/**
 * get an array with the emojis and the number of time they were used
 * @param {String} guild - id of the guild where you want to search
 * @param {Object} Object - object of the query used for specific time range
 * @returns {Promise}
 */
db.countAnalytic = (guild, Object) => { //main func
    let obj;
    if (Object === undefined) obj = analytic.where({guild: guild});
    else obj = Object;
    let stack = [];
    return new Promise((resolve, reject) => {
        db.getDifferentAnalytic(obj).then(doc => { //get all nzmes of items in obj(timeframe)
            if (doc === null) return reject(new Error('table is empty or register doesnt work'));
            for(let i=0; i<doc.length; i++) {
                db.countAnalyticByName(doc[i], obj).then(count => { //
                    stack.push(doc[i] + " " + count);
                    if (i === doc.length - 1) resolve(stack);
                }).catch(console.error);
            }
        }).catch(console.error);
    });
};
/**
 * get an array with the emojis and the number of time they were used inside of a time range
 * @param {String} min - starting point of the time range
 * @param {String} max - ending point of the time range
 * @param {String} guild - id of the guild where you want to search
 * @returns {Promise}
 */
db.getAnalyticInDate = (min, max, guild) => { //set timeframe
    let minDate, maxDate;
    if (min === undefined) minDate = 0;
    else minDate = min;
    if (max === undefined) maxDate = Date.now();
    else maxDate = max;
    let minDateObj = new Date(minDate);
    let maxDateObj = new Date(maxDate);
    console.log("triggered");
    let query = analytic.where('date').lt(maxDateObj.getTime()).gt(minDateObj.getTime()).where({guild: guild});
    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (doc === null) return console.log("error : " + min + " " + max); //reject(new Error('no entry for this period'))
            db.countAnalytic(guild, query).then(obj => resolve(obj)).catch(console.error);
        }).catch(console.error);
    });
};
/**
 * get an array of object with the emojis and the number of time they were used for each day of the time range
 * @param {String} min - starting point of the time range
 * @param {String} max - ending point of the time range
 * @param {String} guild - id of the guild where you want to search
 * @returns {Promise}
 */
db.getAnalyticByDate = (min, max, guild) => {
    let minDate, maxDate;
    minDate = min || 0;
    maxDate = max || Date.now();
    let a = new Date(minDate).getTime();
    let b = new Date(maxDate).getTime();
    let days = Math.floor((b-a)/86400000); //number of day
    let stack = [];
    return new Promise((resolve) => {
        let query = analytic.where('date').gt(a).lt(b).where({guild: guild});
        query.find().then(doc => {
            for(let i=0; i<days;i++) { //for each day
                let start = a + i*86400000; //a =
                let end = start + 86400000;
                stack[i] = {};

                let subDoc = doc.filter(function (o) {
                    let date = parseInt(o.date);
                    return (date >= parseInt(start) && date <= parseInt(end));
                });
                //console.log(subDoc.length + "max : " + doc.length +", start : "+ new Date(start) + " , stop : " + new Date(end) + " , i: " + i);
                let nameStack = [...new Set(subDoc.map(analytic => analytic.item))];
                let subStack = [];
                if(nameStack.length !== 0) {
                    for(let j=0;j<nameStack.length;j++) {
                        let name = nameStack[j];
                        let count = subDoc.filter(function (o) {
                            return (o.item === name);
                        }).length;
                        subStack.push(name + " " + count);
                    }
                }
                stack[i].value = subStack;
                stack[i].start = start;
                stack[i].end = end;
            }
            resolve(stack);
        });
    });
};

db.deleteAnalytic = () => {
    analytic.collection.drop();
};

