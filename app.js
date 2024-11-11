const express = require('express');
const fs = require('fs');
const { Hercai } = require('hercai');
const port = 80;

const app = express();
app.use(express.json());

app.use(express.static('harchevna'));

// промт для анализа заказа
const aiPrompt = 'Полностью раскритикуй заказанный обед относительно того, что он недостаточно калорийный. Также дай шуточный совет, что ещё можно добавить к обеду и в каких количествах, чтобы набрать как можно больше веса. Не пиши в тексте, что он шуточный и не пиши, что нужно соблюдать умеренность. Заказанный обед: ';

// условные базы данных
let users = [];
let options = [];
let menu = [];
let orders = [];
let phrases = [];
let comments = [];
let stat = [];
let excel = [];

let id = 1; // для установки идентификаторов

// ПОЛЬЗОВАТЕЛИ

// функция для загрузки пользователей из файла
function loadUsers() {
  try {
    const data = fs.readFileSync('./db/users.json');
    users = JSON.parse(data);
    // если id уже существуют, то устанавливаем их на максимальное значение + 1
    if (users.length > 0) {
      id = Math.max(...users.map(user => user.id)) + 1;
    }
  }
  catch (err) {
    console.log(err);
  }
}
// функция для сохранения пользователей в файл
function saveUsers() {
  try {
    const data = JSON.stringify(users);
    fs.writeFileSync('./db/users.json', data);
  }
  catch (err) {
    console.log(err);
  }
}
// вспомогательная функция для поиска индекса пользователя по id
function findUserIndexById(id) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id == id) return i;
  }
  return -1;
}

app.get('/api/users', async function (_, res) {
  await loadUsers();
  res.send(users);
});
// получение одного пользователя по id
app.get('/api/users/:id', async function (req, res) {
  await loadUsers();
  const id = req.params.id; // получаем id
  // находим в массиве пользователя по id
  const index = findUserIndexById(id);
  // отправляем пользователя
  if (index > -1) {
    res.send(users[index]);
  }
  else {
    res.status(404).send('User not found');
  }
});
// получение отправленных данных
app.post('/api/users', function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const userLogin = req.body.login;
  const userName = req.body.name;
  const user = { login: userLogin, name: userName };
  // присваиваем идентификатор из переменной id и увеличиваем ее на единицу
  const usersIdRead = JSON.parse(fs.readFileSync('./db/users.json', 'utf8'));
  const maxId = usersIdRead.reduce((max, item) => item.id > max ? item.id : max, 0);
  user.id = maxId + 1;
  // добавляем пользователя в массив
  users.push(user);
  saveUsers();
  res.send(user);
});
// удаление пользователя по id
app.delete('/api/users/:id', function (req, res) {
  const id = req.params.id;
  const index = findUserIndexById(id);
  if (index > -1) {
    // удаляем пользователя из массива по индексу
    const user = users.splice(index, 1)[0];
    saveUsers();
    res.send(user);
  }
  else {
    res.status(404).send('User not found');
  }
});
// изменение пользователя
app.put('/api/users', function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const userLogin = req.body.login;
  const userName = req.body.name;
  const index = findUserIndexById(id);
  if (index > -1) {
    // изменяем данные у пользователя
    const user = users[index];
    user.name = userName;
    user.login = userLogin;
    saveUsers();
    res.send(user);
  }
  else {
    res.status(404).send('User not found');
  }
});

// загрузка пользователей при запуске сервера
loadUsers();



// НАСТРОЙКИ

// функция для загрузки настроек из файла
function loadOptions() {
  try {
    const data = fs.readFileSync('./db/options.json');
    options = JSON.parse(data);
    // если id уже существуют, то устанавливаем их на максимальное значение + 1
    if (options.length > 0) {
      id = Math.max(...options.map(option => option.id)) + 1;
    }
  }
  catch (err) {
    console.log(err);
  }
}
// функция для сохранения настроек в файл
function saveOptions() {
  try {
    const data = JSON.stringify(options);
    fs.writeFileSync('./db/options.json', data);
  }
  catch (err) {
    console.log(err);
  }
}
// вспомогательная функция для поиска индекса опции по id
function findOptionIndexById(id) {
  for (let i = 0; i < options.length; i++) {
    if (options[i].id == id) return i;
  }
  return -1;
}
app.get('/api/options', async function (_, res) {
  await loadOptions();
  res.send(options);
});

