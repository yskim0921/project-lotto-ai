const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const { checkAdmin } = require('../middleware/auth');

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
const upload = multer({ storage });

// ===== Routes =====

// 등록 폼
router.get('/upload', (req, res) => {
    res.render('product/product_fileupload');
});

// 목록 페이지 (페이지네이션 적용)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 6;
        const skip = (page - 1) * itemsPerPage;

        const totalReviews = await req.db.collection('comment').countDocuments({});
        const totalPages = Math.ceil(totalReviews / itemsPerPage);

        const products = await req.db.collection('comment')
            .find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(itemsPerPage)
            .toArray();

        res.render('product/products', { 
            products,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        console.error('후기 목록 조회 중 오류 발생:', err);
        res.status(500).send('DB 조회 중 오류');
    }
});

// 업로드 처리
router.post('/upload', upload.single('filename'), async (req, res) => {
    try {
        const { name, price, content } = req.body;
        const filename = req.file ? req.file.filename : null;

        const result = await req.db.collection('comment').insertOne({
            name,
            price: Number(price),
            content,
            filename,
            createdAt: new Date(),
        });

        return res.redirect(`/product/${result.insertedId}`);
    } catch (err) {
        console.error('파일 업로드/DB 저장 중 오류:', err);
        res.status(500).send('파일 업로드/DB 저장 중 오류');
    }
});

// 상세 페이지
router.get('/:id', async (req, res) => {
    try {
        const product = await req.db
            .collection('comment')
            .findOne({ _id: new ObjectId(req.params.id) });
        if (!product) {
            return res.redirect('/product');
        }
        res.render('product/viewpage2', product);
    } catch (err) {
        console.error('상세 조회 중 오류:', err);
        res.status(500).send('상세 조회 중 오류');
    }
});

// 후기 삭제 (DELETE 요청 처리) - 관리자 권한 필요
router.delete('/:id', checkAdmin, async (req, res) => {
    try {
        const result = await req.db.collection('comment').deleteOne({
            _id: new ObjectId(req.params.id)
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: '후기를 찾을 수 없습니다.' });
        }
        
        res.json({ message: '후기가 삭제되었습니다.' });
    } catch (err) {
        console.error('후기 삭제 중 오류:', err);
        res.status(500).json({ error: '후기 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
