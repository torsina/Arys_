const config = require('../config/config.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = module.exports = {};

let imagePostSchema = new Schema({
    id_image: String,
    id_message: String,
    id_file: String,
    report_count: Number
});

let reposterSchema = new Schema({
    id: String,
    enter: String,
    exit: String
});

let userSchema = new Schema({
    id: String,
    post: String,
    perm: Object
});

let eventSchema = new Schema({
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

db.load = () => {
    mongoose.connect("mongodb://192.168.1.30/arys"); //id_image, id_message, id_file, report_count
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("connected to mongodb server");
    });
};

function date() {
    let timestamp = new Date();
    return timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ":" + timestamp.getSeconds();
}

db.createPost = (id_image, id_message, id_file) => {
    let query = new imagePost({
        id_image: id_image,
        id_message: id_message,
        id_file: id_file,
        report_count: 0
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};

db.getPost = (id_image, id_file) => {
    let query  = imagePost.where({
        id_image: id_image,
        id_file: id_file
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

db.getAllPost = (image, message, file) => {
    let searchobj = {};
    if(image !== undefined) searchobj.id_image = image;
    if(message !== undefined) searchobj.id_message = message;
    if(file !== undefined) searchobj.id_file = file;
    let query = imagePost.where(searchobj);

    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            resolve(doc);
        }).catch(reject);
    });
};

db.reportPost = (id_message) => {
    let query  = imagePost.where({
        id_message: id_message
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

db.deletePost = (id_message) => {
    let query  = imagePost.where({
        id_message
    });
    return new Promise((resolve, reject) => {
        query.findOneAndRemove.then(doc => { //error, no entry found to delete
            if (doc === null) return reject(new Error('no entry found to delete'));
            resolve(doc);
        }).catch(reject);
    });
};

db.createReposter = (member) => {
    let query = new reposter({
        id: member,
        enter: date()
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};

db.endReposter = (id) => {
    let query  = reposter.where({
        id: id
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

db.getReposter = (member) => {
    if(member !== undefined) {
        let query = reposter.where({
            id: member
        });
        return new Promise((resolve, reject) => {
            query.find().then(doc => {
                if (Object.keys(doc).length === 0) {
                    return reject(new Error('no entry found'));
                }
                resolve(doc);
            }).catch(reject);
        });
    } else {
        return new Promise((resolve, reject) => {
            reposter.find().then(doc => {
                if (Object.keys(doc).length === 0) {
                    return reject(new Error('no entry found'));
                }
                resolve(doc);
            }).catch(reject);
        });
    }
};

db.deleteReposter = () => {
    reposter.collection.drop();
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

db.createAnalytic = async (item, member, channel, guild) => { //
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

db.getAnalytic = async (name) => { //
    let query = analytic.where({
        item: name
    });
    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            resolve(doc);
        }).catch(reject);
    });
};

db.getDifferentAnalytic = async (obj) => { //
    return new Promise((resolve, reject) => {
        obj.find().distinct('item').then(doc => {
            if (doc === null) return reject(new Error('table is empty'));
            resolve(doc);
        }).catch(reject);
    });
};

db.countAnalyticByName = async (name, obj) => { //
    //console.log(obj);
    return new Promise((resolve, reject) => {
        obj.where({item: name}).find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            console.log(Object.keys(doc).length);
            resolve(Object.keys(doc).length);
        }).catch(reject);
    });
};

db.countAnalytic = async (Object) => { //main func
    let obj;
    if (Object === undefined) obj = analytic;
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

db.getAnalyticInDate = async (min, max) => { //set timeframe
    let minDate, maxDate;
    if (min === undefined) minDate = 0;
    else minDate = min;
    if (max === undefined) maxDate = Date.now();
    else maxDate = max;
    let minDateObj = new Date(minDate);
    let maxDateObj = new Date(maxDate);
    console.log("triggered");
    let query = analytic.where('date').lt(maxDateObj.getTime()).gt(minDateObj.getTime());
    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (doc === null) return console.log("error : " + min + " " + max); //reject(new Error('no entry for this period'))
            db.countAnalytic(query).then(obj => resolve(obj)).catch(console.error);
        }).catch(console.error);
    });
};

db.getAnalyticByDate = async (min, max) => {
    let minDate, maxDate;
    minDate = min || 0;
    maxDate = max || Date.now();
    let a = new Date(minDate).getTime();
    let b = new Date(maxDate).getTime();
    let days = Math.floor((b-a)/86400000); //number of day
    let stack = [];
    return new Promise((resolve) => {
        let query = analytic.where('date').gt(a).lt(b);
        query.find().then(doc => {
            for(i=0; i<days;i++) { //for each day
                let start = a + i*86400000; //a =
                let end = start + 86400000;
                stack[i] = {};
                let subDoc = doc.filter(function (o) {return (parseInt(o.date) >= parseInt(start) && parseInt(o.date) <= parseInt(end))});
                //console.log(subDoc.length + "max : " + doc.length +", start : "+ new Date(start) + " , stop : " + new Date(end) + " , i: " + i);
                let nameStack = [...new Set(subDoc.map(analytic => analytic.item))];
                let subStack = [];
                if(nameStack.length !== 0) {
                    for(j=0;j<nameStack.length;j++) {
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

