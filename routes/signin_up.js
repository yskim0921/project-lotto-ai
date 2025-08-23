// ================================
// signin_up.js (회원가입/로그인 라우터)
// ================================

// Node.js 및 Express 관련 모듈
const path = require('path');       // 경로 처리용
const fs = require('fs');           // 파일 시스템 접근용 (추후 프로필 이미지 등 파일 처리 시 사용)
const multer = require('multer');   // 파일 업로드용 (추후 회원 프로필 이미지 업로드 등)
const { ObjectId } = require('mongodb'); // MongoDB ObjectId 사용
const express = require('express');
const router = express.Router();     // 라우터 객체 생성

// ================================
// 회원가입/로그인 페이지 렌더링
// GET /signin_up
// ================================
router.get('/', (req, res) => {
  // signin_up.ejs 파일을 렌더링하여 브라우저에 회원가입/로그인 폼 표시
  res.render('signin_up/signin_up.ejs');
});

// ================================
// 회원가입 처리 + 자동로그인
// POST /signin_up/signup
// ================================
// router.post('/signup', async (req, res) => {
//   const db = req.db;  // app.js에서 연결된 MongoDB 객체 접근
//   const { username, email, password } = req.body; // 회원가입 폼에서 전달된 데이터

//   // 필수 입력값 검증
//   if (!username || !email || !password) {
//     return res.status(400).json({ error: "아이디, 이메일, 비밀번호를 모두 입력하세요." });
//   }

//   try {
//     const users = db.collection("users"); // users 컬렉션 접근

//     // 이메일 중복 체크 (동일 이메일 회원가입 방지)
//     const existingUser = await users.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: "이미 존재하는 이메일입니다." });
//     }

//     // 회원 정보 MongoDB에 저장
//     const member = await users.insertOne({ username, email, password });
//     // ✅ 자동 로그인: 세션에 사용자 정보 저장
//     req.session.user = { _id: member.insertedId, username, email };
//     // 성공 시 JSON 응답 반환
//     // res.json({ message: "회원가입 성공!", redirect:"/"});
//     res.redirect("/");
//   } catch (err) {
//     // DB 저장 오류 처리
//     res.status(500).json({ error: "회원가입 실패", details: err.message });
//   }
// });

// ================================
// 로그인 처리
// POST /signin_up/signin
// ================================
router.post('/signin', async (req, res) => {
  const db = req.db;  // MongoDB 접근
  const { username, password } = req.body; // 로그인 폼에서 전달된 이메일/비밀번호

  // 필수 입력값 검증
  if (!username || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
  }

  try {
    const users = db.collection("users");

    // 이메일과 비밀번호 일치 여부 확인
    const user = await users.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

    // 로그인 성공 시 세션에 사용자 정보 저장
    req.session.user = {
      id: user._id,
      username: user.username,
      // email: user.email,
    };

    console.log("로그인 후 세션:", req.session);

    // ✅ 세션 확실히 저장 후 리다이렉트
    req.session.save((err) => {
      if (err) {
        console.error("세션 저장 실패:", err);
        return res.status(500).send("세션 저장 실패");
      }
      console.log("userid:", req.session.user.id);
      res.redirect("/");
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "로그인 실패", details: err.message });
  }
});

// ================================
// 로그아웃 처리
// GET /signin_up/logout
// ================================
router.get('/logout', (req, res) => {
  // 세션 삭제 후 로그인 페이지로 리다이렉트
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "로그아웃 실패" });
    }
    res.redirect('/signin_up');
  });
});

// 모듈 export
module.exports = router;
