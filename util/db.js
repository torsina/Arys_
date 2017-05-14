const config = require('../config/config.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = module.exports = {};
let timestamp = new Date();

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

let imagePost = mongoose.model('imagePost', imagePostSchema);
let reposter = mongoose.model('reposter', reposterSchema);

db.load = () => {
    mongoose.connect("mongodb://192.168.1.30/arys"); //id_image, id_message, id_file, report_count
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("connected to mongodb server");
    });
};

db.createPost = (id_image, id_message, id_file) => {
    let query = new imagePost({
        id_image: id_image,
        id_message: id_message,
        id_file: id_file,
        report_count: 0
    });
    query.save(function (err, doc) {
        if (err) return console.error(err);
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
                console.log(doc);
                resolve(doc);
            }
        }).catch(reject);
    })

};

db.getAllPost = (image, message, file) => {
    const searchobj = {};
    if(image !== undefined) searchobj.id_image = image;
    if(message !== undefined) searchobj.id_message = message;
    if(file !== undefined) searchobj.id_file = file;

    let query = imagePost.where(searchobj);
        return new Promise((resolve, reject) => {
            query.find().then(doc => {
                if (Object.keys(doc).length === 0) {
                    return reject(new Error('no entry found'));
                }
                resolve(doc);
            }).catch(reject);
        });
};

db.reportPost = (id_message) => {
    let query  = imagePost.where({
        id_message: id_message
    });
    query.findOne(function(err, doc) {
        if (err) {
            return console.error('error, no entry found');
        }
        console.log(doc.report_count);
        doc.report_count ++;
        console.log(doc.report_count);
        doc.save();
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
    let date = timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes();
    let query = new reposter({
        id: member,
        enter: date
    });
    return new Promise((resolve, reject) => {
        query.save(function (err, doc) {
            if (err) return reject(new Error('could not save'));
            resolve(doc);
        }).catch(reject);
    });
};

db.endReposter = (member) => {
    let date = timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes();
    let query = new reposter({
        id: member
    });
    return new Promise((resolve, reject) => {
    query.findOne(function(err, doc) {
        if (err) return reject(new Error('could not find'));
        doc.end = date;
        doc.save();
        resolve(doc);
    }).catch(reject);
    });
};

db.getReposter = (member) => {
    const searchobj = {};
    if(member !== undefined) searchobj.id = image;
    let query = reposter.where(searchobj);
    return new Promise((resolve, reject) => {
        query.find().then(doc => {
            if (Object.keys(doc).length === 0) {
                return reject(new Error('no entry found'));
            }
            resolve(doc);
        }).catch(reject);
    });
};

db.deleteReposter = () => {
        reposter.collection.drop();
};