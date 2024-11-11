# app.tavern

Food order application

Tavern is a localhost application for ordering food. Unfortunately, food delivery services to offices offer only a single personal account or an order form. Usually, such services deliver when ordering for a certain amount - lunches for 5-10 people.

Collecting orders from 5 people and sending them to the service is not so difficult, but if there are already 10-20 or more, then this becomes a problem, especially since the lunch is not a set, but is collected independently.

Tavern is an intermediate application between the user and the food delivery service, accumulating their orders and forming a single array for sending.

Real use of the application > 30 users

**Goals**

Implementation of the acquired knowledge in studying JavaScript (beginner level), HTML, CSS. Practice.

Make it easier for users to order food.

Make it easier for the person in charge to consolidate orders.

**Tasks**

Ensure uninterrupted formation of the current menu as it is updated in the service

Save the order history, the ability to edit unsent orders

Ensure the ability to mark the payment of the order to the responsible person

Combine all orders into a single data array

**Brief background**

A page was created in Google docs, divided into days of the week, where users inserted their name and the desired list of dishes, copied from the service website.

The responsible person downloaded the order form from the service in xls format, using the COUNTIF function collected dishes into a single order and sent it to the service daily.

Disadvantages of such work: errors when manually copying the names of dishes by users, creating a new table for the next week, lack of confidentiality, the ability to correct other people's orders, inconvenience of payment, etc.

**Application capabilities**

- parsing the service website
- downloading order forms during parsing, converting xls files to json
- displaying the menu for each day, divided into categories (photo, name, price)
- the ability to place an order and edit it BEFORE the end of accepting applications
- the ability to mark the payment of completed and uncompleted orders
- receiving a humorous recommendation from AI regarding the set of food in the order
- daily statistical report
- simple chat for discussing the topic designated by the responsible
- an admin panel has been implemented, where consolidated orders are collected, user management, order deadline settings, etc.

**What can be improved**

Considering that I made this application immediately after completing the Frontend JavaScript Basic course, I lacked knowledge of a large amount of information, such as the implementation of the backend part, working with dependencies, etc. I had to search a lot on the Internet for similar examples of implementation.
After some time, we can say more precisely about the shortcomings:

- a more correct implementation of the backend part is needed, testing, work with processing and output of errors
- no work with promise
- classes are not used
- the code is not optimized and not minified

**Installation**

Install dependencies
npm i

Start server
node app.js

Change URL const in harchevna/js/main.js to your local IP

Admin page
URL/?admin

Menu load
parse button from admin page

**Other**

Adaptive is not provided, since users do not have access to the local network from mobile devices.

Link to the parent service: [https://obedofficemoscow.ru/](https://obedofficemoscow.ru/)

There is no link to the application, it is intended for work in a local network.

**Order page screenshot**
![Tavern order page screenshot](http://_github-images.host1438437.hostland.pro/tavern-order.png)

**Admin page screenshot**
![Tavern admin page screenshot](http://_github-images.host1438437.hostland.pro/tavern-admin.png)
