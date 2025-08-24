// middleware/validation.js

// XSS 방지를 위한 입력 정제
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim();
}

// 사용자명 검증
function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 50) return false;
  if (!/^[a-zA-Z0-9가-힣_-]+$/.test(username)) return false;
  return true;
}

// 비밀번호 검증
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6 || password.length > 100) return false;
  return true;
}

// 입력 검증 미들웨어
function validateLoginInput(req, res, next) {
  const { username, password } = req.body;
  
  // 사용자명 검증
  if (!validateUsername(username)) {
    return res.render('admin/login', { 
      error: '사용자명은 3-50자의 영문, 숫자, 한글, 언더스코어, 하이픈만 사용 가능합니다.' 
    });
  }
  
  // 비밀번호 검증
  if (!validatePassword(password)) {
    return res.render('admin/login', { 
      error: '비밀번호는 6-100자여야 합니다.' 
    });
  }
  
  // 입력값 정제
  req.body.username = sanitizeInput(username);
  req.body.password = password; // 비밀번호는 해싱 전까지 정제하지 않음
  
  next();
}

module.exports = {
  sanitizeInput,
  validateUsername,
  validatePassword,
  validateLoginInput
};
