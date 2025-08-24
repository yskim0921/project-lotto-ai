const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');

// GET /lotto
router.get('/', (req, res) => {
  res.render('lotto/lotto.ejs');
});

// POST /lotto/analysis
router.post('/analysis', (req, res) => {
  const { name, gender, year, month, day, calendar, dream } = req.body;

  // 입력값 검증 및 정제
  const _name = (name || "홍길동").trim().substring(0, 50);
  const _gender = (gender || "남성").trim().substring(0, 10);
  const _year = (year || "1990").toString().substring(0, 4);
  const _month = (month || "1").toString().substring(0, 2);
  const _day = (day || "1").toString().substring(0, 2);
  const _calendar = (calendar || "양력").trim().substring(0, 10);
  const _dream = (dream || "하늘에서 용이 내려와서 여의주를 주고 갔다.").trim().substring(0, 500);

  // 입력값 유효성 검사
  if (!/^\d{4}$/.test(_year) || !/^\d{1,2}$/.test(_month) || !/^\d{1,2}$/.test(_day)) {
    return res.status(400).json({ error: "날짜 형식이 올바르지 않습니다." });
  }

  const yearNum = parseInt(_year);
  const monthNum = parseInt(_month);
  const dayNum = parseInt(_day);

  if (yearNum < 1900 || yearNum > 2100 || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return res.status(400).json({ error: "날짜 범위가 올바르지 않습니다." });
  }

  const pythonPath = path.join(__dirname, '../script_origin.py');

  // 스크립트 파일 존재 확인
  if (!require('fs').existsSync(pythonPath)) {
    return res.status(500).json({ error: "AI 분석 스크립트를 찾을 수 없습니다." });
  }

  // Windows 환경에서는 'python' 명령어 사용
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  const python = spawn(pythonCommand, [
    pythonPath,
    _name,
    _gender,
    String(_year),
    String(_month),
    String(_day),
    _calendar,
    _dream
  ]);

  let dataBuffer = '';
  let errorBuffer = '';

  python.stdout.on('data', (data) => {
    dataBuffer += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorBuffer += data.toString();
    console.error("Python stderr:", data.toString());
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python 실행 실패:', errorBuffer);
      return res.status(500).json({ 
        error: "AI 분석 중 오류가 발생했습니다", 
        details: "Python 스크립트 실행에 실패했습니다. 잠시 후 다시 시도해주세요.",
        stderr: errorBuffer 
      });
    }

    try {
      const result = JSON.parse(dataBuffer);
      res.json(result);
    } catch (err) {
      console.error('결과 파싱 오류:', err);
      res.status(500).json({ 
        error: "결과 처리 중 오류가 발생했습니다", 
        details: "AI 분석 결과를 처리하는 중 문제가 발생했습니다.",
        rawData: dataBuffer 
      });
    }
  });

    // Python 프로세스 타임아웃 처리
  const timeout = setTimeout(() => {
    python.kill('SIGTERM');
    res.status(408).json({
      error: "AI 분석 시간이 초과되었습니다",
      details: "분석이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요."
    });
  }, 30000); // 30초 타임아웃

  python.on('error', (err) => {
    clearTimeout(timeout);
    console.error('Python 프로세스 에러:', err);
    res.status(500).json({
      error: "AI 분석 서비스를 시작할 수 없습니다",
      details: "시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    });
  });

  python.on('close', (code) => {
    clearTimeout(timeout);
    if (code !== 0) {
      console.error('Python 실행 실패:', errorBuffer);
      return res.status(500).json({ 
        error: "AI 분석 중 오류가 발생했습니다", 
        details: "Python 스크립트 실행에 실패했습니다. 잠시 후 다시 시도해주세요.",
        stderr: errorBuffer 
      });
    }

    try {
      const result = JSON.parse(dataBuffer);
      res.json(result);
    } catch (err) {
      console.error('결과 파싱 오류:', err);
      res.status(500).json({ 
        error: "결과 처리 중 오류가 발생했습니다", 
        details: "AI 분석 결과를 처리하는 중 문제가 발생했습니다.",
        rawData: dataBuffer 
      });
    }
  });
});

module.exports = router;
