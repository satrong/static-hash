const cp = require("child_process");
const readline = require('readline');
const repl = require('repl');

function showDot(txt) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0, null);
    process.stdout.write(txt);
}
let len = 0, t = Date.now();
let f = setInterval(() => {
    showDot(`执行中${'.'.repeat(len++)}`);
    len = len === 4 ? 0 : len;
}, 500);

let child = cp.fork(`${__dirname}/lib/AutoAddHash.js`);

child.on("message", data => {
    clearInterval(f);
    repl.start({
        prompt: `已修改${data.success}处，未变化${data.noChange}处，错误日志请查看error.log文件，耗时${((Date.now()-t)/1000).toFixed(2)-0}s\n按Enter键可退出`, eval: function () {
            process.exit();
        }
    });
});