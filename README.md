自动为HTML文件中的js文件、css文件以及行内样式、内嵌样式、外部样式（css文件）中的背景图片添加hash。

# 使用方法
1. 下载代码
2. 执行`npm install`安装依赖包（前提你已经安装了node和npm）
3. 执行`npm start`或者`node index.js`

# 配置 
自定义配置全部在`./config.js`文件中
- **root**：{`String`}（必须值）需要自动添加hash项目的根目录，所有的文件都会在该目录下；
- **entries**：{`ArrayObject`} （必须值） 需要处理的文件的入口
    - **entry**：{`String`} 入口文件夹路径。如：`/views`
    - **exts**：{`Array`} entry目录下所有的后缀名在exts数组中的文件。如：`['.html']`
    - **type**：{Array} 需要处理的静态文件。可用值：`js`处理exts文件中的src标签上的href上的地址；`css`处理exts文件中的link[rel=stylesheet]标签上的href上的地址；`image`处理exts文件中的样式里面的图片地址；
- **filter**：{`Function`} （可选值） 过滤匹配到的静态文件路径中的一些字符串，函数第一个参数会接收匹配到的路径，必须`return`过滤后的路径
- **getVars**：{`RegExp`} （可选值） 如果静态文件路径中含有一些服务端语言的变量，需要通过此正则匹配出该服务端语言的变量。如：路径为`/public/@(ViewBag.skin)/home.js`，则该正则可为：`/@\(?[^\)\/]+\)?/g`
- **hashLen**：{`Number`} （可选值） 默认为`10`，取值范围为`5`到`32`

# 例子
Before:
```html
<html>
	<head>
		<link rel="stylesheet" href="/css/jquery.ui.css" />
		<script src="/Scripts/jquery.js"></script>
		<style>
		body{background:url('./bg.png');}
		</style>
	
```

After:
```html
<html>
	<head>
		<link rel="stylesheet" href="/css/jquery.ui.css?8edcd61e50" />
		<script src="/Scripts/jquery.js?78b9bba0bc"></script>
		<style>
        body{background:url('./bg.png?ae7e700648');}
        </style>
```