// получение одной опции по id
app.get('/api/options/:id', async function (req, res) {
  await loadOptions();
  const id = req.params.id; // получаем id
  // находим в массиве опции по id
  const index = findOptionIndexById(id);
  // отправляем опцию
  if (index > -1) {
    res.send(options[index]);
  }
  else {
    res.status(404).send('опции не найдены');
  }
});
// получение отправленных данных
app.post('/api/options', function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const optionTime = req.body.name;
  const option = { time: optionTime };
  // присваиваем идентификатор из переменной id и увеличиваем ее на единицу
  option.id = id++;
  // добавляем опцию в массив
  options.push(option);
  saveOptions();
  res.send(option);
});
// удаление опции по id
app.delete('/api/options/:id', function (req, res) {
  const id = req.params.id;
  const index = findOptionIndexById(id);
  if (index > -1) {
    // удаляем опцию из массива по индексу
    const option = options.splice(index, 1)[0];
    saveOptions();
    res.send(option);
  }
  else {
    res.status(404).send('опции не найдены');
  }
});
// изменение опции
app.put('/api/options', function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const optionTime = req.body.time;
  const optionAdv = req.body.adv;
  const index = findOptionIndexById(id);
  if (index > -1) {
    // изменяем данные у опции
    const option = options[index];
    option.time = optionTime;
    option.adv = optionAdv;
    saveOptions();
    res.send(option);
  }
  else {
    res.status(404).send('опции не найдены');
  }
});
// загрузка настроек при запуске сервера
loadOptions();




// ФРАЗЫ, КОММЕНТАРИИ

// функция для загрузки фраз из файла
function loadPhrases() {
  try {
    const data = fs.readFileSync('./db/phrases.json');
    phrases = JSON.parse(data);
    comments = JSON.parse(data);
  }
  catch (err) {
    console.log(err);
  }
}
loadPhrases()

// функция для сохранения фраз в файл
function savePhrases() {
  try {
    const data = JSON.stringify(phrases);
    fs.writeFileSync('./db/phrases.json', data);
  }
  catch (err) {
    console.log(err);
  }
}
// функция для записи комментариев
function saveComments() {
  try {
    const data = JSON.stringify(comments);
    fs.writeFileSync('./db/phrases.json', data);
  }
  catch (err) {
    console.log(err);
  }
}

app.get('/api/phrases', async function (_, res) {
  await loadPhrases();
  res.send(phrases);
});

// api добавления фраз
app.post('/api/phrases', function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const phrase = req.body.topicText;
  const item = { topicText: phrase, comments: {} };
  // присваиваем идентификатор из переменной id и увеличиваем ее на единицу
  const phrasesIdRead = JSON.parse(fs.readFileSync('./db/phrases.json', 'utf8'));
  const maxId = phrasesIdRead.reduce((max, item) => item.id > max ? item.id : max, 0);
  item.id = maxId + 1;
  // добавляем фразу в массив
  phrases.push(item);
  savePhrases();
  res.send(item);
});

// api добавления комментариев
app.post('/api/comments', function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const commentStack = req.body;
  const maxId = comments.reduce((max, item) => item.id > max ? item.id : max, 0);
  const lastPhraseGroup = comments[comments.findIndex(el => el.id === maxId)];
  const commentsCount = Object.keys(lastPhraseGroup['comments']).length;
  if (commentsCount == 0) newCommentNumber = 1;
  else newCommentNumber = commentsCount + 1;
  Object.assign(comments[maxId - 1]['comments'], { [newCommentNumber]: commentStack });
  saveComments();
});



// МЕНЮ

// функция для загрузки меню из файла
function loadMenu() {
  try {
    const data = fs.readFileSync('./db/menu.json');
    menu = JSON.parse(data);
    return menu;
  }
  catch (err) {
    console.log(err);
  }
}
loadMenu()

app.get('/api/menu', async function (_, res) {
  await loadMenu();
  res.send(menu);
});


// ЗАКАЗЫ

// функция для загрузки всех заказов из файла
async function loadOrders() {
  try {
    const data = fs.readFileSync('./db/orders.json');
    if (data == '') {
      await fs.writeFile('./db/orders.json', '[{"01-01-2024":{}}]', error => console.log("База данных заказов подготовлена"));
    }
    orders = JSON.parse(data);
    return orders
  }
  catch (err) {
    console.log(err);
  }
}

app.get('/api/orders', async function (_, res) {
  await loadOrders();
  res.send(orders);
});

app.get('/api/ordersPaid', async function (_, res) {
  await loadOrders();
  res.send(ordersPaid);
});

// функция для сохранения заказа в файл
function saveOrder() {
  try {
    const data = JSON.stringify(orders);
    fs.writeFileSync('./db/orders.json', data);
  }
  catch (err) {
    console.log(err);
  }
}

