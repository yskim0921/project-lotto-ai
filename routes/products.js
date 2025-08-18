// routes/products.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');

// ===== Multer 설정 =====
const uploadDir = path.join(__dirname, '..', 'public', 'upload', 'product');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^\w\-]+/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ===== Routes =====

// 등록 폼
router.get('/upload', (req, res) => {
  res.render('product/product_fileupload');
});

// 목록 페이지
router.get('/', async (req, res) => {
  try {
    const products = await req.db.collection('comment').find().sort({ _id: -1 }).toArray();
    res.render('product/products', { products });
  } catch (err) {
    console.error(err);
    res.status(500).send('DB 조회 중 오류');
  }
});

// 업로드 처리
router.post('/upload', upload.single('filename'), async (req, res) => {
  try {
    const { name, price, content } = req.body;
    const filename = req.file ? req.file.filename : null;

    req.session.product = { name, price, content, filename };

    const result = await req.db.collection('comment').insertOne({
      name,
      price: Number(price),
      content,
      filename,
      createdAt: new Date(),
    });

    return res.redirect(`/product/${result.insertedId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('파일 업로드/DB 저장 중 오류');
  }
});

// 상세 페이지
router.get('/:id', async (req, res) => {
  try {
    const product = await req.db
      .collection('comment')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!product) return res.redirect('/product');
    res.render('product/viewpage2', product);
  } catch (err) {
    console.error(err);
    res.status(500).send('상세 조회 중 오류');
  }
});

module.exports = router;
