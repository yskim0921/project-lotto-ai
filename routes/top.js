// routes/top.js
const express = require('express');
const router = express.Router();

// GET / → 메인 페이지
router.get('/', (req, res) => {
  res.render('index'); 
});

module.exports = router;
