/*
 Black        0;30     Dark Gray     1;30
 Red          0;31     Light Red     1;31
 Green        0;32     Light Green   1;32
 Brown/Orange 0;33     Yellow        1;33
 Blue         0;34     Light Blue    1;34
 Purple       0;35     Light Purple  1;35
 Cyan         0;36     Light Cyan    1;36
 Light Gray   0;37     White         1;37
 */

let colorsMapping = {
	"black": "0;30",
	"red": "0;31",
	"green": "0;32",
	"orange": "0;33",
	"blue": "0;34",
	"purple": "0;35",
	"cyan": "0;36",
	"gray": "1;30"
};

let reset = "\033[0m";
const Color = {};

Object.keys(colorsMapping).forEach(item=> {
	Color[item] = function () {
		return setColor(colorsMapping[item], arguments);
	}
});

function setColor(color, _args) {
	var args = [].slice.call(_args);
	args.unshift('\033[' + color + 'm');
	args.push(reset);
	console.log.apply(console, args);
}

module.exports = Color;