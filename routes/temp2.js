const express = require('express');
const axios = require('axios');
const router = express.Router();
// :흰색_확인_표시: 최신 10개 회차 불러오기
async function fetchLottoResults(count = 10, drwNo = null) {
    let results = [];
    let latest = drwNo; // drwNo가 있으면 해당 회차부터 시작
    if (!latest) {
        // 최신 회차 찾기
        let guess = 1200;
        while (!latest && guess > 0) {
            const { data } = await axios.get(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${guess}`);
            if (data.returnValue === 'success') {
                latest = data.drwNo;
            } else {
                guess--;
            }
        }
    }
    for (let i = 0; i < count; i++) {
        const { data } = await axios.get(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${latest - i}`);
        if (data.returnValue === 'success') {
            results.push({
                drwNo: data.drwNo,
                numbers: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
                bonus: data.bnusNo
            });
        }
    }
    return results;
}
// :흰색_확인_표시: /temp2 기본 페이지 (최근 10회 + 입력창)
router.get('/', async (req, res) => {
    try {
        let count = 10;       // 기본: 최신 10회차
        let drwNo = null;
        if (req.query.drwNo) {
            drwNo = parseInt(req.query.drwNo);
            count = 1;         // 특정 회차면 1회만 가져오기
        }
        const results = await fetchLottoResults(count, drwNo);
        res.render('temp2/temp2', { lottoResults: results, inputDrwNo: drwNo || '' });
    } catch (err) {
        console.error(err);
        res.send("로또 데이터를 가져오는 중 오류가 발생했습니다.");
    }
});
// :흰색_확인_표시: 조회 결과 페이지
router.post('/result', async (req, res) => {
    try {
        const myNums = [
            parseInt(req.body.num1),
            parseInt(req.body.num2),
            parseInt(req.body.num3),
            parseInt(req.body.num4),
            parseInt(req.body.num5),
            parseInt(req.body.num6)
        ];
        const drwNo = req.body.drwNo ? parseInt(req.body.drwNo) : null;
        const results = await fetchLottoResults(drwNo ? 1 : 10, drwNo);
        if (!results.length) return res.send("해당 회차 데이터가 없습니다.");
        const compared = results.map(r => {
            const matchCount = r.numbers.filter(n => myNums.includes(n)).length;
            return {
                drwNo: r.drwNo,
                numbers: r.numbers,
                bonus: r.bonus,
                myNums,
                matchCount
            };
        });
        res.render('temp2/result', { compared });
    } catch (err) {
        console.error(err);
        res.send("조회 중 오류가 발생했습니다.");
    }
});
module.exports = router;