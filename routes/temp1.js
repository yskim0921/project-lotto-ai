// routes/products.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');


// ===== Routes =====

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/preuse.html'));
});


module.exports = router;
