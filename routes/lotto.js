const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');
const { checkAdmin } = require('../middleware/auth');

// GET /lotto
router.get('/', (req, res) => {
  res.render('lotto/lotto.ejs', { user: req.session.user });
});

// GET /lotto/history-page - 히스토리 페이지 (관리자만 접근 가능)
router.get('/history-page', checkAdmin, (req, res) => {
  res.render('lotto/lotto_history.ejs', { user: req.session.user });
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

  python.on('close', async (code) => {
    if (code !== 0) {
      console.error('Python 실행 실패:', errorBuffer);
      return res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다" });
    }

    try {
      const result = JSON.parse(dataBuffer);
      
      // MongoDB에 결과 저장
      try {
        const db = await connectDB();
        const collection = db.collection('numberList');
        
        const saveData = {
          name: name || "홍길동",
          gender: gender || "남성",
          year: year || "1990",
          month: month || "1",
          day: day || "1",
          calendar: calendar || "양력",
          dream: dream || "하늘에서 용이 내려와서 여의주를 주고 갔다.",
          analysisResult: result,
          createdAt: new Date(),
          timestamp: Date.now()
        };
        
        await collection.insertOne(saveData);
        console.log('✅ 로또 분석 결과가 MongoDB에 저장되었습니다.');
      } catch (dbError) {
        console.error('❌ MongoDB 저장 실패:', dbError);
        // 데이터베이스 저장 실패해도 결과는 반환
      }
      
      res.json(result);
    } catch (err) {
      console.error('결과 파싱 오류:', err);
      res.status(500).json({ error: "결과 처리 중 오류가 발생했습니다" });
    }
  });
});

// GET /lotto/history - 저장된 분석 결과 조회 (관리자만 접근 가능)
router.get('/history', checkAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('numberList');
    
    // 최근 50개 결과 조회 (최신순)
    const results = await collection.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('❌ 분석 결과 조회 실패:', error);
    res.status(500).json({ error: "분석 결과 조회 중 오류가 발생했습니다" });
  }
});

// GET /lotto/history/:id - 특정 분석 결과 조회 (관리자만 접근 가능)
router.get('/history/:id', checkAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('numberList');
    
    const result = await collection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!result) {
      return res.status(404).json({ error: "해당 분석 결과를 찾을 수 없습니다" });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ 특정 분석 결과 조회 실패:', error);
    res.status(500).json({ error: "분석 결과 조회 중 오류가 발생했습니다" });
  }
});

// DELETE /lotto/history/:id - 특정 분석 결과 삭제 (관리자만 접근 가능)
router.delete('/history/:id', checkAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('numberList');
    
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "해당 분석 결과를 찾을 수 없습니다" });
    }
    
    console.log('✅ 분석 결과가 삭제되었습니다.');
    res.json({ success: true, message: "분석 결과가 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error('❌ 분석 결과 삭제 실패:', error);
    res.status(500).json({ error: "분석 결과 삭제 중 오류가 발생했습니다" });
  }
});

module.exports = router;
