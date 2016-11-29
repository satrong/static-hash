/// 读取目录所有文件的内容
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const common = require("./common");
const glob = require("glob");
const chalk = require('chalk');
const replacer = new (require("./replacer"));
let options = require("./checkConfig");
const compressor = new (require("./compressor"))(options);

/**
 * 注意：代码中提到的
 *      sourceFile即源码文件
 *      targetFile即静态资源文件
 *
 */

module.exports = class {
	constructor() {
		this.$options = options;
		this.root = options.root;
		this.hashLen = options.hashLen;
		
		/// 缓存已获取的文件的md5值 {path:md5}
		this.cache = {};
		
		/// 存储错误信息
		this.errors = [];
		
		/// 统计信息
		this.total = {
			success: 0,
			noChange: 0
		};
		
		/// 存储静态资源目录结构(格式：/a/*/*.js => [/a/b/c.js, /a/d/e.js])
		this.pathTofiles = {};
		
		/// 记录sourceFile文件是否已做替换
		this.recordIsReplaced = {};
		
		this.sepLine = "- ".repeat(30);
	}
	
	/**
	 * 显示控制台日志
	 * @param {String} type 显示的颜色值，如果不需要颜色可以传null或者空字符串
	 * @param args
	 */
	log(type, ...args) {
		if (type) {
			console.log(chalk[type].apply(chalk, args));
		} else {
			console.log.apply(console, args);
		}
	}
	
	/**
	 * 开始执行
	 * @memberOf exports
	 */
	start() {
		let options = this.$options;
		
		options.entries.forEach(el => {
			this.getFiles(path.join(options.root, el.entry), el.exts, el.type);
		});
		this.log("yellow", `已修改${this.total.success}处，未变化${this.total.noChange}处，错误${this.errors.length}处，错误日志请查看error.log文件`);
	}
	
	/**
	 * 读取dir目录下所有的后缀为extensions文件
	 * @param {String} dir
	 * @param {Array} extensions
	 * @param {Array} type 需要处理的静态资源文件路径
	 */
	getFiles(dir, extensions, type) {
		let that = this;
		(function walk(_dir) {
			try {
				let stats = fs.statSync(_dir);
				if (stats.isFile()) {
					if (extensions.indexOf(path.parse(_dir).ext) > -1) {
						that.replace(_dir, type);
					}
				} else if (stats.isDirectory()) {
					let files = fs.readdirSync(_dir);
					files.forEach(filename => {
						walk(path.join(_dir, filename));
					});
				}
			} catch (err) {
				that.log("red", err);
			}
		})(dir);
		
		try {
			fs.writeFileSync("./error.log", this.errors.join("\r\n"), "utf8");
		} catch (err) {
			this.log("red", err);
		}
	}
	
	/**
	 *
	 * 添加hash
	 * @param {String} sourceFile
	 * @param {Array} type
	 * @memberOf exports
	 */
	replace(sourceFile, type) {
		let content = fs.readFileSync(sourceFile, "utf8"), newContent = content;
		type.forEach(el => {
			newContent = replacer[el](newContent, (...args) => {
				args.unshift(sourceFile);
				return this.addHash.apply(this, args);
			});
		});
		
		/// 避免sourceFile文件中没有匹配到静态资源文件路径而导致控制台显示很多this.sepLine
		if (!this.recordIsReplaced[sourceFile.toLowerCase()]) return;
		
		if (content !== newContent) {
			try {
				fs.writeFileSync(sourceFile, newContent, "utf8");
			} catch (err) {
				this.log("red", err.message);
			}
		}
		this.log("gray", this.sepLine);
	}
	
	/**
	 * 添加hash
	 * @param {String} sourceFile 原始文件
	 * @param {String} targetFile 匹配到的静态资源文件的路径
	 * @param {Array} args        所有匹配到的部分
	 * @param {String} partialCode 静态资源文件所在html标签(部分)
	 * @return {String}
	 * @memberOf exports
	 */
	addHash(sourceFile, targetFile, args, partialCode) {
		let lowerCaseSourceFile = sourceFile.toLowerCase();
		if (!this.recordIsReplaced[lowerCaseSourceFile]) {
			this.log(null, sourceFile);
			this.recordIsReplaced[lowerCaseSourceFile] = 1;
		}
		targetFile = targetFile.replace(`.${options.compressSuffix}.`, '.'); /// 还原源文件路径
		targetFile = this.remove_qs_mark(targetFile); // 去掉路径中的问号即后面的内容
		let urls = this.resolvePath(targetFile, sourceFile);
		let md5s = [];
		
		if (urls.length === 0) {
			let notMath = `${sourceFile}\n  => ${targetFile}没有匹配到文件\n------------------------------`;
			this.errors.push(notMath);
			this.log("red", notMath);
		}
		urls.forEach(item => {
			let lowercaseItem = item.toLowerCase();
			try {
				if (this.cache[lowercaseItem]) {
					md5s.push(this.cache[lowercaseItem]);
				} else {
					let _md5 = this.getVersion(item);
					this.cache[lowercaseItem] = _md5;
					md5s.push(_md5);
				}
			} catch (err) {
				this.log("red", `  ${item}文件不存在`);
				this.errors.push(`${sourceFile}\n  => ${item}文件不存在\n------------------------------`);
			}
		});
		if (md5s.length > 0) {
			let hashIsMd5 = options.hashType === "md5", minFilePath;
			if (!hashIsMd5) {
				md5s.sort((x, y) => x - y < 0);
			}
			let ext = targetFile.match(/\.([a-z]+)$/i)[1];
			if (options.compress[ext]) {
				minFilePath = options.compressSuffix === false ? targetFile : targetFile.replace(/\.js$/i, `.${options.compressSuffix}.js`);
			} else {
				minFilePath = targetFile;
			}
			
			args[1] = minFilePath + "?" + (hashIsMd5 ? common.md5(md5s.join()).slice(0, this.hashLen) : md5s[0]);
		}
		let newPartialCode = args.join('');
		this.log(null, '  ', partialCode);
		
		// 没有变化为灰色，有变化为绿色
		if (partialCode === newPartialCode) {
			this.total.noChange++;
			this.log("gray", "     =>", newPartialCode);
		} else {
			this.total.success++;
			this.log("green", "     =>", newPartialCode);
		}
		
		return newPartialCode;
	}
	
	/**
	 * 解析路径
	 * @param {String} targetFile
	 * @param {String} sourceFile
	 * @memberOf exports
	 * @return {Array} 返回解析后的路径
	 */
	resolvePath(targetFile, sourceFile) {
		let options = this.$options;
		targetFile = options.filter(targetFile);
		targetFile = targetFile.replace(options.getVars, "*"); /// 将变量替换成 *
		
		/// 相对路径
		if (!/^\//.test(targetFile)) {
			targetFile = path.join(path.parse(sourceFile).dir, targetFile);
		}
		/// 绝对路径
		else {
			targetFile = path.join(options.root, targetFile);
		}
		
		let files;
		if (targetFile.indexOf("*") === -1) {
			files = [targetFile];
		} else if (this.pathTofiles[targetFile]) {
			files = this.pathTofiles[targetFile];
		} else {
			files = glob.sync(targetFile, {nocase: false});
			this.pathTofiles[targetFile] = files;
		}
		return files;
	}
	
	/**
	 * 获取版本号
	 * @param {String} filePath 静态资源文件路径
	 * @return {String}
	 */
	getVersion(filePath) {
		let hashType = this.$options.hashType;
		let ext = filePath.match(/\.([a-z]+)$/i)[1];
		let imagesExt = ["png", "gif", "jpg", "jpeg", "bmp"];
		
		if (imagesExt.indexOf(ext) > -1) ext = "image";
		
		let isTime = /^(time)|(date)$/i.test(hashType), stats;
		
		if (isTime) {
			stats = fs.statSync(filePath);
		}
		
		if (this.$options.compress[ext] && ["js", "css", "image"].indexOf(ext) > -1) {
			let md5 = compressor[ext](filePath);
			return isTime ? this.formatDate(stats.mtime) : md5;
		} else {
			return isTime ? this.formatDate(stats.mtime) : common.md5(fs.readFileSync(filePath));
		}
	}
	
	formatDate(t) {
		function padLeft(s) {
			return String('00' + s).slice(-2);
		}
		
		let date = new Date(t);
		let y = date.getFullYear();
		let M = padLeft(date.getMonth() + 1);
		let d = padLeft(date.getDate());
		let h = padLeft(date.getHours());
		let m = padLeft(date.getMinutes());
		let s = padLeft(date.getSeconds());
		return ({time: 'yMdhms', date: 'yMd'}[this.$options.hashType])
			.replace(/y+/, y)
			.replace(/d+/, d)
			.replace(/h+/, h)
			.replace(/m+/, m)
			.replace(/M+/, M)
			.replace(/s+/, s);
	}
	
	/**
	 * 删除路径中的问号及后面内容
	 *
	 * @param {String} filePath
	 * @memberOf exports
	 */
	remove_qs_mark(filePath) {
		return filePath.replace(/(\.[a-z]{2,4})\?.*$/i, '$1')
	}
};
