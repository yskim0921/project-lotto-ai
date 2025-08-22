const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// GET: 고객센터 페이지 렌더링
router.get('/', (req, res) => {
    res.render('customer/inquiry'); // views/customer/inquiry.ejs 렌더링
});

// GET: 모든 불만사항/제안 가져오기 (최신순)
router.get('/inquiries', async (req, res) => {
    console.log('Server: /customer/inquiries API hit.'); 
    try {
        if (!req.db) {
            console.error('Server Error: Database connection (req.db) is not available.'); 
            return res.status(500).json({ message: 'Database connection not established.' });
        }
        // 📌 'inquiries' -> 'inquiry'로 변경
        const inquiries = await req.db.collection('inquiry') 
                                 .find({})
                                 .sort({ createdAt: -1 })
                                 .toArray();
        console.log(`Server: Successfully fetched ${inquiries.length} inquiries.`); 
        res.status(200).json(inquiries);
    } catch (error) {
        console.error('Server Error in /customer/inquiries:', error); 
        res.status(500).json({ message: '문의사항을 불러오지 못했습니다.', error: error.message }); 
    }
});

// POST: 새로운 불만사항/제안 등록
router.post('/inquiries', async (req, res) => {
    try {
        const { author, title, content } = req.body;
        if (!author || !title || !content) {
            return res.status(400).json({ message: '작성자, 제목, 내용을 모두 입력해주세요.' });
        }

        const newInquiry = {
            author: author,
            title: title,
            content: content,
            resolved: false, // 초기 상태는 해결되지 않음
            createdAt: new Date()
        };

        // 📌 'inquiries' -> 'inquiry'로 변경
        const result = await req.db.collection('inquiry').insertOne(newInquiry);
        res.status(201).json({ message: '문의사항이 성공적으로 등록되었습니다.', inquiryId: result.insertedId });
    } catch (error) {
        console.error('문의사항 등록 실패:', error);
        res.status(500).json({ message: '문의사항 등록에 실패했습니다.', error: error.message }); 
    }
});

// PUT: 불만사항/제안 해결 상태 업데이트
router.put('/inquiries/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const { resolved } = req.body; 

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
        }

        // 📌 'inquiries' -> 'inquiry'로 변경
        const result = await req.db.collection('inquiry').updateOne(
            { _id: new ObjectId(id) },
            { $set: { resolved: resolved } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: '문의사항을 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '해결 상태가 업데이트되었습니다.' });
    } catch (error) {
        console.error('해결 상태 업데이트 실패:', error);
        res.status(500).json({ message: '해결 상태 업데이트에 실패했습니다.', error: error.message }); 
    }
});

// DELETE: 불만사항/제안 삭제 (관련 댓글도 함께 삭제)
router.delete('/inquiries/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
        }

        // 1. 해당 문의사항 삭제
        // 📌 'inquiries' -> 'inquiry'로 변경
        const inquiryResult = await req.db.collection('inquiry').deleteOne({ _id: new ObjectId(id) });
        if (inquiryResult.deletedCount === 0) {
            return res.status(404).json({ message: '문의사항을 찾을 수 없습니다.' });
        }

        // 2. 해당 문의사항에 연결된 모든 댓글 삭제 (이 부분은 컬렉션 이름이 'inquiry_comments'로 올바르다면 유지합니다.)
        await req.db.collection('inquiry_comments').deleteMany({ inquiryId: new ObjectId(id) });

        res.status(200).json({ message: '문의사항 및 관련 댓글이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('문의사항 삭제 실패:', error);
        res.status(500).json({ message: '문의사항 삭제에 실패했습니다.', error: error.message }); 
    }
});

// --- 댓글 관련 API (이 부분은 컬렉션 이름이 'inquiry_comments'로 올바르다면 유지합니다.) ---

