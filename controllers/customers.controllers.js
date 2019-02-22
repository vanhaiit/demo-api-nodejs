// "use strict";
const successResult = require('./../utilities/successResult');
const errorResult = require('./../utilities/errorResult');
const dbConfig = require('./../utilities/dbConfig');
const mongodb = require("mongodb");
const customerModel = require('./../models/customer.model')

module.exports = class {

    static async createCustomer(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserSendRequire(token);
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            var result;
            const ID = new mongodb.ObjectId().toString();
            const _email = req.body.email;
            const _phone = req.body.phone;
            const _display_name = req.body.display_name;
            var _birthdays = req.body.birthday;
            if (_birthdays) _birthdays = new Date(_birthdays);
            //verify id customer
            result = await customerModel.getCustomerByEmail(_email);
            if (result.success) return res.json(new errorResult(409, "khách hàng đã tồn tại .!"));

            if (!_email || !_phone || !_display_name) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            result = await db.collection('Customers').insert({
                _id: ID,
                display_name: _display_name,
                email: _email,
                address: req.body.address,
                phone: _phone,
                birthday: _birthdays,
                avatar: req.body.avatar,
                create_by: _user,
                gender: req.body.gender,
                source: req.body.source,
                ranking: req.body.ranking,
                is_deleted: false,
                date_deleted: null,
                date_created: new Date(),
            });
            return res.json(new successResult(true, "Tạo thành công", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async updateCustomer(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const customerId = req.params.id;
            if (!customerId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await customerModel.getCustomerById(customerId);
            if (!result.success) return res.json(new errorResult(result.code, result.message));

            var map = req.body;
            let query = {};
            if (map.display_name) query["display_name"] = map.display_name;
            if (map.email) query["email"] = map.email;
            if (map.address) query["address"] = map.address;
            if (map.phone) query["phone"] = map.phone;
            if (map.birthday) query["birthday"] = map.birthday;
            if (map.avatar) query["avatar"] = map.avatar;
            if (map.gender) query["gender"] = map.gender;
            if (map.source) query["source"] = map.source;
            if (map.ranking) query["ranking"] = map.ranking;

            result = await db.collection('Customers').update(
                { _id: customerId }, { $set: query }
            );
            return res.json(new successResult(true, "Chỉnh sửa thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getCustomer(req, res) {
        try {
            const keyword = req.query.keyword;
            const skip = parseInt(req.query.skip);
            const limit = parseInt(req.query.limit);
            const __start_date = req.query.start_date;
            const __end_date = req.query.end_date;
            const _gender = req.query.gender;
            const _source = req.query.source;
            let _start_date; let _end_date;
            if (__start_date && __start_date) {
                _start_date = new Date(__start_date);
                _end_date = new Date(__end_date);
            }
            if (skip < 0 || !limit) return res.json(new errorResult(100, "Tham số không hợp lệ.!"));
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            let result = await db.collection('Customers').aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    {
                                        display_name: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        phone: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        email: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                ]
                            },
                            {
                                birthday: !_start_date || !_end_date
                                    ? { $exists: true } : { $gte: _start_date, $lte: _end_date }
                            },
                            {
                                gender: !_gender
                                    ? { $exists: true } : _gender
                            },
                            {
                                source: !_source
                                    ? { $exists: true } : _source
                            },
                        ]
                    }
                }, {
                    $project: {
                        create_by: 0,
                        date_created: 0,
                        date_deleted: 0,
                        is_deleted: 0
                    }
                }, { $sort: { _id: -1 } }, { $skip: skip }, { $limit: limit }
            ]).toArray();

            return res.json(new successResult(true, "", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getDetailCustomer(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            const customerId = req.params.id;
            //verify id match
            var result = await customerModel.getCustomerById(customerId);
            if (!result.success) return res.json(new errorResult(result.code, result.message));
            //get Customers
            let _post = await db.collection('Customers').aggregate([
                {
                    $lookup:
                    {
                        from: 'Orders',
                        localField: '_id',
                        foreignField: 'customer_info.customer_id',
                        as: 'orders'
                    }
                }, {
                    $project: {
                        "address": 1, "email": 1, "display_name": 1, "phone": 1, "birthday": 1,
                        "gender": 1, "source": 1, "avatar": 1, "orders": 1, "create_by": 1,
                        number_order: {
                            $cond: {
                                if:
                                    { $isArray: "$orders" },
                                then: { $size: "$orders" },
                                else: "NA"
                            }
                        },
                        total_amount_order: {
                            $cond:
                                { if: { $isArray: "$orders" }, then: { $sum: "$orders.total_amount" }, else: "NA" }
                        },
                        total_vat_order: {
                            $cond: {
                                if:
                                    { $isArray: "$orders" }, then: { $sum: "$orders.vat" }, else: "NA"
                            }
                        },
                        total_paid_order: {
                            $cond: {
                                if: { $isArray: "$orders" }, then: { $sum: "$orders.paid" }, else: "NA"
                            }
                        },
                        total_unpaid_order: {
                            $cond: {
                                if:
                                    { $isArray: "$orders" }, then: { $sum: "$orders.unpaid" }, else: "NA"
                            }
                        },
                        total_discount_order: {
                            $cond: {
                                if:
                                    { $isArray: "$orders" }, then: { $sum: "$orders.discount" }, else: "NA"
                            }
                        },
                    }
                }, {
                    $project: {
                        "orders.items": 0,
                        "orders.create_by": 0,
                        "orders.is_completed": 0,
                        "orders.canceled_by": 0,
                        "orders.reason_cancel": 0,
                        "orders.is_cancled": 0,
                        "orders.is_deleted": 0

                    }
                }, {
                    $match: {
                        _id: customerId,
                    }
                }
            ]).toArray();

            return res.json(new successResult(true, "", _post[0]));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async deleteCustomer(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserSendRequire(token);

            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const customerId = req.params.id;
            if (!customerId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await customerModel.getCustomerById(customerId);
            if (!result.success) return res.json(new errorResult(result.code, result.message));

            let query = {
                date_deleted: new Date(),
                is_deleted: true,
                delete_by: _user
            };

            result = await db.collection('Customers').update(
                { _id: customerId }, { $set: query }
            );
            return res.json(new successResult(true, "Xóa khác hàng thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async autoAddCustomer(req, res) {
        const db = await dbConfig.getConnections();
        if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
        const number_customer = parseInt(req.query.number_customer);
        for (let index = 0; index < number_customer; index++) {
            var result = await db.collection('Customers').insert({
                _id: new mongodb.ObjectId().toString(),
                display_name: "CUSTOMER_" + index,
                email: `KHACH${index}@gmail.com`,
                address: `Ha Noi ${index}`,
                phone: `091234568${index}`,
                birthday: `2015-01-${index}`,
                avatar: null,
                create_by: {
                    userName: "vanhaiit",
                    email: "anhem1@gmail.com",
                    userId: "5c64e382d4ddf52238adb320"
                },
                gender: 'male',
                source: 'auto',
                ranking: "vip",
                is_deleted: false,
                date_deleted: null,
                date_created: new Date(),
            });
        }
        return res.json(new successResult(true, "Tạo thành công", result));
    }
}