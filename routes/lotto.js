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

  const pythonPath = path.join(__dirname, '../best_model/script.py');
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  const python = spawn(pythonCommand, [
    pythonPath,
    name || "홍길동",
    gender || "남성",
    year || "1990",
    month || "1",
    day || "1",
    calendar || "양력",
    dream || "하늘에서 용이 내려와서 여의주를 주고 갔다."
  ]);

  let dataBuffer = '';
  let errorBuffer = '';

  python.stdout.on('data', (data) => {
    dataBuffer += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorBuffer += data.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python 실행 실패:', errorBuffer);
      return res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다" });
    }

    try {
      const result = JSON.parse(dataBuffer);
      res.json(result);
    } catch (err) {
      console.error('결과 파싱 오류:', err);
      res.status(500).json({ error: "결과 처리 중 오류가 발생했습니다" });
    }
  });
});

module.exports = router;
