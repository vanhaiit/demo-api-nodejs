// "use strict";
const successResult = require('../utilities/successResult');
const errorResult = require('../utilities/errorResult');
const dbConfig = require('../utilities/dbConfig');
const productOptionsModel = require('../models/productOptions.model')

module.exports = class {

    static async updateProductsOptions(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const Id = req.params.id;

            if (!Id) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await productOptionsModel.getProdutctOptionsId(Id);
            if (!result.success) return res.json(new errorResult(417, result.message));

            var map = req.body;
            let query = {};
            if (map.sku) query["sku"] = map.sku;
            if (map.name) query["name"] = map.name;
            if (map.quantity) query["quantity"] = map.quantity;
            if (map.price) query["price"] = map.price;
            if (map.import_price) query["import_price"] = map.import_price;
            if (map.images) query["images"] = map.images;
            if (map.discount_value) query["discount_value"] = map.discount_value;
            if (map.brand) query["brand"] = map.brand;
            result = await db.collection('ProductOptions').update(
                { _id: Id }, { $set: query }
            );
            return res.json(new successResult(true, "Chỉnh sửa thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getProductsOptions(req, res) {
        try {
            const keyword = req.query.keyword;
            const skip = parseInt(req.query.skip);
            const limit = parseInt(req.query.limit);
            const _categoryid = req.query.categoryid;
            const _brand = req.query.brand;
            if (skip < 0 || !limit) return res.json(new errorResult(100, "Tham số không hợp lệ.!"));
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            let result = await db.collection('ProductOptions').aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    {
                                        sku: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        name: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        "create_by.userName": !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    }
                                ]
                            },
                            {
                                categoryid: !_categoryid
                                    ? { $exists: true } : _categoryid
                            },
                            {
                                brand: !_brand
                                    ? { $exists: true } : _brand
                            }
                        ]
                    }
                }, {
                    $project: {
                        is_deleted: 0,
                        delete_by: 0,
                        reason_detlete: 0,
                        product_id: 0,
                        nature: 0
                    }
                }, { $sort: { _id: -1 } }, { $skip: skip }, { $limit: limit }
            ]).toArray();

            return res.json(new successResult(true, "", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getDetailProductsOptions(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            const ID = req.params.id;

            if (!ID) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            let result;

            result = await productOptionsModel.getProdutctOptionsId(ID);
            if (!result.success) return res.json(new errorResult(417, result.message));
            //get products
            result = await db.collection('ProductOptions').aggregate([
                {
                    $match: {
                        _id: ID,
                    }
                }
            ]).toArray();

            return res.json(new successResult(true, "", result[0]));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getTop10ProductOptions(req, res) {
        try {
            const keyword = req.query.keyword;
            const skip = parseInt(req.query.skip);
            const limit = parseInt(req.query.limit);;
            const _categoryid = req.query.categoryid;
            const _brand = req.query.brand;
            if (skip < 0 || !limit) return res.json(new errorResult(100, "Tham số không hợp lệ.!"));
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            let result = await db.collection('ProductOptions').aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    {
                                        sku: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        name: !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    },
                                    {
                                        "create_by.userName": !keyword
                                            ? { $exists: true } : new RegExp(keyword, 'i')
                                    }
                                ]
                            },
                            {
                                categoryid: !_categoryid
                                    ? { $exists: true } : _categoryid
                            },
                            {
                                brand: !_brand
                                    ? { $exists: true } : _brand
                            }
                        ]
                    }
                }, {
                    $project: {
                        is_deleted: 0,
                        delete_by: 0,
                        reason_detlete: 0,
                        product_id: 0,
                        nature: 0
                    }
                }, { $sort: { top: -1 } }, { $skip: skip }, { $limit: limit }
            ]).toArray();

            return res.json(new successResult(true, "", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

}