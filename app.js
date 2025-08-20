// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectDB } = require('./db'); // MongoDB 연결
const app = express();
const temp2Router = require('./routes/temp2');
// ===== MongoDB 연결 =====
let db;
(async () => {
  db = await connectDB();
})();
// 모든 라우터에서 db 접근 가능
app.use((req, res, next) => {
  req.db = db;
  next();
});
// ===== View & Static =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'public', 'upload', 'product')));
app.use(express.urlencoded({ extended: true }));
app.use('/temp2', temp2Router);
app.use(express.json()); // JSON body 처리 (:경고: 필수)
// ===== Session =====
app.use(
  session({
    secret: 'secret-for-shop-admin',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 10 },
  })
);
// ===== Router 등록 =====
const productRouter = require('./routes/products');
const lottoRouter = require('./routes/lotto');
const temp1Router = require('./routes/temp1');
const temp3Router = require('./routes/temp3');
const temp4Router = require('./routes/temp4');
app.use('/product', productRouter);
app.use('/lotto', lottoRouter);
app.use('/temp1', temp1Router);
app.use('/temp2', temp2Router);
app.use('/temp3', temp3Router);
app.use('/temp4', temp4Router);
module.exports = app;