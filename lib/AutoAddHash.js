/// 读取目录所有文件的内容
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const common = require("./common");
const color = require("./color");
const glob = require("glob");

module.exports = class {
	/**
	 * @param {Object} options
	 */
	constructor(options) {
		this.$options = options;
		this.root = options.root;
		this.hashLen = options.hashLen ? (options.hashLen < 5 ? 5 : options.hashLen) : 16;
		
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
		
		this.sepLine = "- ".repeat(30);
	}
	
	/**
	 * 开始执行
	 * @memberOf exports
	 */
	start() {
		let options = this.$options;
		console.time("a");
		let entries = Array.isArray(options.entry) ? options.entry : [options.entry];
		entries.forEach(item => {
			this.getFiles(path.join(options.root, item), options.exts);
		});
		color.orange(`已修改${this.total.success}处，未变化${this.total.noChange}处，错误${this.errors.length}处，错误日志请查看error.log文件`);
		console.timeEnd("a");
	}
	
	/**
	 * md5加密
	 * @param {String} str
	 * @returns {Buffer|string}
	 */
	md5(str) {
		return crypto.createHash("md5").update(str).digest("hex");
	}
	
	/**
	 * 读取dir目录下所有的后缀为extensions文件
	 * @param {String} dir
	 * @param {Array} extensions
	 */
	getFiles(dir, extensions) {
		let that = this;
		(function walk(_dir) {
			try {
				let stats = fs.statSync(_dir);
				if (stats.isFile()) {
					if (extensions.indexOf(path.parse(_dir).ext) > -1) {
						that.replace(_dir);
					}
				} else if (stats.isDirectory()) {
					let files = fs.readdirSync(_dir);
					files.forEach(filename => {
						walk(path.join(_dir, filename));
					});
				}
			} catch (err) {
				color.red(err);
			}
		})(dir);
		
		try {
			fs.writeFileSync("./error.log", this.errors.join("\r\n"), "utf8");
		} catch (err) {
			color.red("生成错误日志文件失败", err);
		}
	}
	
	/**
	 *
	 * 添加hash
	 * @param {String} filePath
	 * @memberOf exports
	 */
	replace(filePath) {
		let content = fs.readFileSync(filePath, "utf8");
		let count = 0;
		let newContent = content.replace(/<script.+src=[^>]+>\s*<\/script>/ig, replacer => {
			if (count === 0) console.log(filePath);
			++count;
			return replacer.replace(/(\ssrc=['"])([^'"]+)(.+)/i, ($0, $1, $2, $3) => {
				return this.addHash($2, filePath, [$1, $2, $3], $0);
			});
		}).replace(/<link[^>]+rel=['"]stylesheet['"][^>]+>/ig, replacer => {
			if (count === 0) console.log(filePath);
			++count;
			return replacer.replace(/(\shref=)([^\s]+)(.+)/i, ($0, $1, $2, $3) => {
				$1 += '"';
				$2 = $2.replace(/^['"]/, '').replace(/['"]$/, '');
				$3 = '"' + $3;
				return this.addHash($2, filePath, [$1, $2, $3], $0);
			});
		});
		
		if (count === 0) return;
		
		if (content !== newContent) {
			try {
				fs.writeFileSync(filePath, newContent, "utf8");
			} catch (err) {
				color.red(err.message);
			}
		}
		color.gray(this.sepLine);
	}
	
	/**
	 * 添加hash
	 * @param {String} targetFile 匹配到的静态资源文件的路径
	 * @param {String} sourceFile 原始文件
	 * @param {Array} args        所有匹配到的部分
	 * @param {String} partialCode 静态资源文件所在html标签(部分)
	 * @return {String}
	 * @memberOf exports
	 */
	addHash(targetFile, sourceFile, args, partialCode) {
		targetFile = this.remove_qs_mark(targetFile); // 去掉路径中的问号即后面的内容
		let urls = this.resolvePath(targetFile);
		let md5s = [];
		urls.forEach(item => {
			try {
				if (this.cache[item]) {
					md5s.push(this.cache[item]);
				} else {
					let _md5 = this.md5(fs.readFileSync(item, "utf8"));
					this.cache[item] = _md5;
					md5s.push(_md5);
				}
			} catch (err) {
				color.red(`  ${item}文件不存在`);
				this.errors.push(`${sourceFile}\n  => ${item}文件不存在\n------------------------------`);
			}
		});
		if (md5s.length > 0) {
			args[1] = targetFile + "?" + this.md5(md5s.join()).slice(0, this.hashLen);
		}
		let newPartialCode = args.join('');
		console.log('  ', partialCode);
		
		// 没有变化为灰色，有变化为绿色
		if (partialCode === newPartialCode) {
			this.total.noChange++;
			color.gray("     =>", newPartialCode);
		} else {
			this.total.success++;
			color.green("     =>", newPartialCode);
		}
		
		return newPartialCode;
	}
	
	/**
	 * 解析路径
	 * @param {String} targetFile
	 * @memberOf exports
	 * @return {Array} 返回解析后的路径
	 */
	resolvePath(targetFile) {
		let options = this.$options;
		targetFile = options.filter(targetFile);
		targetFile = targetFile.replace(options.getVars, "*"); /// 将变量替换成 *
		targetFile = path.join(options.root, targetFile).toLowerCase();
		
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
	 * 删除路径中的问号及后面内容
	 *
	 * @param {String} filePath
	 * @memberOf exports
	 */
	remove_qs_mark(filePath) {
		return filePath.replace(/(\.[a-z]{2,4})\?.*$/i, '$1')
	}
};
