/// 检查配置文件
let options = require("../config.js");

options.hashLen = options.hashLen ? (options.hashLen < 5 ? 5 : options.hashLen) : 10;


if (!(options.root && typeof options.root === "string")) throw new Error("root参数为必须值，且为字符串");
if (!Array.isArray(options.entries)) throw new Error("entries参数必须为数组");
options.entries.filter((el, index) => {
    if (typeof el === "object") {
        let {entry, exts, type} = el;
        if (typeof entry !== "string") throw new Error(`参数值：entries[${index}].entry必须是字符串`);
        if (!Array.isArray(exts)) throw new Error(`参数值：entries[${index}].exts必须是数组`);
        if (!Array.isArray(type)) throw new Error(`参数值：entries[${index}].type必须是数组`);
    } else {
        throw new Error(`参数值：entries[${index}]必须是对象`);
    }
});


module.exports = options;