const express = require('express');
const router = express.Router();

// GET /admin/login - 관리자 로그인 페이지
router.get('/login', (req, res) => {
    // 이미 로그인된 경우 메인 페이지로 리다이렉트
    if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/');
    }
    res.render('admin/login');
});

// POST /admin/login - 관리자 로그인 처리
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 입력값 검증
        if (!username || !password) {
            return res.render('admin/login', { 
                error: '사용자명과 비밀번호를 모두 입력해주세요.' 
            });
        }

        // MongoDB에서 관리자 사용자 확인
        const user = await req.db.collection('users').findOne({
            username: username,
            password: password,
            role: 'admin'
        });

        if (!user) {
            return res.render('admin/login', { 
                error: '사용자명 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        // 세션에 사용자 정보 저장
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };

        // 로그인 성공 시 메인 페이지로 리다이렉트
        res.redirect('/');

    } catch (error) {
        console.error('로그인 오류:', error);
        res.render('admin/login', { 
            error: '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
    }
});

// GET /admin/logout - 관리자 로그아웃
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('세션 삭제 오류:', err);
        }
        res.redirect('/admin/login');
    });
});

module.exports = router;