// GET: 특정 불만사항/제안의 댓글 가져오기 (페이지네이션 적용)
router.get('/inquiries/:inquiryId/comments', async (req, res) => {
    console.log('Server: /inquiries/:inquiryId/comments API hit.'); 
    try {
        const { inquiryId } = req.params;
        const page = parseInt(req.query.page) || 1; 
        const commentsPerPage = 5; 

        if (!ObjectId.isValid(inquiryId)) {
            return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
        }

        const totalComments = await req.db.collection('inquiry_comments').countDocuments({ inquiryId: new ObjectId(inquiryId) });
        const totalPages = Math.ceil(totalComments / commentsPerPage);
        const skip = (page - 1) * commentsPerPage;

        const comments = await req.db.collection('inquiry_comments')
                                 .find({ inquiryId: new ObjectId(inquiryId) })
                                 .sort({ createdAt: 1 }) 
                                 .skip(skip)
                                 .limit(commentsPerPage)
                                 .toArray();
        console.log(`Server: Fetched ${comments.length} comments for inquiry ${inquiryId}, page ${page}. Total comments: ${totalComments}`); 
        res.status(200).json({ 
            comments: comments,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Server Error in /inquiries/:inquiryId/comments:', error); 
        res.status(500).json({ message: '댓글을 불러오지 못했습니다.', error: error.message }); 
    }
});

// POST: 특정 불만사항/제안에 댓글 추가
router.post('/inquiries/:inquiryId/comments', async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const { author, content } = req.body; 

        if (!ObjectId.isValid(inquiryId)) {
            return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
        }
        if (!content) { 
            return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
        }

        const newComment = {
            inquiryId: new ObjectId(inquiryId),
            author: author || '관리자', 
            content: content,
            createdAt: new Date()
        };

        const result = await req.db.collection('inquiry_comments').insertOne(newComment);
        res.status(201).json({ message: '댓글이 성공적으로 등록되었습니다.', commentId: result.insertedId });
    } catch (error) {
        console.error('댓글 등록 실패:', error);
        res.status(500).json({ message: '댓글 등록에 실패했습니다.', error: error.message }); 
    }
});

// DELETE: 특정 댓글 삭제
router.delete('/inquiries/:inquiryId/comments/:commentId', async (req, res) => {
    try {
        const { inquiryId, commentId } = req.params;

        if (!ObjectId.isValid(inquiryId) || !ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
        }

        const result = await req.db.collection('inquiry_comments').deleteOne({
            _id: new ObjectId(commentId),
            inquiryId: new ObjectId(inquiryId) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: '댓글을 찾을 수 없거나 이미 삭제되었습니다.' });
        }
        res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        res.status(500).json({ message: '댓글 삭제에 실패했습니다.', error: error.message }); 
    }
});

// PUT /customer/inquiries/:inquiryId/comments/:commentId - 댓글 수정 API
router.put('/inquiries/:inquiryId/comments/:commentId', async (req, res) => {
    try {
        const { inquiryId, commentId } = req.params;
        const { content } = req.body;

        if (!ObjectId.isValid(inquiryId) || !ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
        }
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
        }

        const result = await req.db.collection('inquiry_comments').updateOne(
            { 
                _id: new ObjectId(commentId),
                inquiryId: new ObjectId(inquiryId)
            },
            { $set: { content: content.trim(), updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: '댓글을 찾을 수 없거나 권한이 없습니다.' });
        }
        res.status(200).json({ message: '댓글이 성공적으로 수정되었습니다.' });
    } catch (error) {
        console.error('댓글 수정 실패:', error);
        res.status(500).json({ message: '댓글 수정에 실패했습니다.', error: error.message });
    }
});

// 📌 PUT /customer/inquiries/:id - 문의글 수정 API
router.put('/inquiries/:id', async (req, res) => {
    try {
        const inquiryId = req.params.id;
        const { author, title, content } = req.body;

        if (!ObjectId.isValid(inquiryId)) {
            return res.status(400).json({ message: '유효하지 않은 문의 ID입니다.' });
        }
        if (!author || !title || !content) {
            return res.status(400).json({ message: '작성자, 제목, 내용을 모두 입력해주세요.' });
        }

        // 📌 'inquiries' -> 'inquiry'로 변경
        const result = await req.db.collection('inquiry').updateOne(
            { _id: new ObjectId(inquiryId) },
            { $set: { author: author, title: title, content: content, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: '문의글을 찾을 수 없습니다.' });
        }
        res.status(200).json({ message: '문의글이 성공적으로 수정되었습니다.' });
    } catch (error) {
        console.error('문의글 수정 실패:', error);
        res.status(500).json({ message: '문의글 수정에 실패했습니다.', error: error.message });
    }
});


module.exports = router;
