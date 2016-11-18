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
	
	/// c#变量对应的值
	mapping: function () {
		this["/Views/mobile/OffcialOtherGame/Index.cshtml"]
			= this["/Views/QuYing/Shared/_OffcialLayout.cshtml"]
			= this["/Views/default/OffcialOtherGame/Index.cshtml"]
			= {
			'@(jsDataFileName)': ["bjpk10", "cqssc", "fc3d", "jsk3", "kl8", "sd11x5"]
		};
		this["/Views/default/OtherGame/Index.cshtml"] = this["/Views/QuYing/OtherGame/Index.cshtml"] = {
			'@(GameConfigID)': ["11X5", "CQK10", "GDK10", "GXK10", "K3", "PK10", "SSC", "SSC-10", "SSC-11", "SSC-9"]
		};
	},
	
	// 根目录
	root: "D:\\dev\\local\\test_for_hash",
	
	/// 入口路径
	entry: ["/Views"],
	
	/// 需要处理的文件后缀名
	exts: [".cshtml"],
	
	/// hash长度，5-32之间，默认16
	hashLen: 10
};