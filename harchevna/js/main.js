(async () => {
  // определяем пользователя
  let hash, hash2
  if (window.location.search) {
    hash = window.location.search.split('?')[1].split('&').shift();
    hash2 = window.location.search.split('&')[1];
  } else hash = '';
  const admName = 'admin'; // логин админа
  const admKey = 'admkey'; // админский ключ

  const URL = 'http://192.168.0.108/?';

  const container = document.querySelector('.menu');

  const tbody = document.querySelector('.adm-panel__users-list');
  const otime = document.querySelector('.adm-panel__time-input');
  const topicText = document.querySelector('#topicText');
  const advText = document.querySelector('#advText');
  let users;
  let orderIdent = false;

  // переменные календаря
  let calendarList, handleCalendarClick;

  // СКРОЛЛ
  const upButton = document.querySelector('.scroll');
  document.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      upButton.style.opacity = '1';
    } else upButton.style.opacity = '0';
  }, { passive: true })
  upButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  })

  // ВЫЛЕЗАЮЩАЯ ПОДГЛЯДЫВАЮЩАЯ СВИНЬЯ
  function pigDownAnimation() {
    let currentAnimation;
    const pigHide = document.querySelector('.pig-bottom');
    pigHide.style.display = 'block';
    currentAnimation = gsap.fromTo('.pig-bottom',
      { bottom: '-300px' },
      { bottom: '-115px', duration: 10, ease: 'none' }
    );
    // прячем свинью
    function pigHideFn() {
      currentAnimation.kill();
      currentAnimation = gsap.fromTo('.pig-bottom',
        { bottom: pigHide.style.bottom },
        { bottom: '-300px', duration: 0.3, ease: 'expoScale' }
      );
    }
    // анимация с задержкой
    function startAnimationWithDelay() {
      // случайная ширина
      const randomHorizontal = 93 - Math.floor(Math.random() * 100);
      animationTimeout = setTimeout(() => {
        pigHide.style.left = randomHorizontal + '%';
        currentAnimation = gsap.fromTo('.pig-bottom',
          { bottom: '-300px' },
          { bottom: '-115px', duration: 10, ease: 'none' }
        );
      }, 5000);
    }
    pigHide.addEventListener('mouseover', () => {
      if (currentAnimation) pigHideFn();
      startAnimationWithDelay();
    });
  }


  // РАБОТА С ДАННЫМИ СЕРВЕРА
  // 1а. Получение всех пользователей
  async function getUsers() {
    // отправляем запрос и получаем ответ
    const response = await fetch('/api/users');
    // если запрос прошел нормально
    if (response.ok) {
      // получаем данные
      users = await response.json();
      return users;
    }
  }
  // await getUsers();

  // 1б. Получение одного пользователя
  async function getUser(id) {
    const response = await fetch('/api/users/' + id);
    if (response.ok) {
      const user = await response.json();
      const form = document.forms['userForm'];
      form.elements['id'].value = user.id;
      form.elements['login'].value = user.login;
      form.elements['name'].value = user.name;
    }
  }
  // 2. Добавление пользователя
  async function createUser(userLogin, userName) {
    const response = await fetch('api/users', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: userLogin,
        name: userName,
      }),
    });
    if (response.ok) {
      const user = await response.json();
      reset();
      tbody.append(row(user));
    }
  }
  // 3. Изменение пользователя
  async function editUser(userId, userLogin, userName) {
    const response = await fetch('api/users', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userId,
        login: userLogin,
        name: userName,
      }),
    });
    if (response.ok) {
      const user = await response.json();
      reset();
      document
        .querySelector(`tr[data-rowid='${user.id}']`)
        .replaceWith(row(user));
    }
  }
  // 4. Удаление пользователя
  async function deleteUser(id) {
    const response = await fetch('/api/users/' + id, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const user = await response.json();
      document.querySelector(`tr[data-rowid='${user.id}']`).remove();
    }
  }

  // сброс формы
  function reset() {
    const form = document.forms['userForm'];
    form.reset();
    form.elements['id'].value = 0;
  }

  // Получение настроек времени
  async function getOptionsTime() {
    const response = await fetch('/api/options');
    if (response.ok) {
      const option = await response.json();
      otime.value = option[0].time;
      return otime.value;
    }
  }
  // await getOptionsTime();

  // Получение произвольной настройки
  async function GetOption(id, optionName) {
    const response = await fetch('/api/options');
    if (response.ok) {
      const allOptions = await response.json();
      return allOptions[id - 1][optionName];
    }
  }
  // ВЫВОД
  // console.log(await GetOption(2, 'adv'));

  // отправка формы времени
  document.forms['optionsForm'].addEventListener('submit', (e) => {
    e.preventDefault();
    const warning = document.querySelector('.header__warning');
    const form = document.forms['optionsForm'];
    const time = form.elements['time'][1].value;
    editOption(1, 'time', time);
    warning.textContent = `Прием заказов до ${time}`;
  });

  // 3. Изменение опции
  async function editOption(id, optionName, optionValue) {
    const response = await fetch('/api/options', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        [optionName]: optionValue
      }),
    });
  }

  // сброс значений формы
  document.getElementById('resetBtn').addEventListener('click', (e) => {
    e.preventDefault();
    reset();
  });

  // отправка формы пользователя
  document.forms['userForm'].addEventListener('submit', (e) => {
    e.preventDefault();
    const form = document.forms['userForm'];
    const id = form.elements['id'].value;
    const login = form.elements['login'].value;
    const name = form.elements['name'].value;
    if (id == 0) createUser(login, name);
    else editUser(id, login, name);
  });


  // МЕНЮ

  // Получение меню
  async function getMenu() {
    const response = await fetch('/api/menu');
    if (response.ok) {
      const menu = await response.json();
      return menu;
    }
  }
  // console.log(await getMenu());

  // ЗАКАЗЫ

  // Получение всех заказов
  async function getOrders() {
    const response = await fetch('/api/orders');
    if (response.ok) {
      const orders = await response.json();
      return orders;
    }
  }

  // Получение заказов по дате и пользователю
  async function getUserOrdersByDate(date, user) {
    const allOrders = await getOrders();
    let isDateExist;
    // проверяем, если выгрузка заказов пустая
    if (allOrders.length != 0) { isDateExist = Object.keys(allOrders[0]).indexOf(date); }
    else isDateExist = -1;

    if (isDateExist > -1) {
      if (user == undefined) {
        return allOrders[0][date];
      } else return allOrders[0][date][user];
    }
  }
  // ВЫВОД
  // console.log(await getUserOrdersByDate('12-06-2024', 'test5'));

  // Запись заказа
  async function createOrder(orderDate, orderName, massive) {
    const response = await fetch('api/orders', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [orderDate]: {
          [orderName]: massive
        }
      }),
    });
    if (response.ok) {
      const user = await response.json();
    }
  }
  // ВЫВОД
  // createOrder('12-06-2024', 'test6', 'Блинчики с джемом', '85', '1')

  // отметить оплату в заказанных по всему юзеру
  async function ordersPaid(user) {
    const response = await fetch('api/ordersPaid', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user
      }),
    });
    if (response.ok) {
      const user = await response.json();
    }
  }
  // ВЫВОД
  // ordersPaid('test5')


  // Удаление заказа
  async function deleteOrder(date, userId, mealId) {
    try {
      const response = await fetch(`/orders/${date}/${userId}/${mealId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.log(response);
        const errorData = await response.json();
        console.error(errorData.error);
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
  // ВЫВОД
  // await deleteOrder('12-06-2024', 'test6', 'Блинчики с джемом');

  // ФРАЗЫ СТАТИСТИКИ
  // Получение всех базовых фраз статистики
  async function getStat() {
    const response = await fetch('/api/stat');
    if (response.ok) {
      const stat = await response.json();
      return stat;
    }
  }
  // ВЫВОД
  // console.log(await getStat());

  // ФРАЗЫ

  // получаем все фразы
  async function getPhrases() {
    const response = await fetch('/api/phrases');
    if (response.ok) {
      phrases = await response.json();
      return phrases;
    }
  }
  // получаем группу последней фразы
  async function getLastPhraseGroup() {
    let phrases = await getPhrases();
    id = Math.max(...phrases.map(option => option.id)) - 1;
    return phrases[id];
  }

  // запрос на добавление фразы
  async function addPhrase(phrase) {
    const response = await fetch('/api/phrases', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicText: phrase
      }),
    });
  }

  // запрос на добавление комментария
  async function addComment(user, date, comment) {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: user,
        date: date,
        comment: comment
      }),
    });
  }
  // addComment('user', '2024-2', 'comment-2')

  // форма добавления фразы
  document.forms['topicStarter'].addEventListener('submit', (e) => {
    e.preventDefault();
    const form = document.forms['topicStarter'];
    const phrase = form.elements['topicText'].value;
    addPhrase(phrase);
    const currentPhraseTag = document.querySelector('.adm-panel__current-phrase');
    currentPhraseTag.textContent = `Текущая фраза: ${phrase}`;
    topicText.value = '';
  });

  // форма добавления рекламного объявления
  document.forms['advAdminForm'].addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = document.forms['advAdminForm'];
    const newAdv = form.elements['advText'].value;
    await editOption(2, 'adv', newAdv);
    document.querySelector('.adv__info-text').textContent = newAdv;
    advText.value = '';
  });

  // EXCEL загрузка
  // Получение данных файла
  async function getExcel() {
    const response = await fetch('/api/excel');
    if (response.ok) {
      const excel = await response.json();
      return excel;
    }
  }
  // ВЫВОД
  // console.log(await getExcel());


  // функции конвертации даты и времени
  function today(col) {
    const today = new Date();
    today.setDate(today.getDate() + col);
    return today;
  }
  // конвертер даты В формат dd-mm-yyyy
  function todayConvert(today) {
    const todayConv = new Date(today);
    year = todayConv.getFullYear();
    month = `0${todayConv.getMonth() + 1}`.slice(-2);
    day = `0${todayConv.getDate()}`.slice(-2);
    converted = day + '-' + month + '-' + year;
    return converted;
  }
  // дата сегодня в формате 09-04-2024
  // console.log(todayConvert(today(0)))
  // console.log(todayConvert(new Date()))

  // конвертер даты ИЗ формата dd-mm-yyy
  function convertDateRev(date) {
    year = date.split('-')[2];
    month = date.split('-')[1] - 1;
    day = date.split('-')[0];
    converted = new Date(year, month, day);
    return converted;
  }
  // console.log(convertDateRev('01-04-2024'))

  function timeHM() {
    const today = new Date();
    hour = today.getHours();
    minute = today.getMinutes();
    converted = hour + '-' + minute;
    return converted;
  }

  // конвертиция времени типа 11-40 в млисек.
  function timeConvert(vol) {
    const time1 = (vol.split('-')[0] * 60 + vol.split('-')[1] * 1) * 1000;
    return time1;
  }
  // console.log(timeConvert(timeHM()))

  // считаем сколько должен юзер
  async function userDebtToPay(user) {
    const orders = await getOrders();
    let summ = 0;
    for (meal in orders[0]) {
      userObj = orders[0][meal][user];
      for (mealObj in userObj) {
        if (userObj[mealObj].paid == 'false') {
          const price = userObj[mealObj].price;
          const quant = userObj[mealObj].quant;
          summ = summ + (Number(price) * Number(quant));
        }
      }
    };
    return summ;
  }

  if (hash == undefined) {
    const blockCalendar = document.querySelector('.calendar');
    const blockRight = document.querySelector('.order__wrapper');
    blockCalendar.style.display = 'none';
    blockRight.style.display = 'none';

    const helloBlock = document.querySelector('.menu__hello');
    helloBlock.style.display = 'initial';
    return;
  }

  // чтение из базы данных пользователя
  let userName

  async function dbItemGetUser(log) {
    const blockCalendar = document.querySelector('.calendar');
    const blockRight = document.querySelector('.order__wrapper');
    const obj = await getUsers();
    try {
      const item = obj[obj.findIndex((el) => el.login === log)].login;
      userName = obj[obj.findIndex((el) => el.login === log)].name;
      if (item == log) {
        blockCalendar.style.display = 'initial';
        blockRight.style.display = 'flex';
        return item;
      }
    } catch (err) {
      console.log('Пользователя не существует');
      blockCalendar.style.display = 'none';
      blockRight.style.display = 'none';
      const admPanel = document.querySelector('.adm-panel');
      admPanel.style.display = 'none';
    }
  }
  const userHash = await dbItemGetUser(hash);
  if (userName == undefined) document.title = 'Харчевня';
  else document.title = 'Харчевня - ' + userName;

  // добавление комментария
  document.forms['chatForm'].addEventListener('submit', (e) => {
    e.preventDefault();
    const form = document.forms['chatForm'];
    const comment = form.elements['chatInput'].value;

    const parentBlock = document.querySelector('.dialog__chat')
    const commentBlock = document.createElement('div');
    const commentInfoBlock = document.createElement('div');
    const commentUser = document.createElement('span');
    const commentDate = document.createElement('span');
    const commentItem = document.createElement('p');
    parentBlock.prepend(commentBlock);
    commentItem.classList.add('dialog__comment');
    commentBlock.append(commentInfoBlock);
    commentInfoBlock.classList.add('dialog__comment-info-block');
    commentInfoBlock.append(commentUser);
    commentInfoBlock.append(commentDate);
    commentDate.classList.add('dialog__comment-info');
    commentUser.classList.add('dialog__comment-info');
    commentBlock.append(commentItem);

    const data = new Date();
    const date = `${('0' + (data.getDate())).slice(-2)}-${('0' + (data.getMonth() + 1)).slice(-2)}-${data.getFullYear()} ${data.getHours()}:${data.getMinutes()}`;
    commentUser.textContent = userName;
    commentDate.textContent = date;
    commentItem.textContent = comment;
    form.elements['chatInput'].value = '';
    // запись коммента в базу
    addComment(userName, date, comment);
  });

  // формирование статистики
  async function statBuild(date) {
    const orders = await getUserOrdersByDate(date);
    const stat = await getStat();
    const users = await getUsers();

    // берем рандомное выражениьце
    function statItem(id) {
      return stat[id].part[Math.floor(Math.random() * stat[id].part.length)];
    }

    if (!orders) return;
    const statEaters = Object.keys(orders).length;
    let statSumm = 0;
    let tempMassive = [];
    let tempMassiveFood = [];
    for (let user in orders) {
      const userConvert = users.find(numb => numb.login === user).name;
      const tempObj = { user: userConvert, summ: 0 };
      for (let item in orders[user]) {
        if (item == 'recomend') continue;
        const price = Number(orders[user][item].price);
        const tempObjFood = { meal: item, user: userConvert, price: price };
        tempObj.summ += price;
        statSumm += price;
        tempMassiveFood.push(tempObjFood);
      }
      tempMassive.push(tempObj);
    }
    const statAverage = Math.round(statSumm / statEaters);
    tempMassive.sort((a, b) => b['summ'] > a['summ'] ? 1 : -1);
    tempMassiveFood.sort((a, b) => b['price'] > a['price'] ? 1 : -1);
    if (tempMassive.length == 0) return;
    const statMaxOrdUser = tempMassive[0].user;
    const statMaxOrdSumm = tempMassive[0].summ;
    const numUsers = Object.keys(tempMassive).length - 1;
    const statMinOrdUser = tempMassive[numUsers].user;
    const statMinOrdSumm = tempMassive[numUsers].summ;
    const statMaxMealUser = tempMassiveFood[0].user;
    const statMaxMealName = tempMassiveFood[0].meal;

    const ttt = document.querySelector('.menu');
    const divBlock = document.createElement('div');
    divBlock.classList.add('stat__block');
    ttt.append(divBlock);

    divBlock.innerHTML = `<h2>Ежедневный отчетишко</h2><p class='stat__descr'>
    ${statItem(0)} <span class='stat__note'>${statEaters}</span> ${statItem(1)}
    <span class='stat__note'>${statAverage}</span> ${statItem(2)}
    <span class='stat__note'>${statMaxOrdUser}</span> ${statItem(3)}
    <span class='stat__note'>${statMaxOrdSumm}</span> ${statItem(4)}
    <span class='stat__note'>${statMinOrdUser}</span> ${statItem(5)}
    <span class='stat__note'>${statMaxMealUser}</span> ${statItem(6)}
    <span class='stat__note'>'${statMaxMealName}'</span> ${statItem(7)}</p>`;
  }




  // АДМИНка
  if (hash == admName) {

    const orderTime = document.querySelector('.header__warning');
    const orderTimeServer = await GetOption(1, 'time');
    orderTime.textContent = `Прием заказов до ${orderTimeServer}`;

    const admPanel = document.querySelector('.adm-panel');
    admPanel.style.display = 'initial';

    // функция копирования заказа
    setAutoCopy();
    function setAutoCopy() {
      const area = display(document.createElement('textarea'), 'none');
      document.body.appendChild(area);

      const copy = document.querySelector('.adm-panel__order-copy');
      const field = document.querySelector('.adm-panel__order-by_quant');

      copy.addEventListener('click', function () {
        initCopy(field.textContent.trim());
      });

      function initCopy(str) {
        str = str.split('').join('\n');
        display(area).value = str;
        area.select();
        document.execCommand('copy');
        display(area, 'none');
      }
    }

    function display(elem, value) {
      elem.style.display = value || 'block';
      return elem;
    }

    // создание строк для таблицы
    function row(user) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-rowid', user.id);

      const idTd = document.createElement('td');
      idTd.append(user.id);
      tr.append(idTd);

      const loginTd = document.createElement('td');
      loginTd.append(user.login);
      tr.append(loginTd);

      const nameTd = document.createElement('td');
      nameTd.append(user.name);
      tr.append(nameTd);

      const userUrlTd = document.createElement('a');
      userUrlTd.append(URL + user.login);
      tr.append(userUrlTd);
      userUrlTd.href = URL + user.login;

      const debtTd = document.createElement('td');
      userDebt(user);

      const linksTd = document.createElement('td');

      const editLink = document.createElement('a');
      editLink.setAttribute('data-id', user.id);
      editLink.setAttribute('class', 'btn');
      editLink.append('Изменить');
      editLink.addEventListener('click', (e) => {
        e.preventDefault();
        getUser(user.id);
      });
      linksTd.append(editLink);

      const removeLink = document.createElement('a');
      removeLink.setAttribute('data-id', user.id);
      removeLink.setAttribute('class', 'btn');
      removeLink.append('Удалить');
      removeLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm(`Точно удалить '${user.name}'?`)) {
          deleteUser(user.id);
        }
      });

      linksTd.append(removeLink);
      tr.appendChild(linksTd);

      // считаем сколько должен юзер
      async function userDebt(user) {
        const orders = await getOrders();
        let summ = 0;
        for (meal in orders[0]) {
          userObj = orders[0][meal][user.login];
          for (mealObj in userObj) {
            if (userObj[mealObj].paid == 'false') {
              const price = userObj[mealObj].price;
              const quant = userObj[mealObj].quant;
              summ = summ + (Number(price) * Number(quant));
            }
          }
        };
        debtTd.append(summ);
        tr.append(debtTd);

        // ссылки на жрателей
        const userAdminUrl = document.createElement('a');
        userAdminUrl.append(user.name);
        tr.append(userAdminUrl);
        userAdminUrl.href = `${URL}${user.login}&${admKey}`;
        userAdminUrl.target = '_blank';
      }
      return tr;
    }

    const usersTableFill = () => {
      users.forEach((user) => {
        // добавляем полученные элементы в таблицу
        tbody.append(row(user));
      });
    };
    usersTableFill();

    // убираем календарь, коменты и область заказа
    const calendar = document.querySelector('.calendar');
    calendar.style.display = 'none';
    const right = document.querySelector('.order__wrapper');
    right.style.display = 'none';
    const commentBlock = document.querySelector('.dialog__wrapper');
    commentBlock.style.display = 'none';

    // подгружаем текущую фразу в поле
    const currentPhraseGroup = await getLastPhraseGroup();
    const currentPhrase = currentPhraseGroup.topicText;
    const currentPhraseTag = document.querySelector('.adm-panel__current-phrase');
    currentPhraseTag.textContent = `Текущая фраза: ${currentPhrase}`;
    topicText.value = '';

    // подгружаем фразу в рекламное поле
    const advTextServer = await GetOption(2, 'adv');
    const advTextField = document.querySelector('.adv__info-text');
    advTextField.textContent = advTextServer;

    // нажатие на Парсить
    document.forms['parseForm'].addEventListener('submit', async (e) => {
      e.preventDefault();
      parseMenu();
    });

    // функция парсинга
    function parseMenu() {
      const response = fetch('/api/parsing');
    }

    // нажатие на Очистить рекомендации
    document.forms['clearRecomend'].addEventListener('submit', async (e) => {
      e.preventDefault();
      if (confirm(`Точно удалить?`)) {
        clearRecomend();
      }
    });

    // функция очистки
    function clearRecomend() {
      const response = fetch('/api/clearRecomend');
    }

    // выводим, что поназаказывали
    const orderDate = document.getElementById('orderDateAdmin');
    const orderTrDate = document.querySelector('.adm-panel__order-by_meal');
    const orderTrDateQuant = document.querySelector('.adm-panel__order-by_quant');
    const orderTrUser = document.querySelector('.adm-panel__order-by_users');
    const summBlock = document.querySelector('.adm-panel__order-block');
    const orderBlock = document.querySelector('.adm-panel__order-wrapper');
    let ordersList;
    let admMenu;
    let admDate;

    // определеяем завтрашний день
    function formatDate() {
      const today = new Date();
      const date = today.getDate() + 1;
      const day = String(date).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();

      return `${year}-${month}-${day}`;
    }
    // в инпуте ставим завтрашнюю дату
    document.getElementById('orderDateAdmin').value = formatDate();
    // прогружаем таблицы на завтра
    orderedByDateLoad(formatDate());

    // функции отрисовки заказанного
    async function orderedByDate(val) {
      admDate = todayConvert(val);
      ordersList = await getUserOrdersByDate(admDate);
      admMenu = await getMenu();
    }

    async function orderedByDateLoad(val) {
      await orderedByDate(val);

      // работа с данными меню из excel
      const excelMenu = await getExcel();

      const excelKeys = Object.keys(excelMenu);
      let excelDay;
      const valConverted = `${val.slice(-2)}.${val.slice(5, 7)}.${val.slice(2, 4)}`;
      for (item of excelKeys) {
        if (item.indexOf(valConverted) >= 0) excelDay = item;
      }
      const excelDayItems = excelMenu[excelDay];

      let newDaymassive = [];
      let mass = [];
      if (ordersList) {
        for (item in excelDayItems) {
          if (item < 3) continue;
          if (excelDayItems[item]['A'] == undefined && excelDayItems[item]['B'] == undefined) break;
          let aItem, bItem, dItem;
          if (excelDayItems[item]['A'] != undefined) aItem = excelDayItems[item]['A'];
          else aItem = '';
          if (excelDayItems[item]['B'] != undefined) bItem = excelDayItems[item]['B'];
          else bItem = '-------------------';
          if (excelDayItems[item]['D'] != undefined) dItem = excelDayItems[item]['D'];
          else dItem = '';
          newDaymassive.push({ num: aItem, name: bItem.trim(), price: dItem });

          Object.keys(ordersList).forEach((ordItem) => {
            Object.keys(ordersList[ordItem]).forEach((ordMeal) => {
              if (ordMeal.trim().replace('~', '/') == bItem.trim()) {
                const objToAdd = { name: ordMeal.trim().replace('~', '/'), quant: Number(ordersList[ordItem][ordMeal].quant) }
                mass.push(objToAdd);
              }
            })
          })
        }
      }

      // плюсуем в массиве кол-ва повторяющихся блюд
      const mass2 = Object.entries(mass.reduce((acc, entry) => {
        const name = entry.name;

        if (acc[name] !== undefined) acc[name] += entry.quant;
        else acc[name] = entry.quant;
        return acc;
      }, {})).map(([name, quant]) => ({ name: name, quant }));


      // отображаем на странице по блюдам
      let totalSumm = 0;
      let totalQuant = 0;
      for (let i = 0; i < newDaymassive.length; i++) {
        const tempMeal = newDaymassive[i].name.replace('~', '/');
        const tempPrice = Number(newDaymassive[i].price);

        const orderTrItem = document.createElement('tr');
        orderTrDate.append(orderTrItem)
        const orderTdName = document.createElement('td');
        orderTdName.classList.add('td-name');
        orderTrItem.append(orderTdName)
        orderTdName.textContent = newDaymassive[i].name.replace('~', '/')

        const orderTdQuant1 = document.createElement('td');
        orderTdQuant1.classList.add('td-quant');
        orderTrItem.append(orderTdQuant1)

        const orderTrItemQuant = document.createElement('tr');
        orderTrDateQuant.append(orderTrItemQuant)
        const orderTdQuant = document.createElement('td');
        orderTdQuant.classList.add('td-quant');
        orderTrItemQuant.append(orderTdQuant)
        orderTdQuant.textContent = 0

        Object.keys(mass2).forEach((item) => {
          if (tempMeal == mass2[item].name) {
            orderTdQuant1.textContent, orderTdQuant.textContent = mass2[item].quant
            totalSumm = totalSumm + tempPrice * Number(mass2[item].quant)
            totalQuant = totalQuant + Number(mass2[item].quant)
          }
        })
      }

      // выводим сумму
      const orderedSumm = document.querySelector('.adm-panel__order-summ')
      orderedSumm.textContent = `Всего заказано на ${totalSumm} руб. Единиц еды: ${totalQuant}`

      orderTrDateQuant.addEventListener('click', function () {
        const range = document.createRange();
        range.selectNode(orderTrDateQuant);
        window.getSelection().addRange(range);
      });

      // отображаем на странице по юзерам
      const users = await getUsers();

      if (ordersList == undefined) {
        summBlock.style.display = 'none';
        orderBlock.style.display = 'none';
      } else {
        summBlock.style.display = 'block';
        orderBlock.style.display = 'flex';
        Object.keys(ordersList).forEach((ordItem) => {
          const orderTrItemUser = document.createElement('h3');
          orderTrUser.append(orderTrItemUser);
          orderTrItemUser.textContent = users.find(el => el.login === ordItem).name;
          Object.keys(ordersList[ordItem]).forEach((ordMeal) => {
            if (ordMeal == 'recomend') return;
            const orderTrUserMenu = document.createElement('tr');
            orderTrUser.append(orderTrUserMenu);
            const orderTdNameUser = document.createElement('td');
            orderTdNameUser.classList.add('td-name');
            orderTrUser.append(orderTdNameUser);
            orderTdNameUser.textContent = ordMeal;
            const orderTdQuantUser = document.createElement('td');
            orderTrUser.append(orderTdQuantUser);
            orderTdQuantUser.textContent = Number(ordersList[ordItem][ordMeal].quant);
          })
        })
      }
    }

    // выбор даты
    orderDate.addEventListener('change', (e) => {
      e.preventDefault();
      orderTrDate.innerHTML = '';
      orderTrDateQuant.innerHTML = '';
      orderTrUser.innerHTML = '';
      window.location.hash = 'orderDateAdmin';
      orderedByDateLoad(e.target.value);
    });





    // все остальные пользователи
  } else if (hash == userHash) {

    orderBtn = document.querySelector('.order__btn');

    // подгружаем комменты к фразе
    async function commentsDomFill(param) {
      // обновляем фразу
      const phrase = document.querySelector('.dialog__topic');
      const lastPhraseGroup = await getLastPhraseGroup();
      phrase.textContent = lastPhraseGroup.topicText;

      // обновляем комменты
      const commentsObj = lastPhraseGroup['comments'];
      const parentBlock = document.querySelector('.dialog__chat');
      parentBlock.innerHTML = '';
      for (let item in commentsObj) {
        const commentBlock = document.createElement('div');
        const commentInfoBlock = document.createElement('div');
        const commentUser = document.createElement('span');
        const commentDate = document.createElement('span');
        const commentItem = document.createElement('p');

        parentBlock.prepend(commentBlock);
        commentItem.classList.add('dialog__comment');
        commentBlock.append(commentInfoBlock);
        commentInfoBlock.classList.add('dialog__comment-info-block');
        commentInfoBlock.append(commentUser);
        commentInfoBlock.append(commentDate);
        commentDate.classList.add('dialog__comment-info');
        commentUser.classList.add('dialog__comment-info');
        commentBlock.append(commentItem);

        if (item == Object.keys(commentsObj).length && param == 'lastComm') {
          commentBlock.classList.add('last-comment');
          commentItem.classList.add('last-comment-text');
          gsap.from('.last-comment', { opacity: 0, y: 70, duration: 0.7 });
          gsap.fromTo('.last-comment-text', { duration: 2.0, backgroundColor: '#fca2e5' }, { duration: 1.0, backgroundColor: '#ffe8eb' });
        }

        commentUser.textContent = commentsObj[item]['user'];
        commentDate.textContent = commentsObj[item]['date'];
        commentItem.textContent = commentsObj[item]['comment'];
      }
    }
    commentsDomFill()

    // обновляем данные с сервера на наличие нового комментария (каждые 10 сек)
    setInterval(async function () {
      const parentBlock = document.querySelector('.dialog__chat');
      const lastPhraseGroup = await getLastPhraseGroup();
      const commentsDb = Object.keys(lastPhraseGroup['comments']).length;
      const commentsDom = parentBlock.childNodes.length;
      if (commentsDb != commentsDom) {
        commentsDomFill('lastComm');
      }
    }, 10000);

    // рисуем календарь
    function calendar(id, year, month) {
      var Dlast = new Date(year, month + 1, 0).getDate(),
        D = new Date(year, month, Dlast),
        DNlast = new Date(D.getFullYear(), D.getMonth(), Dlast).getDay(),
        DNfirst = new Date(D.getFullYear(), D.getMonth(), 1).getDay(),
        calendar = '<tr>',
        month = [
          'Январь',
          'Февраль',
          'Март',
          'Апрель',
          'Май',
          'Июнь',
          'Июль',
          'Август',
          'Сентябрь',
          'Октябрь',
          'Ноябрь',
          'Декабрь',
        ];
      if (DNfirst != 0) {
        for (var i = 1; i < DNfirst; i++) calendar += '<td>';
      } else {
        for (var i = 0; i < 6; i++) calendar += '<td>';
      }
      for (var i = 1; i <= Dlast; i++) {
        const dateId = ('0' + i).slice(-2);
        const monthId = ('0' + (D.getMonth() + 1)).slice(-2);
        const yearId = new Date().getFullYear();
        const fullDate = dateId + `-` + monthId + `-` + yearId;
        if (
          i == new Date().getDate() &&
          D.getFullYear() == new Date().getFullYear() &&
          D.getMonth() == new Date().getMonth()
        ) {
          calendar += `<td id='${fullDate}' class='today calendar__date calendar__selected'>` + i;
        } else {
          calendar += `<td id='${fullDate}' class='calendar__date'>` + i;
        }
        if (new Date(D.getFullYear(), D.getMonth(), i).getDay() == 0) {
          calendar += '<tr>';
        }
      }
      for (var i = DNlast; i < 7; i++) calendar += '<td> ';
      document.querySelector('#' + id + ' tbody').innerHTML = calendar;
      document.querySelector('#' + id + ' thead td:nth-child(2)').innerHTML =
        month[D.getMonth()] + ' ' + D.getFullYear();
      document.querySelector(
        '#' + id + ' thead td:nth-child(2)'
      ).dataset.month = D.getMonth();
      document.querySelector('#' + id + ' thead td:nth-child(2)').dataset.year =
        D.getFullYear();
      if (document.querySelectorAll('#' + id + ' tbody tr').length < 6) {
        // чтобы при перелистывании месяцев не прыгала вся страница
        document.querySelector('#' + id + ' tbody').innerHTML +=
          '<tr><td> <td> <td> <td> <td> <td> <td> ';
      }
      calendarList = document.querySelector('.calendar__list');
    }
    calendar('calendar', new Date().getFullYear(), new Date().getMonth());
    // переключатель минус месяц
    document.querySelector(
      '#calendar thead tr:nth-child(1) td:nth-child(1)'
    ).onclick = function () {
      calendar(
        'calendar',
        document.querySelector('#calendar thead td:nth-child(2)').dataset.year,
        parseFloat(
          document.querySelector('#calendar thead td:nth-child(2)').dataset
            .month
        ) - 1
      );
      document.querySelector('.calendar__date').classList.add('calendar__selected');
      calendarList.removeEventListener('click', handleCalendarClick);
      menuCreate();
    };
    // переключатель плюс месяц
    document.querySelector(
      '#calendar thead tr:nth-child(1) td:nth-child(3)'
    ).onclick = function () {
      calendar(
        'calendar',
        document.querySelector('#calendar thead td:nth-child(2)').dataset.year,
        parseFloat(
          document.querySelector('#calendar thead td:nth-child(2)').dataset
            .month
        ) + 1
      );
      document.querySelector('.calendar__date').classList.add('calendar__selected');
      calendarList.removeEventListener('click', handleCalendarClick);
      menuCreate();
    };

    // пересчет суммы
    function totalRubCount() {
      allInputs = document.querySelectorAll('.menu__item-input');
      inputItem = document.querySelectorAll('.menu__item-input');
      cost = document.querySelectorAll('.menu__price-value');
      gsap.from('.order__total-rub', { opacity: 0, duration: 0.5 });
      let result = 0;
      for (let i = 0; i < allInputs.length; i++) {
        let inputQuan = inputItem[i].value;
        if (inputQuan == '') inputQuan = 0;
        const summ = inputQuan * cost[i].textContent;
        result = result + summ;
      }
      return result;
    }

    // вывод общей суммы долга
    const payBlock = document.querySelector('.order__debt');
    const payButton = document.querySelector('.order__debt-pay');
    let userDebtTemp = await userDebtToPay(hash);

    async function debtView() {
      userDebtTemp = await userDebtToPay(hash);
      const debtSumm = document.querySelector('.order__debt-summ');
      const ordersBackground = document.querySelector('.ordered');

      if (userDebtTemp == 0) {
        debtSumm.textContent = 'Отлично! Долгов нет.';
        payBlock.style.backgroundImage = 'url(../img/no-debt.png)';
        if (ordersBackground && ordersBackground.childNodes.length > 1) {
          ordersBackground.style.backgroundImage = `url('../img/paid.png')`;
          ordersBackground.style.pointerEvents = 'none';
        }
      } else {
        debtSumm.textContent = `Общий долг по еде: ${userDebtTemp} руб`;
        payBlock.style.backgroundImage = 'url(../img/debt.png)';
      }
    }
    debtView()

    // нажатие кнопки оплачено
    payButton.addEventListener('click', (e) => {
      if (userDebtTemp == 0) {
        alert(`Долгов нет!`);
        return;
      }
      if (confirm(`Точно оплачено? Итого: ${userDebtTemp} руб.`)) {
        ordersPaid(hash);
        userDebtTemp = 0;
        debtView();
      }
    })

    // отрисовываем МЕНЮ пользователю
    async function menuCreate(date) {

      // читаем и устанавливаем допустимое время заказа
      const timeOrder = await getOptionsTime();
      const warning = document.querySelector('.header__warning');
      warning.textContent = `Прием заказов до ${timeOrder}`;

      const obj = await getMenu();
      const container = document.querySelector('.menu');

      // ищем даты в календаре и делаем зелеными если есть в массиве
      for (let i = 0; i < obj.length; i++) {
        if (document.getElementById(obj[i].date) !== null) {
          dateToFind = document.getElementById(obj[i].date);
        }
        convertedDay = convertDateRev(dateToFind.id);

        // проверяем на наличие данных в БД и не раньше чем завтра
        if (
          dateToFind.id == obj[i].date &&
          convertedDay - new Date() > timeConvert(timeOrder)
        ) {
          dateToFind.classList.add('calendar__date-avalible');
        }
      }

      // ищем даты в календаре и ставим точки, если есть заказы
      const allOrders = await getOrders();
      let allDates;
      // проверяем, если выгрузка заказов пустая
      if (allOrders.length != 0) { allDates = Object.keys(allOrders[0]); }
      else allDates = 0;
      for (let i = 0; i < allDates.length; i++) {
        if (document.getElementById(allDates[i]) !== null) {
          const item = allOrders[0][allDates[i]];
          Object.keys(allOrders[0][allDates[i]]).forEach((user) => {
            if (user == hash) {
              for (let j in item) {
                if (Object.values(item[j]).length > 0) {
                  const calDate = document.getElementById(allDates[i]);
                  calDate.classList.add('calendar__date-ordered');
                }
              }
            }
          })
        }
      }

      // ставим по умолчанию ближайшее число
      const time = await getOptionsTime();
      const targetId = document.querySelector('.calendar__selected').id;

      // заполняем таблицу данными
      menuFill(targetId);
      async function menuFill(date) {
        // читаем и устанавливаем время заказа
        const timeOrder = await getOptionsTime();
        const warning = document.querySelector('.header__warning');
        warning.textContent = `Прием заказов до ${timeOrder}`;

        const dateInt = document.querySelector('.calendar__selected');

        const advTextBlock = document.querySelector('.adv__info-text');
        const advTextServ = await GetOption(2, 'adv');
        advTextBlock.textContent = advTextServ;
        // console.log(todayConvert(today(0))) // сегодня **-**-****
        // console.log(todayConvert(today(-1))) // вчера **-**-****
        // console.log(date); // выбранная дата **-**-****
        // console.log(timeConvert(timeHM())) // текущее время с начала дня в мс
        // console.log(timeConvert(await getOptionsTime())) // 11-40 в мс

        let j = 0;
        // чекаем дни с меню после 'сегодня'
        for (let i = 1; i < 10; i++) {
          // если в последующие дни есть меню
          if (obj.find((numb) => numb.date === todayConvert(today(i))) != undefined) {
            orderIdent = true;
            j++;
            // если проверяемая дата равна выбранной дате
            if (todayConvert(today(i)) == date) {
              // если день следующий и время в пределах нормы, а также если день дальше следующего, то отрисовываем меню
              if ((j == 1 && timeConvert(timeHM()) < timeConvert(await getOptionsTime())) || j > 1) {
                container.innerHTML = '';
                const objTemp = obj.findIndex((numb) => numb.date === date);
                const objTempItems = obj.filter(function (item) {
                  return item.date == date;
                });
                const weekDateDay = date.split('-')[0];
                const weekDateMonth = date.split('-')[1] - 1;
                const weekDateYear = date.split('-')[2];
                const totalDate = new Date(weekDateYear, weekDateMonth, weekDateDay);
                var days = [
                  'воскресенье',
                  'понедельник',
                  'вторник',
                  'среду',
                  'четверг',
                  'пятницу',
                  'субботу'
                ];

                const hello = document.createElement('h1');
                hello.classList.add('title');
                hello.textContent = `Привет, ${userName}!`;
                container.append(hello);

                const originalUrl = document.createElement('a');
                originalUrl.textContent = `Оригинальное меню`;
                originalUrl.href = `https://obedofficemoscow.ru/catalog/${date}/`;
                container.append(originalUrl);

                const mainTitle = document.createElement('h2');
                mainTitle.classList.add('menu__title');
                mainTitle.textContent = `Что есть на ${days[totalDate.getDay()]}`;
                container.append(mainTitle);

                const mainList = document.createElement('ul');
                mainList.classList.add('menu__list');
                container.append(mainList);
                let menuCat;
                for (let i = objTemp; i < objTemp + objTempItems.length; i++) {

                  // категория меню
                  if (obj[i].cat != menuCat) {
                    const menuItems = {
                      'menu72': 'Супчики',
                      'menu74': 'База',
                      'menu82': 'Чтобы не разжиреть',
                      'menu76': 'Хардкорные салаты, бутеры',
                      'menu78': 'Лайтовые салаты',
                      'menu77': 'Топпинги',
                      'menu75': 'Всякие вкусняхи',
                      'menu79': 'Ненужная хрень'
                    }
                    for (let val in menuItems) {
                      if (obj[i].cat == val) {
                        const menuCatTitle = document.createElement('h3');
                        mainList.append(menuCatTitle);
                        menuCatTitle.classList.add('menu__cat-title');
                        menuCatTitle.textContent = menuItems[val];
                      }

                    }
                  }
                  menuCat = obj[i].cat;

                  // секция
                  const mainItem = document.createElement('li');
                  mainItem.classList.add('menu__item');
                  mainItem.id = obj[i].id;
                  mainList.append(mainItem);

                  // фото
                  const mainItemFoto = document.createElement('div');
                  mainItemFoto.classList.add('menu__foto');
                  mainItem.append(mainItemFoto);

                  const fileName =
                    obj[i].image_url.split('/')[
                    obj[i].image_url.split('/').length - 1
                    ];
                  mainItemFoto.style.backgroundImage = `url('../img/menu/${date}/${fileName}')`;

                  // название
                  const mainItemName = document.createElement('p');
                  mainItemName.classList.add('menu__name');
                  mainItem.append(mainItemName);
                  mainItemName.textContent = obj[i].product_name;

                  // цена
                  const mainItemPrice = document.createElement('div');
                  mainItemPrice.classList.add('menu__price');
                  mainItem.append(mainItemPrice);

                  const mainItemPriceVol = document.createElement('span');
                  mainItemPriceVol.classList.add('menu__price-value');
                  mainItemPrice.append(mainItemPriceVol);

                  mainItemPriceVol.textContent = obj[i].price;

                  const mainItemRub = document.createElement('span');
                  mainItemRub.classList.add('menu__currency');
                  mainItemPrice.append(mainItemRub);

                  mainItemRub.textContent = 'руб.';

                  // ввод
                  const mainItemMinus = document.createElement('a');
                  mainItemMinus.classList.add('menu__item-minus');
                  mainItemMinus.textContent = '-';
                  mainItem.append(mainItemMinus);

                  const mainItemInput = document.createElement('input');
                  mainItemInput.classList.add('menu__item-input');
                  mainItem.append(mainItemInput);

                  const mainItemPlus = document.createElement('a');
                  mainItemPlus.classList.add('menu__item-plus');
                  mainItemPlus.textContent = '+';
                  mainItem.append(mainItemPlus);

                  // обработчики
                  // обработчик на +
                  const inputField = mainItem.querySelector('.menu__item-input');
                  const totalRub = document.querySelector('.order__total-rub');
                  mainItemPlus.addEventListener('click', () => {
                    inputField.value = Number(inputField.value) + 1;
                    totalRub.textContent = totalRubCount();
                  });

                  // обработчик на -
                  mainItemMinus.addEventListener('click', () => {
                    inputNumber = Number(inputField.value);
                    if (inputNumber !== 0) {
                      inputField.value = inputNumber - 1;
                      totalRub.textContent = totalRubCount();
                    } else return;
                    if (inputNumber == 1) inputField.value = '';
                  });

                  // обработчик на input
                  mainItemInput.addEventListener('input', () => {
                    totalRub.textContent = totalRubCount();
                  });

                  // анимация свиньи
                  pigDownAnimation();
                }
                break;
                // иначе меню не отображаем
              }
            }
          } else {
            container.innerHTML = '';
            const noMenu = document.createElement('p');
            const ordered = document.createElement('div');
            ordered.classList.add('ordered');
            container.prepend(ordered);
            noMenu.classList.add('no-menu');
            noMenu.textContent = 'Тут еды нет';
            container.append(noMenu);
            await statBuild(date);
            orderIdent = false;
          }
        }

        // если уже заказывалось ранее
        const ordered = document.createElement('div');
        let orders;
        async function orderFill() {
          const now = new Date();
          const dateNow = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0
          );
          ordered.classList.add('ordered');
          container.prepend(ordered);
          const orderedTitle = document.createElement('p');
          orderedTitle.classList.add('ordered__title');
          ordered.append(orderedTitle);
          const orders = await getUserOrdersByDate(date, hash); // читаем сохраненные заказы

          // блочим окно заказов, если нет меню
          if (orderIdent == false) ordered.style.pointerEvents = 'none';

          // считаем сумму
          let summ = 0;
          for (meal in orders) {
            if (meal == 'recomend') continue;
            const price = Object.values(orders[meal])[0];
            const quant = Object.values(orders[meal])[1];
            summ = summ + (Number(price) * Number(quant));
          };
          if (orders !== undefined) {
            if (Object.keys(orders).length > 0) orderedTitle.textContent = `На ${date} заказано:`;
            const ordersBackground = document.querySelector('.ordered');
            for (key in orders) {
              if (orders[key].paid == 'true') {
                ordersBackground.style.backgroundImage = `url('../img/paid.png')`;
                if (hash2 != admKey) ordersBackground.style.pointerEvents = 'none';
              }
              if (key == 'recomend') continue;
              const orderedList = document.createElement('ul');
              orderedList.classList.add('ordered__list');
              ordered.append(orderedList);
              const orderedItemName = document.createElement('li');
              orderedItemName.classList.add('ordered__list-name');
              orderedList.append(orderedItemName);
              orderedItemName.textContent = key;
              const orderedItemPrice = document.createElement('li');
              orderedList.append(orderedItemPrice);
              orderedItemPrice.textContent = orders[key]['price'] + ' руб';
              const orderedItemQuant = document.createElement('li');
              orderedList.append(orderedItemQuant);
              orderedItemQuant.textContent = orders[key]['quant'] + ' шт';
              const orderedItemDelete = document.createElement('button');
              orderedItemDelete.classList.add('ordered__btn');
              orderedList.append(orderedItemDelete);
              orderedItemDelete.textContent = 'удалить';
              if (hash2 == admKey) {
                orderedItemDelete.setAttribute('enabled', '');
                ordersBackground.style.pointerEvents = 'all';
              }
            }
            const orderedTotalWrap = document.createElement('div');
            orderedTotalWrap.classList.add('ordered__total-wrap');
            ordered.append(orderedTotalWrap);
            const orderedTotal = document.createElement('p');
            orderedTotal.classList.add('ordered__total');
            orderedTotalWrap.append(orderedTotal);
            if (document.querySelector('.ordered__list')) {
              gsap.from('.ordered__list', { opacity: 0, duration: 0.7 });
            }
            const orderedPay = document.createElement('INPUT');
            orderedPay.setAttribute('name', 'paid-check');
            orderedPay.setAttribute('type', 'checkbox');
            orderedPay.classList.add('ordered__pay-check');
            if (Object.keys(orders).length > 0) {
              orderedTotal.textContent = `Итого: ${summ} руб`;
            }
            // если есть рекомендация ИИ
            function recomendDisplay() {
              const orderedRecomendWrap = document.createElement('div');
              const orderedRecomendTitle = document.createElement('h3');
              const orderedRecomendText = document.createElement('p');
              const orderedRecomendSign = document.createElement('p');
              orderedRecomendWrap.classList.add('recomend__wrapper');
              orderedRecomendText.classList.add('recomend__text');
              ordered.append(orderedRecomendWrap);
              orderedRecomendWrap.append(orderedRecomendTitle);
              orderedRecomendWrap.append(orderedRecomendText);
              orderedRecomendWrap.append(orderedRecomendSign);
              orderedRecomendTitle.textContent = 'Бесплатный анализ обеда от специалиста';
              orderedRecomendText.textContent = orders.recomend;
              orderedRecomendSign.textContent = 'Ваш персональный нутрициолог на окладе, Евдокия Митрофановна';
            }
            if (orders.recomend) {
              recomendDisplay();
            }

            // иначе крутим спиннер
            else {
              const orderedSpinWrapper = document.createElement('div');
              const orderedSpin = document.createElement('div');
              const orderedSpinText = document.createElement('p');
              orderedSpinWrapper.classList.add('recomend__spinner-wrapper');
              orderedSpin.classList.add('recomend__spinner');
              orderedSpinText.textContent = 'Формируется анализ обеда ...';
              ordered.append(orderedSpinWrapper);
              orderedSpinWrapper.append(orderedSpin);
              orderedSpinWrapper.append(orderedSpinText);
              // раз в секунду проверяем не появился ли анализ
              let i = 1
              const interval = setInterval(async function checkRecomend() {
                const orders = await getUserOrdersByDate(date, hash);
                if (orders && orders.recomend) {
                  orderedSpinWrapper.style.display = 'none';
                  recomendDisplay();
                  clearInterval(interval);
                  const text = document.querySelector('.recomend__text');
                  text.textContent = orders.recomend;
                }
                if (i > 68) {
                  orderedSpin.style.display = 'none';
                  orderedSpinText.textContent = 'Анализ этого обеда недоступен ...';
                  clearInterval(interval);
                }
                i++;
              }, 1000);
            }
          }
        }
        orderFill();

        // удалить заказанное
        ordered.addEventListener('click', async (event) => {
          const orders = await getUserOrdersByDate(date, hash);

          if (event.target.className == 'ordered__btn') {
            const target = event.target;
            const meal = target.parentNode.querySelector('.ordered__list-name').textContent;
            if (Object.keys(orders).length <= 2) {
              document.getElementById(date).classList.remove('calendar__date-ordered');
              deleteOrder(date, hash, 'recomend');
            }
            deleteOrder(date, hash, meal);
            ordered.innerHTML = '';
            orderFill();
            debtView();
          } else return;
        });
      }

      // слушалка календаря
      handleCalendarClick = (event) => {
        calendarList = document.querySelector('.calendar__list');
        const calendarListDate = calendarList.querySelectorAll('.calendar__date');
        const targetId = event.target;
        calendarListDate.forEach(function (item) {
          item.classList.remove('calendar__selected');
        });
        if (targetId.id != '') {
          targetId.classList.add('calendar__selected');
          const totalRub = document.querySelector('.order__total-rub');
          totalRub.textContent = '';
        }

        menuFill(targetId.id);
      };
      calendarList.addEventListener('click', handleCalendarClick);
    }

    // слушалка кнопки ЗАКАЗАТЬ
    orderBtn.addEventListener('click', async (e) => {
      // если заказ уже оплачен, то блок повторного заказа
      const orderedDiv = document.querySelectorAll('.ordered');
      if (orderedDiv[0].style[0] && hash2 != admKey) {
        return;
      }
      const inputsAll = document.querySelectorAll('.menu__item-input');
      const date = document.querySelector('.calendar__selected').id;

      let j = 0;
      const obj = await getMenu();
      // защита от заказа на завтра позже допустимого времени
      for (let i = 1; i < 10; i++) {
        // если в последующие дни есть меню
        if (obj.find((numb) => numb.date === todayConvert(today(i))) != undefined) {
          orderIdent = true;
          j++;
          // если проверяемая дата равна выбранной дате
          if (todayConvert(today(i)) == date) {
            // если день следующий и время в пределах нормы, а также если день дальше следующего, то отрисовываем меню
            if ((j == 1 && timeConvert(timeHM()) < timeConvert(await getOptionsTime())) || j > 1) {
              const orderedBefore = await getUserOrdersByDate(date, hash);
              let massive = {};
              inputsAll.forEach((item) => {
                const quant = item.value;
                if (quant != '' || quant != 0) {
                  if (quant > 10) quant = 10;
                  const parent = item.parentNode;
                  const foodName = parent.querySelector('.menu__name').textContent;
                  const foodPrice = parent.querySelector('.menu__price-value').textContent;
                  if (orderedBefore != undefined) {
                    Object.keys(orderedBefore).forEach((item) => {
                      if (item == foodName) {
                        quant = Number(quant) + Number(orderedBefore[item].quant);
                      }
                    })
                  }
                  Object.assign(massive, { [foodName]: { 'price': foodPrice, 'quant': quant, 'paid': 'false' } });
                }
              })
              if (Object.keys(massive).length != 0) {
                createOrder(date, hash, massive);
                document.getElementById(date).classList.add('calendar__date-ordered');
                container.innerHTML = '';
                const totalRub = document.querySelector('.order__total-rub');
                totalRub.textContent = '';
                const button = document.getElementById(date);
                button.click();
                debtView();
              }
            }
          }
        }
      }
    });
    menuCreate();
  } else {
    const chatHide = document.querySelector('.dialog__wrapper');
    chatHide.style.display = 'none';
    const advHide = document.querySelector('.adv__block');
    advHide.style.display = 'none';
    const helloBlock = document.querySelector('.menu__hello');
    helloBlock.style.display = 'initial';
  }

})();
