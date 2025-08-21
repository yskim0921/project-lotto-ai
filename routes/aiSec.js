// routes/products.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');


// ===== Routes =====

router.get('/', (req, res) => {
  res.render('aiSec/aiSec.ejs');
});

module.exports = router;
