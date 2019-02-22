// "use strict";
const successResult = require('./../utilities/successResult');
const errorResult = require('./../utilities/errorResult');
const dbConfig = require('./../utilities/dbConfig');
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var userModel = require('./../models/users.model');

module.exports = class {

    static async user_signup(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            var result;
            const emails = req.body.email;

            result = await userModel.getUserByEmail(emails);
            if (result.success) return res.json(new errorResult(409, "Tài khoản đã tồn tại .!"));

            const id = new mongodb.ObjectId().toString();
            const email = req.body.email;
            const password = req.body.password;
            const username = req.body.userName;
            var birthdays = req.body.birthday;
            if (birthdays) birthdays = new Date(birthdays);
            if (!email || !password || !username) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            bcrypt.hash(req.body.password, 10, async (err, hash) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                } else {
                    let require = await db.collection('Users').insert({
                        _id: id,
                        email: email,
                        emailConfirmed: false,
                        password: hash,
                        birthday: birthdays,
                        gender: req.body.gender,
                        address: req.body.address,
                        phone: req.body.phone,
                        phone_confirmed: false,
                        userName: username,
                        fullName: req.body.fullName,
                        avatar: req.body.avatar,
                        Provider: req.body.provider ? req.body.provider : "UserCreate",
                    });
                    return res.json(new successResult(true, "Thêm mới hành công", require));
                }
            });

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async user_signin(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            let user = await db.collection('Users').findOne({ userName: req.body.userName });
            if (!user) {
                return res.json(new errorResult(401, "Auth failed"));
            }
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err) {
                    return res.json(new errorResult(401, "Auth failed"));
                }
                if (result) {
                    const token = jwt.sign(
                        {
                            userName: user.userName,
                            email: user.email,
                            userId: user._id,
                        },
                        "secret",
                        {
                            expiresIn: 60 * 60 * 24 * 30
                        }
                    );
                    return res.json(new successResult(true, "Đăng nhập thành công", {
                        token: token
                    }));
                }
                return res.json(new errorResult(401, "Auth failed"));
            });
        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }


}