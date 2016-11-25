/**
 * Created by satro on 11/18/2016.
 */
module.exports = {
	/// 用于过滤文件路径中一些字符串
	filter: function (str) {
		return str.replace(/^~/, "").replace(/^@\(?[^\)\/]+\)?/, '');
	},
	
	/// 获取路径中相应的c#变量
	getVars: /@\(?[^\)\/]+\)?/g,
	
	// 根目录
	root: "D:\\dev\\local\\test_for_hash",
	
	/// 入口路径
	entries: [
		{
			/// 处理.cshtml文件中的js和css文件
			entry: "/Views", /// 入口路径
			exts: [".cshtml"], /// 需要处理的文件后缀名
			type: ["js", "css"] /// js=>script[href]标签, css=>link[rel=stylesheet]标签
		}/*,
		{
			/// 处理css文件中的图片
			entry: "/Content",
			exts: [".css"],
		    type: ["image"]
		}*/
	],
	
	/// hash长度，5-32之间，默认16
	hashLen: 10
};