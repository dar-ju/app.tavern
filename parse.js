const axios = require('axios');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const baseLink = 'https://obedofficemoscow.ru/catalog/'; // ссылка на страницу (без даты в конце)
const startDate = 1; // 1 - это начиная с завтрашнего дня
const pagesNumber = 10; // сколько дней парсим

let menuItemsList = [];

const menuFile = fs.readFileSync('./db/menu.json', 'utf8', (err) => {
   if (err) throw err;
});
delete menuFile;

// функция конвертации даты в формат DD-MM-YYYY (имя страницы)
function page(numDay) {
   let today = new Date();
   today.setDate(today.getDate() + numDay);
   let todayYear = today.getFullYear();
   let todayMonth = (`0${today.getMonth() + 1}`).slice(-2);
   let todayDay = (`0${today.getDate()}`).slice(-2);
   convertedDate = todayDay + '-' + todayMonth + '-' + todayYear;
   let page = todayDay + '-' + todayMonth + '-' + todayYear + '/';
   return page;
}

let menuItems;
let parsingTimeout = 0; // задержка запроса
let pageCount = 0; // счетчик

// удаляем старые папки с фотками
fs.readdir("./harchevna/img/menu", (error, files) => {
   if (error) return console.log(error);
   files.forEach((file) => {
      fs.rmSync(`./harchevna/img/menu/${file}`, { recursive: true });
   });
});

function parser() {
   function getMenu() {
      let linkDate = page(pageCount + startDate);
      let link = baseLink + linkDate; // конструктор ссылки
      console.log('Запрос меню по ссылке: ' + link);
      // export let status = `Запрос меню по ссылке: ${link}`;
      // запрос к странице сайта
      axios.get(link)
         .then(response => {
            let currentPage = response.data;
            const dom = new JSDOM(currentPage);
            menuItems = dom.window.document.querySelectorAll('.item_ajax_info'); // находим нужное меню
            // завершаем парсинг
            if (pageCount >= pagesNumber || menuItems[0] == undefined) {
               fs.writeFileSync('./db/menu.json', JSON.stringify(menuItemsList, null, 2)); // пишем в файл массива
               console.log('Парсинг дня завершен.')
               return;
            };

            // создаем папку с датой, если её нет
            if (!fs.existsSync(`./harchevna/img/menu/${linkDate}`)) fs.mkdirSync(`./harchevna/img/menu/${linkDate}`)

            // разбираем блюда для записи в массив
            menuItems.forEach(link => {
               let foodId = link.getAttribute('data-id');
               let foodDate = linkDate.slice(0, -1);
               let foodPrice = link.getAttribute('data-price');
               let foodImage = link.getAttribute('data-img');
               let foodImageName = foodImage.split('/')[foodImage.split('/').length - 1]
               let foodImageUrl = `https://obedofficemoscow.ru${foodImage}`;
               let foodName = link.getAttribute('data-name');
               let parentId = link.parentElement.id;
               menuItemsList.push({ id: foodId, date: foodDate, price: foodPrice, image_url: foodImage, product_name: foodName.replace('/', '~'), cat: parentId });

               // запрашиваем и сохраняем фотки
               axios({
                  method: "get",
                  url: foodImageUrl,
                  responseType: "stream"
               }).then(function (response) {
                  if (!foodImageName) {
                     console.log('фото отсутствует');
                  } else if (/[<>:"\\\\/|?*]+/.test(foodImageName)) {
                     console.log('имя файла содержит недопустимые символы');
                  } else {
                     response.data.pipe(fs.createWriteStream(`./harchevna/img/menu/${linkDate}/${foodImageName}`));
                  }
               });
            });
         })
      pageCount++; // увеличение даты
   };
   for (let i = 1; i <= pagesNumber; i++) {
      let getTimer = setTimeout(getMenu, parsingTimeout);
      parsingTimeout += 10000; // задержка между запросами
   };
   return;
};
parser();
