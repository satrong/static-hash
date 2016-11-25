/**
 * Created by satro on 11/24/2016.
 */
module.exports = class {
	constructor() {
		
	}
	
	/**
	 * 匹配sourceFile文件中的<script href="url"></script>中的js路径
	 * @param {String} str
	 * @param {Function} callback，
	 *      第一个参数{String}：匹配到的静态资源文件路径；
	 *      第二个参数{Array}：所有匹配到的内容，用于拼凑新的内容
	 *      第三个参数{String}：旧内容
	 * @return {string|XML|*|void}
	 */
	js(str, callback) {
		return str.replace(/<script.+src=[^>]+>\s*<\/script>/ig, replacer => {
			return replacer.replace(/(\ssrc=['"])([^'"]+)(.+)/i, ($0, ...args) => {
				return callback(args[1], args.slice(0, 3), $0);
			});
		});
	}
	
	css(str, callback) {
		return str.replace(/<link[^>]+rel=['"]?stylesheet['"]?[^>]+>/ig, replacer => {
			return replacer.replace(/(\shref=)([^\s]+)(.+)/i, ($0, $1, $2, $3) => {
				$1 += '"';
				$2 = $2.replace(/^['"]/, '').replace(/['"]$/, '');
				$3 = '"' + $3;
				return callback($2, [$1, $2, $3], $0);
			});
		});
	}
	
	image(str, callback) {
		return str.replace(/background(-image)?\s*:[^;}]+/ig, replacer => {
			return replacer.replace(/(url\(['"]?)([^'")]+)(['"]?\))/ig, ($0, ...args) => {
				return callback(args[1], args.slice(0, 3), $0);
			});
		});
	}
};