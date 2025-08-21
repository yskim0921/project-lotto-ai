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

// 후기 삭제 (DELETE 요청 처리)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: '유효하지 않은 후기 ID입니다.' });
        }

        const result = await req.db.collection('comment').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: '후기를 찾을 수 없거나 이미 삭제되었습니다.' });
        }

        res.status(200).json({ message: '후기가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('후기 삭제 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류로 후기 삭제에 실패했습니다.', error: error.message });
    }
});

// 📌 새로운 라우터: 특정 후기의 댓글 가져오기 (GET)
router.get('/:reviewId/comments', async (req, res) => {
    try {
        const { reviewId } = req.params;
        if (!ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: '유효하지 않은 후기 ID입니다.' });
        }
        // 'comments' 컬렉션에서 해당 reviewId를 가진 댓글들을 최신순으로 가져옵니다.
        const comments = await req.db.collection('comments')
                               .find({ reviewId: new ObjectId(reviewId) })
                               .sort({ createdAt: -1 }) // 최신 댓글이 위에 오도록 정렬
                               .toArray();
        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 조회 중 오류 발생:', error);
        res.status(500).json({ message: '댓글 조회에 실패했습니다.', error: error.message });
    }
});

// 📌 새로운 라우터: 특정 후기에 댓글 추가 (POST)
router.post('/:reviewId/comments', async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { author, content } = req.body; // 클라이언트에서 전송된 작성자, 내용

        if (!ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: '유효하지 않은 후기 ID입니다.' });
        }
        if (!author || !content) {
            return res.status(400).json({ message: '작성자 또는 댓글 내용이 비어있습니다.' });
        }

        const newComment = {
            reviewId: new ObjectId(reviewId), // 어떤 후기에 대한 댓글인지 참조
            author: author,
            content: content,
            createdAt: new Date() // 댓글 작성 시간
        };

        const result = await req.db.collection('comments').insertOne(newComment);
        res.status(201).json({ message: '댓글이 성공적으로 등록되었습니다.', commentId: result.insertedId });
    } catch (error) {
        console.error('댓글 등록 중 오류 발생:', error);
        res.status(500).json({ message: '댓글 등록에 실패했습니다.', error: error.message });
    }
});

// 📌 새로운 라우터: 특정 댓글 삭제 (DELETE)
router.delete('/:reviewId/comments/:commentId', async (req, res) => {
    try {
        const { reviewId, commentId } = req.params; // 후기 ID와 댓글 ID를 모두 받음

        if (!ObjectId.isValid(reviewId) || !ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
        }

        // 해당 reviewId에 속하는 commentId를 가진 댓글 삭제
        const result = await req.db.collection('comments').deleteOne({ 
            _id: new ObjectId(commentId),
            reviewId: new ObjectId(reviewId) // 해당 후기의 댓글인지 확인하는 조건 추가
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: '댓글을 찾을 수 없거나 이미 삭제되었습니다.' });
        }

        res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('댓글 삭제 중 오류 발생:', error);
        res.status(500).json({ message: '댓글 삭제에 실패했습니다.', error: error.message });
    }
});

module.exports = router;
