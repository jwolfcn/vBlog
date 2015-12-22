var Db = require('./db');
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'mongoPool',
    create   : function(callback) {
        var mongodb = Db();
        mongodb.open(function (err, db) {
            callback(err, db);
        })
    },
    destroy  : function(mongodb) {
        mongodb.close();
    },
    max      : 100,
    min      : 5,
    idleTimeoutMillis : 30000,
    log      : true
});

function Categorie(categorie) {
    this.name = categorie.name;
    this.createTime = categorie.createTime;
};

module.exports = Categorie;

//存储用户信息
Categorie.prototype.save = function(callback) {
    //要存入数据库的用户文档
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    var categorie = {
        name: this.name,
        createTime:time
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('categories', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将用户数据插入 users 集合
            collection.insert(categorie, {
                safe: true
            }, function (err, categorie) {
                pool.release(db);
                if (err) {
                    return callback(err);//错误，返回 err 信息
                }
                //console.log("user---->"+JSON.stringify(user));
                callback(null, user.ops);//成功！err 为 null，并返回存储后的用户文档//bug
            });
        });
    });
};

//读取用户信息
Categorie.getAll = function(callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('categories', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            collection.find({
            }, function (err, categories) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err 信息
                }
                callback(null, categories);//成功！
            });
        });
    });
};