// "use strict";
const successResult = require('./../utilities/successResult');
const errorResult = require('./../utilities/errorResult');
const dbConfig = require('./../utilities/dbConfig');
const mongodb = require("mongodb");
const productsModel = require('./../models/produtcts.model')

module.exports = class {

    static async createProducts(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserSendRequire(token);
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            var result;
            const ID = new mongodb.ObjectId().toString();
            const _sku = req.body.sku;
            const _name = req.body.name;
            //verify sku
            result = await productsModel.getSkuProdutcts(_sku);
            if (!result.success) return res.json(new errorResult(409, "Mã SKU đã tồn tại.!"));

            if (!_sku || !_name) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await db.collection('Products').insert({
                _id: ID,
                brand: req.body.brand,
                categoryid: req.body.categoryid,
                name: _name,
                type: 1,
                description: req.body.description,
                source: req.body.source,
                images: req.body.images,
                is_deleted: false,
                create_by: _user,
                reason_detlete: null,
                delete_by: null,
                design_option: req.body.design_option
            });
            var itemOption = req.body.product_option;
            itemOption.forEach(async element => {
                var str = element.name;
                str = str.toLowerCase();
                str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
                str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
                str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
                str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
                str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
                str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
                str = str.replace(/đ/g, "d");
                str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
                str = str.replace(/ + /g, " ");
                str = str.replace(/ /g, '');
                str = str.trim().toUpperCase();;
                result = await db.collection('ProductOptions').insert({
                    _id: new mongodb.ObjectId().toString(),
                    product_id: ID,
                    sku: _sku + str,
                    name: _name + " - " + element.name,
                    nature: element.nature,
                    quantity: element.quantity,
                    categoryid: req.body.categoryid,
                    price: element.price,
                    import_price: element.import_price,
                    images: element.images,
                    discount_value: element.discount_value,
                    brand: req.body.brand,
                    type: req.body.type,
                    is_deleted: false,
                    create_by: _user,
                    reason_detlete: null,
                    delete_by: null,
                    top: 0
                });
            });

            return res.json(new successResult(true, "Tạo thành công", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async updateProducts(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const productsId = req.params.id;

            if (!productsId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await productsModel.getProdutctsId(productsId);
            if (!result.success) return res.json(new errorResult(417, result.message));

            var map = req.body;
            let query = {};
            if (map.brand) query["brand"] = map.brand;
            if (map.categoryid) query["categoryid"] = map.categoryid;
            if (map.name) query["name"] = map.name;
            if (map.type) query["type"] = map.type;
            if (map.quantity) query["quantity"] = map.quantity;
            if (map.price) query["price"] = map.price;
            if (map.import_price) query["import_price"] = map.import_price;
            if (map.description) query["description"] = map.description;
            if (map.source) query["source"] = map.source;
            if (map.images) query["images"] = map.images;
            if (map.discount_value) query["discount_value"] = map.discount_value;

            result = await db.collection('Products').update(
                { _id: productsId }, { $set: query }
            );
            return res.json(new successResult(true, "Chỉnh sửa thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getProducts(req, res) {
        try {
            const keyword = req.query.keyword;
            const skip = parseInt(req.query.skip);
            const limit = parseInt(req.query.limit);
            const _categoryid = req.query.categoryid;
            const _brand = req.query.brand;
            const _type = parseInt(req.query.type);
            if (skip < 0 || !limit) return res.json(new errorResult(100, "Tham số không hợp lệ.!"));
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            let result = await db.collection('Products').aggregate([
                {
                    $lookup:
                    {
                        from: 'ProductOptions',
                        localField: '_id',
                        foreignField: 'product_id',
                        as: 'produc_options'
                    }
                }, {
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
                                        source: !keyword
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
                            },
                            {
                                type: !_type
                                    ? { $exists: true } : _type
                            }

                        ]
                    }
                }, {
                    $project: {
                        is_deleted: 0,
                        delete_by: 0,
                        reason_detlete: 0,
                        design_option: 0,
                        "produc_options.product_id": 0,
                        "produc_options.nature": 0,
                        "produc_options.create_by": 0,
                        "produc_options.reason_detlete": 0,
                        "produc_options.delete_by": 0,
                        "produc_options.is_deleted": 0,

                    }
                }, { $sort: { _id: -1 } }, { $skip: skip }, { $limit: limit }
            ]).toArray();

            return res.json(new successResult(true, "", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async getDetailProducts(req, res) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));
            const productsId = req.params.id;

            if (!productsId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));
            let result;

            result = await productsModel.getProdutctsId(productsId);
            if (!result.success) return res.json(new errorResult(417, result.message));
            //get products
            result = await db.collection('Products').aggregate([
                {
                    $match: {
                        _id: productsId,
                    }
                }
            ]).toArray();

            return res.json(new successResult(true, "", result[0]));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

    static async deleteProducts(req, res) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const _user = await dbConfig.getUserSendRequire(token);
            const db = await dbConfig.getConnections();
            if (!db) return res.json(new errorResult(429, "Hệ thống đang quá tải.!"));

            var result;

            const productsId = req.params.id;

            if (!productsId) return res.json(new errorResult(417, "Tham số không hợp lệ .!"));

            result = await productsModel.getProdutctsId(productsId);
            if (!result.success) return res.json(new errorResult(417, result.message));
            if (result.data.is_deleted) return res.json(new errorResult(417, "Sản phẩm đã được xóa trước đó.!"));

            if (!req.body.reason_detlete) return res.json(new errorResult(417, "Vui lòng nhập lý gio.!"));

            let query = {
                reason_detlete: req.body.reason_detlete,
                delete_by: _user,
                is_deleted: true

            };

            result = await db.collection('Products').update(
                { _id: productsId }, { $set: query }
            );
            return res.json(new successResult(true, "Xóa thành công.!", result));

        } catch (ex) {
            return res.json(new errorResult(500, "Có lỗi xảy ra. Xin vui lòng thử lại.!"));
        }
    }

}