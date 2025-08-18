const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');


// lotto.ejs 페이지 렌더링
router.get('/', (req, res) => {
  res.render('lotto/lotto.ejs');
});


// /calc 요청 처리 (Python 실행)
router.post('/calc', (req, res) => {
  const { gender, calendar, year, month, day, dream } = req.body;

  if (!gender || !calendar || !year || !month || !day || !dream) {
      return res.status(400).json({
          error: "필수 입력값이 누락되었습니다.",
          required: ["gender", "calendar", "year", "month", "day", "dream"]
      });
  }

  const pythonScriptPath = path.join(__dirname, '..', 'best_model', 'main.py');

  const python = spawn('python3', [
      pythonScriptPath,
      gender,
      calendar,
      String(year),
      String(month),
      String(day),
      dream
  ], { encoding: 'utf8' });

  let dataBuffer = '';
  let errorBuffer = '';
  let responseFinished = false;

  python.stdout.on('data', (data) => {
      dataBuffer += data.toString();
  });

  python.stderr.on('data', (data) => {
      errorBuffer += data.toString();
      console.error("[Python stderr] " + data.toString());
  });

  python.on('error', (error) => {
      if (!responseFinished) {
          responseFinished = true;
          res.status(500).json({ error: "Python 실행 오류", details: error.message });
      }
  });

  const timeoutId = setTimeout(() => {
      if (!responseFinished && !python.killed) {
          responseFinished = true;
          python.kill('SIGTERM');
          res.status(408).json({ error: "처리 시간 초과" });
      }
  }, 30000);

  python.on('close', (code) => {
      clearTimeout(timeoutId);
      if (responseFinished) return;
      responseFinished = true;

      if (code !== 0) {
          return res.status(500).json({
              error: "Python 스크립트 실행 실패",
              exitCode: code,
              stderr: errorBuffer,
              stdout: dataBuffer
          });
      }

      if (!dataBuffer.trim()) {
          return res.status(500).json({ error: "Python에서 결과를 받지 못했습니다.", stderr: errorBuffer });
      }

      try {
          const firstBrace = dataBuffer.indexOf('{');
          const lastBrace = dataBuffer.lastIndexOf('}');
          if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
              throw new Error("JSON 본문 위치 이상");
          }
          let jsonStr = dataBuffer.substring(firstBrace, lastBrace + 1).trim();
          const parsedResult = JSON.parse(jsonStr);
          res.json(parsedResult);
      } catch (err) {
          console.error("JSON 파싱 오류:", err.message);
          res.status(500).json({
              error: "결과 처리 중 오류",
              parseError: err.message,
              rawData: dataBuffer,
              stderr: errorBuffer
          });
      }
  });
});

module.exports = router;
