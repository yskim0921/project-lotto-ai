// routes/mind_num_mat.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const matching_emotions = require('../public/js/mind_emotion');

// ===== Routes =====
// /mind_num_mat 경로에 대한 라우터
router.get('/', (req, res) => {
    // EJS에서 사용하는 변수명 matching_emotion_number로 전달
    res.render('mind_num_mat/mind_num_mat.ejs', {
        matching_emotion_number: matching_emotions
    });
});

module.exports = router;
