# static-hash
获取HTML中引用的静态文件的md5值作为hash

# 例子
Before:
```html
<html>
	<head>
		<link rel="stylesheet" href="/css/jquery.ui.css" />
		<script src="/Scripts/jquery.js"></script>
	
```

After:
```html
<html>
	<head>
		<link rel="stylesheet" href="/css/jquery.ui.css?8edcd61e50" />
		<script src="/Scripts/jquery.js?78b9bba0bc"></script>
		
```
