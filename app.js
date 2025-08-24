// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectDB } = require('./db'); // MongoDB 연결
const app = express();


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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'public', 'upload', 'product')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== Session =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // JSON body 처리 (:경고: 필수)
app.use(
  session({
    secret: 'secret-for-shop-admin',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 10 },
  })
);
//관리자 로그인
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
// ===== Router 등록 =====
const productRouter = require('./routes/products');
const lottoRouter = require('./routes/lotto');
const temp1Router = require('./routes/temp1');
const temp2Router = require('./routes/temp2');
const mind_num_matRouter = require('./routes/mind_num_mat');
const aiSecRouter = require('./routes/aiSec');
const customerRouter = require('./routes/customer');
const topRouter = require('./routes/top');
const adminRouter = require('./routes/admin');

app.use('/product', productRouter);
app.use('/lotto', lottoRouter);
app.use('/temp1', temp1Router);
app.use('/temp2', temp2Router);
app.use('/mind_num_mat', mind_num_matRouter);
app.use('/aiSec', aiSecRouter);
app.use('/customer', customerRouter);
app.use('/admin', adminRouter);
app.use('/', topRouter);

// ===== 에러 핸들러 =====
// 404 에러 처리
app.use((req, res, next) => {
  res.status(404).render('error/404');
});

// 500 에러 처리
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).render('error/500');
});

module.exports = app;