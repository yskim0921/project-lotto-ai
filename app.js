// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectDB } = require('./db'); // MongoDB 연결
const app = express();
const temp2Router = require('./routes/temp2');


// ===== MongoDB 연결 =====
// let db;
(async () => {
  db = await connectDB();
})();
// 모든 라우터에서 db 접근 가능
app.use((req, res, next) => {
  req.db = db;
  next();
});
// ===== View & Static =====
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'public', 'upload', 'product')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use('/temp2', temp2Router);
app.use(express.json()); // JSON body 처리 (:경고: 필수)
// ===== Session =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
const mind_num_matRouter = require('./routes/mind_num_mat');
const aiSecRouter = require('./routes/aiSec');
const signin_upRouter = require('./routes/signin_up');
const customerRouter = require('./routes/customer');

app.use('/product', productRouter);
app.use('/lotto', lottoRouter);
app.use('/temp1', temp1Router);
app.use('/temp2', temp2Router);
app.use('/mind_num_mat', mind_num_matRouter);
app.use('/aiSec', aiSecRouter);
app.use('/signin_up', signin_upRouter);
app.use('/customer', customerRouter);



module.exports = app;