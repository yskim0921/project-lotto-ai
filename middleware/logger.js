// middleware/logger.js

// 요청 로깅 미들웨어
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // 응답 완료 후 로깅
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // 상태 코드에 따른 로그 레벨
    if (res.statusCode >= 400) {
      console.error('❌ Error Request:', logData);
    } else if (res.statusCode >= 300) {
      console.warn('⚠️  Redirect:', logData);
    } else {
      console.log('✅ Success:', logData);
    }
  });
  
  next();
}

// 보안 이벤트 로깅
function securityLogger(event, details) {
  const logData = {
    timestamp: new Date().toISOString(),
    event: event,
    details: details,
    severity: 'SECURITY'
  };
  
  console.error('🚨 Security Event:', logData);
}

// 파일 업로드 로깅
function uploadLogger(req, res, next) {
  if (req.file) {
    console.log('📁 File Upload:', {
      timestamp: new Date().toISOString(),
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      ip: req.ip || req.connection.remoteAddress
    });
  }
  next();
}

module.exports = {
  requestLogger,
  securityLogger,
  uploadLogger
};
