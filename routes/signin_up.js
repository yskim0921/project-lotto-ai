// routes/products.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');


// ===== Routes =====

router.get('/', (req, res) => {
  res.render('signin_up/signin_up.ejs');
});

// 회원가입 처리
router.post('/signin_up', async (req, res) => {
  const db = req.db;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력하세요." });
  }

  try {
    const users = db.collection("users");

    // 중복 아이디 체크
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "이미 존재하는 아이디입니다." });
    }

    // MongoDB에 저장
    await users.insertOne({ username, password });

    res.json({ message: "회원가입 성공!" });
  } catch (err) {
    res.status(500).json({ error: "회원가입 실패", details: err.message });
  }
});

module.exports = router;
