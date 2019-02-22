"use strict"
const dbConfig = require('./../utilities/dbConfig');

module.exports = class {



    static async getProdutctOptionsId(id) {
        try {
            const db = await dbConfig.getConnections();
            if (!db) return { success: false, code: 429, message: "Hệ thống đang quá tải. Vui lòng thử lại sau ít phút.!" }

            const result = await db.collection('ProductOptions').find({
                $and: [
                    { _id: id }
                ]
            }).toArray();
            if (result.length == 0) return { success: false, code: 404, message: "Sản phẩm này không tồn tại.!" };
            return { success: true, data: result[0] };
        } catch (ex) {
            return { success: false, code: 500, message: "Có lỗi xảy ra. Xin vui lòng thử lại.!" }
        }
    }

}