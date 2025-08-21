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

  // 기본값 처리
  const _name = name || "홍길동";
  const _gender = gender || "남성";
  const _year = year || "1990";
  const _month = month || "1";
  const _day = day || "1";
  const _calendar = calendar || "양력";
  const _dream = dream || "하늘에서 용이 내려와서 여의주를 주고 갔다.";

  const pythonPath = path.join(__dirname, '../best_model/script.py');

  const python = spawn('python3', [
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
      return res.status(500).json({ error: "Python 실행 실패", stderr: errorBuffer });
    }

    try {
      const result = JSON.parse(dataBuffer);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "결과 처리 중 오류", rawData: dataBuffer });
    }
  });
});

module.exports = router;