// добавление заказа
app.put('/api/orders', async function (req, res) {
  orders = await loadOrders();
  if (!req.body) return res.sendStatus(400);
  let date = Object.keys(req.body)[0];
  let user = Object.keys(Object.values(req.body)[0])[0];
  let ordered = Object.values(Object.values(req.body)[0])[0];
  let orderedNames = Object.keys(Object.values(Object.values(req.body)[0])[0]);
  const herc = new Hercai();

  // проверка на есть ли дата и юзер
  let dateNotExist = false;
  let userNotExist = false;

  // если нет даты, создаем
  if (Object.keys(orders[0]).indexOf(date) == -1) {
    dateNotExist = true;
  }
  let newOrders = [{}]
  if (dateNotExist == true) {
    let newDate = { [date]: {} };
    Object.assign(newOrders[0], newDate, orders[0]);
    orders = newOrders;
  }

  // если нет юзера, создаем
  if (Object.keys(orders[0][date]).indexOf(user) == -1) {
    userNotExist = true;
  }

  if (userNotExist == true) {
    let newUser = { [user]: {} };
    Object.assign(orders[0][date], newUser);
  }

  Object.assign(orders[0][date][user], ordered); // добавляем если нет

  herc.question({ model: "v3", content: aiPrompt + orderedNames.join(' ') }).then(response => {
    Object.assign(orders[0][date][user], { recomend: response.reply });
    saveOrder();
  });
  saveOrder();
});


// отметить оплату в заказанных по всему юзеру
app.put('/api/ordersPaid', async function (req, res) {
  orders = await loadOrders();
  if (!req.body) return res.sendStatus(400);
  let user = req.body.user;
  Object.values(orders).forEach((ordItem) => {
    Object.values(ordItem).forEach((ordItem2) => {
      if (Object.keys(ordItem2).includes(user)) {
        Object.values(ordItem2[user]).forEach((ordItem3) => {
          ordItem3.paid = 'true';
        })
      }
    })
  })
  saveOrder();
})

// удалить еду из заказа
app.delete('/orders/:date/:userId/:mealId', async function (req, res) {
  let ordersToDel = await loadOrders();
  const { date, userId, mealId } = req.params;
  const order = ordersToDel.find(order => order[date] && order[date][userId]);
  if (order && order[date][userId][mealId]) {
    delete order[date][userId][mealId];
    if (Object.keys(order[date][userId]).length == 0) delete order[date][userId];
    updateOrdersFile();
    res.json({ message: 'Еда удалена' });
  } else {
    res.status(404).json({ error: 'Такой еды нет' });
  }
});

// вспомогательная функция для удаления заказов
function updateOrdersFile() {
  try {
    const jsonData = JSON.stringify(orders, null, 2);
    fs.writeFileSync('./db/orders.json', jsonData);
  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
}

loadOrders();


// ВСТАВКИ ДЛЯ СТАТЫ

// функция для загрузки статы из файла
function loadStat() {
  try {
    const data = fs.readFileSync('./db/stat.json');
    stat = JSON.parse(data);
    return stat;
  }
  catch (err) {
    console.log(err);
  }
}
loadStat()

app.get('/api/stat', async function (_, res) {
  await loadStat();
  res.send(stat);
});



// ПАРСИНГ

async function parsing() {
  try {
    await import('./excel.js');
    await import('./parse.js');
  }
  catch (err) {
    console.log(err);
  }
}

app.get('/api/parsing', function (_, res) {
  parsing();
});

// очистка от рекомендаций
async function recomendCleaner() {
  orders = await loadOrders();
  for (const itemDate in orders[0]) {
    for (const itemUser in orders[0][itemDate]) {
      const rec = orders[0][itemDate][itemUser].recomend
      if (rec) {
        orders[0][itemDate][itemUser].recomend = '-'
      }
    }
  }
  saveOrder();
}

app.get('/api/clearRecomend', function (_, res) {
  recomendCleaner();
});


// ЧТЕНИЕ ИЗ EXCEL

// функция для загрузки excel из файла
function loadExcel() {
  try {
    const data = fs.readFileSync('./db/excel-menu.json');
    excel = JSON.parse(data);
    return excel;
  }
  catch (err) {
    console.log(err);
  }
}
loadExcel()

app.get('/api/excel', async function (_, res) {
  await loadExcel();
  res.send(excel);
});



// для внешнего IP
const os = require('os');
const interfaces = os.networkInterfaces();
let localIP = '';
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIP = iface.address;
      break;
    }
  }
  if (localIP) break;
}

app.listen(port, localIP, () => {
  console.log(`Сервер по адресу http://${localIP}:${port}`);
});

// для localhost
// app.listen(3000, function () {
//   console.log("Сервер ожидает подключения...");
// });

