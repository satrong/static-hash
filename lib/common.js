/// <reference path="../typings/index.d.ts" />
// 工具类
const crypto = require("crypto");

/**
 * MD5加密
 * @param {String} str
 */
exports.md5 = function (str) {
    return crypto.createHash("md5").update(str).digest("hex");
}