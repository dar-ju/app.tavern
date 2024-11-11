const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const https = require('https');
const path = './excel/';

// удаляем старые файлы
fs.readdir(path, (error, files) => {
    if (error) return console.log(error);
    files.forEach((file) => {
       fs.rmSync(path + file, { recursive: true });
    });
 });

// файлы для загрузки
const url1 = "https://obedofficemoscow.ru/upload/1.xls";
const url2 = "https://obedofficemoscow.ru/upload/2.xls";

function fileDownload() {
    return new Promise((resolve, reject) => {
        https.get(url1, response => {
            const fileStream = fs.createWriteStream(path + '1.xls');
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                // console.log('файл загружен');
            });
        });
        
        https.get(url2, response => {
            const fileStream = fs.createWriteStream(path + '2.xls');
            response.pipe(fileStream);
            fileStream.on('finish', () => {
            fileStream.close();
            // console.log('файл загружен');
            });
        });
        resolve();
    });
}

async function main() {
    try {
      await fileDownload();
    } catch (error) {
    console.error("Error occurred:", error);
  }
}

// работаем с файлами
async function fileParse() {
    await main();
    let files = [];
    fs.readdirSync(path).forEach(file => {
        if(file.endsWith('.xls') === true) files.push(file);
    });

    fs.rmSync(`./db/excel-menu.json`, { recursive: true });

    let total = {}
    for (item of files) {
        Object.assign(total, excelToJson({ sourceFile: path + item }));
    }

    fs.writeFileSync('./db/excel-menu.json', JSON.stringify(total, null, 2)); // пишем в файл массива
}
fileParse();