const express = require('express');
const router = express.Router();

// lotto.ejs 페이지 렌더링
router.get('/', (req, res) => {
  res.render('lotto/lotto.ejs');
});

// /calc 요청 처리 (입력값 그대로 반환)
router.post('/calc', (req, res) => {
  const { gender, calendar, year, month, day, dream } = req.body;

  if (!gender || !calendar || !year || !month || !day || !dream) {
    return res.status(400).json({
      error: "필수 입력값이 누락되었습니다.",
      required: ["gender", "calendar", "year", "month", "day", "dream"]
    });
  }

  // 그대로 돌려주기
  res.json({
    gender,
    calendar,
    year,
    month,
    day,
    dream,
    message: "입력값이 정상적으로 전달되었습니다."
  });
});

module.exports = router;
