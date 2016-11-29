/// 压缩工具
const fs = require("fs");
const UglifyJS = require("uglify-js");
const common = require("./common");

module.exports = class {
	constructor(options) {
		if (options.compressSuffix !== false) {
			options.compressSuffix = String(options.compressSuffix) || "___";
		}
		this.options = options;
	}
	
	js(filePath) {
		let options = this.options;
		let result = UglifyJS.minify(filePath);
		let md5 = common.md5(result.code);
		let minFilePath;
		if (options.compressSuffix === false) {
			minFilePath = filePath;
		} else {
			minFilePath = filePath.replace(/\.js$/i, `.${options.compressSuffix}.js`);
		}
		fs.writeFileSync(minFilePath, result.code, "utf8");
		return md5;
	}
	
	css(filePath) {
		return filePath;
	}
	
	image(filePath) {
		return filePath;
	}
};