"use strict";
const jwt = require('jsonwebtoken');
const dbClient = require('mongodb').MongoClient;
let db;
var user_require;
dbClient.connect('mongodb://admin:vanhaiit@cluster0-shard-00-00-ntnbc.mongodb.net:27017,cluster0-shard-00-01-ntnbc.mongodb.net:27017,cluster0-shard-00-02-ntnbc.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true', function (ex, database) {
    //dbClient.connect('mongodb://localhost:27017', function (ex, database) {
    try {
        db = !ex ? database.db("BAI-KT-BE") : false;
        return db;
    } catch (ex) {
        database.close();
    }
});

module.exports = class {

    static async getConnections() {
        try {
            return !db ? false : db;
        } catch (ex) {
            return false;
        }
    }
    static async getUserSendRequire(token) {
        try {
            if (user_require) return user_require;
            const decoded = jwt.verify(token, 'secret');
            user_require = decoded;
            delete decoded.iat;
            delete decoded.exp;
            return !user_require ? false : user_require;
        } catch (ex) {
            return false;
        }
    }
}