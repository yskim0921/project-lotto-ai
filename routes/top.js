// routes/top.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');

// GET / → 메인 페이지
router.get('/', (req, res) => {
  // index.ejs에서 top.ejs를 include해서 렌더링
  res.render('index'); 
});

module.exports = router;