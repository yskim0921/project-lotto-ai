// ========================================
// AI 로또 분석 애플리케이션 - 메인 서버 설정
// ========================================

// 필수 모듈 import
const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectDB } = require('./db');

// Express 애플리케이션 인스턴스 생성
const app = express();

// ========================================
// 데이터베이스 연결 설정
// ========================================
let db;
(async () => {
  try {
    db = await connectDB();
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
  }
})();

// 모든 라우터에서 데이터베이스 접근 가능하도록 미들웨어 설정
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ========================================
// 정적 파일 및 뷰 엔진 설정
// ========================================

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, 'public')));

// 업로드된 파일 서빙 설정 (이미지 파일 등)
app.use('/upload', express.static(path.join(__dirname, 'public', 'upload', 'product')));

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========================================
// 미들웨어 설정
// ========================================

// URL 인코딩된 데이터 파싱 (폼 데이터 처리)
app.use(express.urlencoded({ extended: true }));

// JSON 데이터 파싱 (API 요청 처리)
app.use(express.json());

// 세션 설정
app.use(
  session({
    secret: 'secret-for-shop-admin',        // 세션 암호화 키
    resave: false,                          // 세션 변경사항이 없어도 저장하지 않음
    saveUninitialized: true,                // 초기화되지 않은 세션도 저장
    cookie: { 
      maxAge: 1000 * 60 * 10               // 세션 유효시간: 10분
    },
  })
);

// 세션 정보를 모든 뷰에서 사용할 수 있도록 설정
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ========================================
// 라우터 등록
// ========================================

// 각 기능별 라우터 import
const lottoRouter = require('./routes/lotto');          // 로또 번호분석
const temp1Router = require('./routes/temp1');          // 이용 방법
const temp2Router = require('./routes/temp2');          // 지난주 당첨번호
const mind_num_matRouter = require('./routes/mind_num_mat'); // 감정숫자 분류
const aiSecRouter = require('./routes/aiSec');          // 챗봇 AI 상담
const productRouter = require('./routes/products');      // 후기 게시판
const customerRouter = require('./routes/customer');    // 고객 센터
const topRouter = require('./routes/top');              // 메인 페이지
const adminRouter = require('./routes/admin');          // 관리자 기능

// 라우터 경로 설정
app.use('/lotto', lottoRouter);             // /lotto/* - 로또 번호분석
app.use('/temp1', temp1Router);             // /temp1/* - 이용 방법
app.use('/temp2', temp2Router);             // /temp2/* - 지난주 당첨번호
app.use('/mind_num_mat', mind_num_matRouter); // /mind_num_mat/* - 감정숫자 분류
app.use('/aiSec', aiSecRouter);             // /aiSec/* - 챗봇 AI 상담
app.use('/product', productRouter);         // /product/* - 후기 게시판
app.use('/customer', customerRouter);       // /customer/* - 고객 센터
app.use('/admin', adminRouter);             // /admin/* - 관리자 기능
app.use('/', topRouter);                    // / - 메인 페이지

// ========================================
// 에러 처리 미들웨어
// ========================================

// 404 에러 처리 - 정의되지 않은 경로
app.use((req, res, next) => {
  res.status(404).render('error/404');
});

// 전역 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('🚨 서버 에러 발생:', err);
  
  // 개발 환경에서는 상세한 에러 정보 제공
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  // 프로덕션 환경에서는 일반적인 에러 메시지만 제공
  res.status(500).render('error/500');
});

// ========================================
// 모듈 내보내기
// ========================================
module.exports = app;