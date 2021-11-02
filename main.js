"use strict";
const fs = require("fs");
const readline = require("readline");
const path = require("path");
// const iconv = require("iconv-lite");
console.log(`==========================================================
==================  necessary↓condition  ================
==================    File Suffix: srt    ================
==================  Coding format: utf-8  ================
==========================================================`);
let filePath = "text";
// 初始化进程对象;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// 查看文件是否存在
const question = () => {
  let flag = false;
  return new Promise((resolve, reject) => {
    rl.setPrompt("Please enter a file name: \n");
    rl.prompt();
    rl.on("line", function (line) {
      if (flag) return;
      if (!line.includes(".srt")) line += ".srt";
      filePath = line;
      fs.access("./subtitle/" + filePath, function (err) {
        if (err) console.log("File not found, Please re-enter: ");
        else {
          flag = true;
          resolve();
        }
      });
    });
  });
};
const main = async () => {
  const res = await question();
  readFiles();
};
main();
// readFiles();
// 读取文件内容
function readFiles() {
  fs.readFile("./subtitle/" + filePath, "utf8", function (err, data) {
    if (err) return console.log("read file error");
    const arr = [];
    let text = "";
    let old = "";
    let flag = true;
    let first = true;
    let obj = {
      content: [],
    };
    //   console.log(data);
    for (let item of data) {
      if (item === "\r") continue;
      if (item === "\n") {
        if (old === "\n") {
          flag = true;
          continue;
        }
        if (flag && typeof +text === "number") {
          if (first) first = false;
          else {
            arr.push(obj);
            obj = { content: [] };
          }
          // 字幕索引
          flag = false;
          obj.tid = +text;
        } else if (text.includes("-->")) {
          // 字幕时间
          let timeArr = text.split("-->");
          // 字幕开始时间
          let time = timeArr[0].trim().split(",");
          obj.from = +(time_to_sec(time[0]) + "." + time[1]);
          // 字幕结束时间
          time = timeArr[1].trim().split(",");
          obj.to = +(time_to_sec(time[0]) + "." + time[1]);
        }
        // 字幕内容
        else obj.content.push(text);
        text = "";
      } else text += item;
      old = item;
    }
    text && obj.content.push(text);
    arr.push(obj);
    // console.log(arr);
    // 文件读取成功
    // 获取字幕索引
    const question1 = () => {
      let flag = false;
      return new Promise((resolve, reject) => {
        rl.setPrompt("Please enter caption index (number type): \n");
        rl.prompt();
        rl.on("line", function (line) {
          if (flag) return;
          switch (isNaN(line)) {
            case false:
              flag = true;
              resolve(line | 0);
              break;
            default:
              console.log("Support number type, please re-enter1: ");
              break;
          }
        });
      });
    };
    // 调整秒数
    const question2 = () => {
      let flag = false;
      return new Promise((resolve, reject) => {
        rl.setPrompt(
          "Subtitle adjustment seconds(You can enter a negative number): \n"
        );
        rl.prompt();
        rl.on("line", function (line) {
          if (flag) return;
          switch (isNaN(line)) {
            case false:
              flag = true;
              resolve(+(+line).toFixed(3));
              break;
            default:
              console.log("Support number type, please re-enter2: ");
              break;
          }
        });
      });
    };
    const mains = async () => {
      const index = await question1();
      const seconds = await question2();
      let flag = false;
      // 输入事件已完成
      for (let item of arr) {
        if (flag || item.tid === index) {
          if (seconds > item.from) {
            item.from = 0;
            item.to = 0;
          } else {
            item.from += seconds;
            item.to += seconds;
          }
          flag = true;
        }
      }
      if (flag) {
        writeFile(arr);
      } else {
        console.log("subtitle index not found, Closing...");
        setTimeout(function () {
          rl.close();
        }, 1500);
      }
    };
    mains();
  });
}

/* write */
function writeFile(array) {
  /* set file route */
  let file = path.resolve(__dirname, "./newSubtitle/" + filePath);
  let str = "《MC一条小团团》\n\n";
  /* loop assignment content */
  for (let item of array) {
    str += `${item.tid}
${formatDuring(item.from)} --> ${formatDuring(item.to)}\n`;
    for (let value of item.content) {
      str += `${value}\n`;
    }
    str += "\n";
  }
  /* write content */
  fs.writeFile(file, str, { encoding: "utf8" }, (err) => {
    if (err) {
      console.log("write file fail: " + err);
    } else {
      console.log("write file success, Closing window...");
    }
    setTimeout(function () {
      rl.close();
    }, 1500);
  });
}
// 监听关闭事件,结束输出输出进程
rl.on("close", function () {
  process.exit(0);
});
/* 时间戳转换时分秒 */
function formatDuring(msss) {
  let mss = msss * 1000;
  //     var days = parseInt(mss / (1000 * 60 * 60 * 24));
  let hours = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = (mss % (1000 * 60)) / 1000;
  seconds = seconds.toFixed(3);
  let arr = seconds.split(".");
  return (
    hours.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    ":" +
    arr[0].padStart(2, "0") +
    "," +
    arr[1]
  );
}
/* 时分秒转换时间戳 */
function time_to_sec(time) {
  if (time !== null) {
    let s = "";
    let hour = time.split(":")[0];
    let min = time.split(":")[1];
    let sec = time.split(":")[2];
    s = Number(hour * 3600) + Number(min * 60) + Number(sec);
    return s;
  }
}
