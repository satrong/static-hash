/**
 * Created by satro on 11/18/2016.
 */
const path = require("path");
const fs = require("fs");

const ROOT = "D:\\dev\\local\\test_for_hash";

let pcMappingDir = [], mbMappingDir = [];
fs.readdirSync(path.join(ROOT, "/content/mapping")).forEach(item => /^mobile-/i.test(item) ? mbMappingDir.push(item) : pcMappingDir.push(item));
pcMappingDir = pcMappingDir.filter(item => !/^quying$/i.test(item)); // 过滤掉趣赢


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
			= this["/Views/mobile/OffcialOtherGame/Index.cshtml"]
			= {
			'@(jsDataFileName)': ["bjpk10", "cqssc", "fc3d", "jsk3", "kl8", "sd11x5"]
		};
		
		this["/Views/default/OtherGame/Index.cshtml"] = this["/Views/QuYing/OtherGame/Index.cshtml"] = {
			'@(GameConfigID)': ["11X5", "CQK10", "GDK10", "GXK10", "K3", "PK10", "SSC", "SSC-10", "SSC-11", "SSC-9"]
		};
		
		this["/Views/mobile/OffcialOtherGame/Index.cshtml"] = {
			'@ViewData["directory"]': ["mobile"]
		};
	},
	
	/// 共用的c#变量对应值（如果在mapping中没找到则会到commonMapping中寻找）
	/// filePath {String} 源码文件路径
	commonMapping: function (filePath, _var) {
		let arr = filePath.split(path.sep), directory;
		let filePathStr = arr.join("|").toLowerCase(); /// windows文件路径中的 \ 不好处理，所以换 | 替代
		if (_var === '@(ViewData["css"])') _var = '@ViewData["css"]';
		
		/// 处理views/home文件夹下的文件
		if (/\|views\|home\|\w+\|\w+\.cshtml/i.test(filePathStr) && _var === '@ViewData["css"]') {
			return pcMappingDir;
		}

		directory = filePathStr.match(/\|views\|(\w+)\|/i)[1];
		
		
		return {
			'@ViewData["directory"]': [directory],
			'@ViewData["css"]': {
				"default": pcMappingDir,
				"mobile": mbMappingDir,
				"pc-home-all": pcMappingDir
			}[directory]
		}[_var];
	},
	
	// 根目录
	root: ROOT,
	
	/// 入口路径
	entry: ["/Views"],
	
	/// 需要处理的文件后缀名
	exts: [".cshtml"],
	
	/// hash长度，5-32之间，默认16
	hashLen: 10
};