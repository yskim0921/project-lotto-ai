// middleware/rateLimit.js

// 메모리 기반 요청 카운터
const requestCounts = new Map();

// Rate Limiting 미들웨어
function rateLimiter(options = {}) {
    const {
        windowMs = 15 * 60 * 1000, // 15분
        max = 100, // 최대 요청 수
        message = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
        keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        const windowStart = now - windowMs;

        // 현재 키의 요청 기록 가져오기
        const requests = requestCounts.get(key) || [];
        
        // 윈도우 시간 범위 내의 요청만 유지
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        // 현재 요청 추가
        validRequests.push(now);
        requestCounts.set(key, validRequests);

        // 요청 수 확인
        if (validRequests.length > max) {
            return res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // 남은 요청 수를 헤더에 추가
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - validRequests.length));
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

        next();
    };
}

// 특정 엔드포인트용 Rate Limiter
const uploadRateLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5분
    max: 10, // 최대 10개 파일 업로드
    message: '파일 업로드가 너무 많습니다. 5분 후 다시 시도해주세요.'
});

const loginRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 최대 5번 로그인 시도
    message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
});

const apiRateLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000, // 1분
    max: 30, // 최대 30개 API 요청
    message: 'API 요청이 너무 많습니다. 1분 후 다시 시도해주세요.'
});

module.exports = {
    rateLimiter,
    uploadRateLimiter,
    loginRateLimiter,
    apiRateLimiter
};
