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
    date: {
        type: Date, default: Date.now
    }
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

db.createAnalytic = async (item, member, channel) => { //
    let query = new analytic({
        item: item,
        user: member,
        channel: channel
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};

db.getDifferentAnalytic = async () => { //
    return new Promise((resolve, reject) => {
        analytic.find().distinct('item').then(doc => {
            if (doc === null) return reject(new Error('table is empty'));
            resolve(doc);
        }).catch(reject);
    });
};

db.countAnalyticByName = async (name) => { //
    let query = analytic.where({
        item: name < i && name > i
    });
    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (doc === null) return reject(new Error('no entry found'));
            resolve(Object.keys(doc).length);
        }).catch(reject);
    });
};

db.countAnalytic = async () => { //
    let stack = [];
    return new Promise((resolve, reject) => {
        db.getDifferentAnalytic().then(doc => {
            if (doc === null) return reject(new Error('table is empty or register doesnt work'));
            for(let i=0; i<doc.length; i++) {
                db.countAnalyticByName(doc[i]).then(count => {
                    stack.push(doc[i] + " " + count);
                    if (i === doc.length - 1) resolve(stack);
                });
            }
        }).catch(reject);
    });
};

db.deleteAnalytic = () => {
    analytic.collection.drop();
};

/*db.getAnalyticByDate = async (min, max) => {
 let minDate = new Date(min);
 let maxDate = new Date(max);
 let query = analytic.where({
 date:  < i
 });
 };*/

