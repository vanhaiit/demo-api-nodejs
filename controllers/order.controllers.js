// "use strict";
const successResult = require('./../utilities/successResult');
const errorResult = require('./../utilities/errorResult');
const dbConfig = require('./../utilities/dbConfig');
const mongodb = require("mongodb");
const orderModel = require('./../models/order.model');
const productOptionsModel = require('../models/productOptions.model')

module.exports = class {

    static async createOrder(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserSendRequire(token);
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            var result;
            const ID = new mongodb.ObjectId().toString();
            const _order_code = req.body.order_code;
            if (!_order_code) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await orderModel.getOrdeCode(_order_code);
            if (!result.success) return res.json(new errorResult(409, "Mã Code Order đã tồn tại.!"));

            result = await db.collection('Orders').insert({
                _id: ID,
                order_code: _order_code,
                description: req.body.description,
                customer_info: req.body.customer_info,
                discount: req.body.discount,
                vat: req.body.vat,
                total_cost_after_discount: req.body.total_cost_after_discount,
                paid: req.body.paid,
                unpaid: req.body.unpaid,
                items: req.body.items,
                status: 1,
                status_name: "chờ xác nhận",
                create_by: _user,
                is_completed: false,
                canceled_by: null,
                reason_cancel: null,
                is_cancled: false,
                is_deleted: false,

            });
            req.body.items.forEach(async element => {
                var check = await productOptionsModel.getProdutctOptionsId(element.product_id);

                if (check.data) {
                    var query = {
                        top: check.data.top + 1
                    }
                    result = await db.collection('ProductOptions').update({ _id: element.product_id }, { $set: query });
                    console.log(result);

                }

            });
            return res.json(new successResult(true, "Tạo thành công", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async updateOrder(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const orderId = req.params.id;

            if (!orderId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            //check orderid
            result = await orderModel.getOrdeId(orderId);
            if (!result.success) return res.json(new errorResult(409, "Thông tin không hợp lệ.!"));

            var map = req.body;
            let query = {};

            if (map.description) query["description"] = map.description;
            if (map.customer_info) query["customer_info"] = map.customer_info;
            if (map.discount) query["discount"] = map.discount;
            if (map.status) query["status"] = map.status;
            if (map.status_name) query["status_name"] = map.status_name;
            if (map.vat) query["vat"] = map.vat;
            if (map.total_cost_after_discount) query["total_cost_after_discount"] = map.total_cost_after_discount;
            if (map.paid) query["paid"] = map.paid;
            if (map.unpaid) query["unpaid"] = map.unpaid;
            if (map.items) query["items"] = map.items;

            result = await db.collection('Orders').update(
                { _id: orderId }, { $set: query }
            );
            return res.json(new successResult(true, "Chỉnh sửa thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getOrder(req, res) {
        try {
            const keyword = req.query.keyword;
            const skip = parseInt(req.query.skip);
            const limit = parseInt(req.query.limit);
            const _status = parseInt(req.query.status);
            if (skip < 0 || !limit) return res.json(new errorResult(100, "Tham số không hợp lệ.!"));
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            let result = await db.collection('Orders').aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    { order_code: !keyword ? { $exists: true } : new RegExp(keyword, 'i') },
                                    { "customer_info.customer_name": !keyword ? { $exists: true } : new RegExp(keyword, 'i') },
                                    { "customer_info.customer_phone": !keyword ? { $exists: true } : new RegExp(keyword, 'i') },
                                ]
                            }, {
                                status: !_status
                                    ? { $exists: true } : _status
                            }
                        ]
                    }
                }, {
                    $project: {
                        number_item: {
                            $cond: {
                                if:
                                    { $isArray: "$items" },
                                then: { $size: "$items" },
                                else: "NA"
                            }
                        },
                        number_type: {
                            $cond: {
                                if: { $isArray: "$items" }, then: { $size: "$items.type" }, else: "NA"
                            }
                        }, order_code: 1, description: 1,
                        customer_info: 1, discount: 1,
                        vat: 1, total_cost_after_discount: 1, paid: 1,
                        unpaid: 1, status: 1, status_name: 1,

                    }
                }, { $sort: { _id: -1 } }, { $skip: skip }, { $limit: limit }
            ]).toArray();
            let _result = await db.collection('Orders').aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    {
                                        order_code: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        "customer_info.customer_name": !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        "customer_info.customer_phone": !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                ]
                            },
                            {
                                status: !_status
                                    ? { $exists: true } : _status
                            }
                        ]
                    }
                }, {
                    $group: {
                        _id: null,
                        total_amount_order: { $sum: "$total_amount" },
                        total_vat_order: { $sum: "$vat" },
                        total_discount_order: { $sum: "$discount" },
                        total_paid_order: { $sum: "$paid" },
                        total_unpaid_order: { $sum: "$unpaid" },
                        count: { $sum: 1 },
                    }
                }, {
                    $project: { _id: 0, }
                }, {
                    $sort: { _id: -1 }
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }

            ]).toArray();
            var objResult = {
                order: result,
                statistical: _result[0],
            }
            return res.json(new successResult(true, "", objResult));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getDetailOrder(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            const orderId = req.params.id;
            if (!orderId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            //check orderid
            let result;
            result = await orderModel.getOrdeId(orderId);
            if (!result.success) return res.json(new errorResult(409, result.message));

            //get products
            result = await db.collection('Orders').aggregate([
                {
                    $match: {
                        _id: orderId,
                    }
                }
            ]).toArray();
            //result respond

            return res.json(new successResult(true, "", result[0]));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async cancledOrder(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserConnections(token);

            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const orderId = req.params.id;

            if (!orderId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            //check orderid
            result = await orderModel.getOrdeId(orderId);
            if (!result.success) return res.json(new errorResult(409, "Thông tin không hợp lệ.!"));
            if (result.data.status !== 1 || result.data.is_completed || result.data.is_cancled) return res.json(new errorResult(409, "Không thể hủy do đơn hàng đang được thực hiện.!"));
            let query = {
                is_cancled: true,
                status: 5,
                status_name: "Đơn hàng đã hủy",
                canceled_by: _user,
                is_completed: true,
                reason_cancel: req.body.reason_cancel
            };

            result = await db.collection('Orders').update(
                { _id: orderId }, { $set: query }
            );
            return res.json(new successResult(true, "Chỉnh sửa thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async deleteOrder(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserConnections(token);

            var result;

            const orderId = req.params.id;

            if (!orderId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await orderModel.getOrdeId(orderId);
            if (!result.success) return res.json(new errorResult(409, "Thông tin không hợp lệ.!"));

            let query = {
                is_deleted: true,
                reason_delete: req.body.reason_delete,
                delete_by: _user
            };

            result = await db.collection('Orders').update(
                { _id: orderId }, { $set: query }
            );
            return res.json(new successResult(true, "Xóa đơn hàng thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async autoCreateOrder(req, res) {
        const db = await dbConfig.getConnections();
        if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
        const number_order = parseInt(req.query.number_order);
        var _item = [
            {
                "product_id": "5c6b606118d67201c432e148",
                "sku": "SP000012",
                "type": 1,
                "name": "Iphone - đen - 16g",
                "quantity": 10,
                "price": 500000,
                "discount": 20
            }, {
                "product_id": "5c6b606118d67201c432e149",
                "sku": "SP000012",
                "type": 1,
                "name": "Iphone - đen - 64g",
                "quantity": 10,
                "price": 500000,
                "discount": 20
            }
        ]
        for (let index = 0; index < number_order; index++) {

            var result = await db.collection('Orders').insert({
                _id: new mongodb.ObjectId().toString(),
                order_code: `AUTO0000${index}`,
                description: 'auto order',
                customer_info: {
                    customer_id: "5c64f48ccbba4a01ac5c35f5",
                    customer_name: "Hoàng Quốc Việt",
                    customer_phone: "0164894849"
                },
                discount: 0,
                vat: 0,
                total_cost_after_discount: 5000000,
                paid: 2500000,
                unpaid: 2500000,
                items: _item,
                status: 1,
                status_name: "chờ xác nhận",
                create_by: {
                    userName: "vanhaiit",
                    email: "anhem1@gmail.com",
                    userId: "5c64e382d4ddf52238adb320"
                },
                is_completed: false,
                canceled_by: null,
                reason_cancel: null,
                is_cancled: false,
                is_deleted: false,

            });
            _item.forEach(async element => {
                var check = await productOptionsModel.getProdutctOptionsId(element.product_id);
                if (check.data) {
                    var query = {
                        top: check.data.top + 1
                    }
                    let order = await db.collection('ProductOptions').update({ _id: element.product_id }, { $set: query });
                }
            });

        }
        return res.json(new successResult(true, "Tạo thành công", result));

    }

}