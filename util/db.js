const config = require('../config/config.js');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = module.exports = {};

let imagePostShema = new Schema({
    id_image: String,
    id_message: String,
    id_file: String,
    report_count: Number
});

let imagePost = mongoose.model('imagePost', imagePostShema);

db.load = () => {
    mongoose.connect("mongodb://192.168.1.30/arys"); //id_image, id_message, id_file, report_count
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("connected to mongodb server");
    });
};

db.createPost = (id_image, id_message, id_file) => {
    let Post = new imagePost({
        id_image: id_image,
        id_message: id_message,
        id_file: id_file,
        report_count: 0
    });
    Post.save(function (err, doc) {
        console.log(doc);
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

db.getAllPost = () => {
    return new Promise((resolve, reject) => {
        imagePost.find().then(doc => {
            if (Object.keys(doc).length === 0) {
                return reject(new Error('table is empty'));
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