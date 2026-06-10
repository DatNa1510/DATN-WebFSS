const fs = require('fs');
const dir = 'D:/DATN/Web_FSS/fashion-dataset/images/';
const files = fs.readdirSync(dir);
const uuidFiles = files.filter(f => f.includes('-'));
console.log("UUID files found:", uuidFiles.length);
console.log(uuidFiles);
