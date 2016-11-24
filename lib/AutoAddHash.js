/// 读取目录所有文件的内容
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const common = require("./common");
const color = require("./color");

module.exports = class {
	/**
	 * @param {Object} options
	 */
	constructor(options) {
		this.$options = options;
		this.root = options.root;
		this.hashLen = options.hashLen ? (options.hashLen < 5 ? 5 : options.hashLen) : 16;
		let mapping = typeof options.mapping === "function" ? new options.mapping : options.mapping;
		this.mapping = {};
		Object.keys(mapping).forEach(item => {
			let fullPath = path.join(this.root, item).toLowerCase();
			this.mapping[fullPath] = mapping[item];
		});
		
		/// 缓存已获取的文件的md5值 {path:md5}
		this.cache = {};
		
		/// 存储错误信息
		this.errors = [];
		
		/// 统计信息
		this.total = {
			success: 0,
			noChange: 0
		};
		
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
		let urls = this.resolvePath(targetFile, sourceFile);
		let md5s = [];
		urls.forEach(el => {
			let item = path.join(this.root, el);
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
			args[1] = this.remove_qs_mark(targetFile) + "?" + this.md5(md5s.join()).slice(0, this.hashLen);
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
	 * @param {String} sourceFile
	 * @memberOf exports
	 * @return {Array} 返回解析后的路径
	 */
	resolvePath(targetFile, sourceFile) {
		let options = this.$options, that = this, result = [], formatSourceFile = path.normalize(sourceFile).toLowerCase();
		targetFile = options.filter(targetFile);
		let vars = targetFile.match(options.getVars) || [];
		
		if (vars.length > 0) {
			(function walk(index, arr) {
				if (sourceFile.indexOf("AgainLogin") > -1) {
					console.log
				}
				
				let _mapping = that.mapping[formatSourceFile], _err, _var;
				
				if (!_mapping) {
					/// 在mapping里面没找到再到commonMapping里面找
					_var = options.commonMapping(formatSourceFile, vars[index]);
					
					if(!_var){
						_err = `${sourceFile} 没有对该文件的变量做映射 ${vars.join('、')}\n------------------------------`;
						that.errors.indexOf(_err) === -1 && that.errors.push(_err);
						return color.orange(_err);
					}
				}else{
					/// 在mapping里面有做变量映射则再去找相应的变量映射值
					_var = _mapping[vars[index]];
					
					/// 已对该文件的变量做映射，但某些变量并没有找到映射，则同样再去commonMapping里面找
					if(!_var){
						_var = options.commonMapping(formatSourceFile, vars[index]);
					}
					
					if (!_var) {
						_err = `${sourceFile}中的变量${vars[index]}没有做映射\n------------------------------`;
						that.errors.push(_err);
						return color.cyan(_err);
					}
				}
				
				for (let i = 0, len = _var.length; i < len; i++) {
					let _arr = arr.concat(_var[i]);
					if (index + 1 < vars.length) {
						walk(index + 1, _arr);
					} else {
						let _temp = targetFile;
						vars.forEach((item, j) => {
							_temp = _temp.replace(item, _arr[j]);
						});
						result.push(that.remove_qs_mark(_temp));
					}
				}
			})(0, []);
		} else {
			result.push(this.remove_qs_mark(targetFile));
		}
		
		return result;
	}
	
	/**
	 * 删除问号及后面内容
	 *
	 * @param {String} filePath
	 * @memberOf exports
	 */
	remove_qs_mark(filePath) {
		return filePath.replace(/(\.[a-z]{2,4})\?.*$/i, '$1')
	}
};
