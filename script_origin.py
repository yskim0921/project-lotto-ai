# # # script_origin.py

# import sys
# import json
# from TotalService.today_dream import get_haemong_from_luluddream

# def main():
#     try:
#         name = sys.argv[1] if len(sys.argv) > 1 else "홍길동"
#         gender = sys.argv[2] if len(sys.argv) > 2 else "남성"
#         year = sys.argv[3] if len(sys.argv) > 3 else "1990"
#         month = sys.argv[4] if len(sys.argv) > 4 else "1"
#         day = sys.argv[5] if len(sys.argv) > 5 else "1"
#         calendar = sys.argv[6] if len(sys.argv) > 6 else "양력"
#         dream = sys.argv[7] if len(sys.argv) > 7 else "하늘에서 용이 내려와서 여의주를 주고 갔다."

#         # 꿈 해몽 호출
#         dream_analysis = get_haemong_from_luluddream(dream)

#         # 로또 번호 예시
#         analysis_result = {
#             "name": name,
#             "gender": gender,
#             "year": year,
#             "month": month,
#             "day": day,
#             "calendar": calendar,
#             "dream": dream,
#             "dream_analysis": dream_analysis,
#         }

#         print(json.dumps(analysis_result))
#     except Exception as e:
#         print(json.dumps({"error": str(e)}))
#         sys.exit(1)

# if __name__ == "__main__":
#     main()









# # # routes/lotto.js
# const express = require('express');
# const router = express.Router();
# const path = require('path');
# const { spawn } = require('child_process');

# // GET /lotto
# router.get('/', (req, res) => {
#   res.render('lotto/lotto.ejs');
# });

# // POST /lotto/analysis
# router.post('/analysis', (req, res) => {
#   const { name, gender, year, month, day, calendar, dream } = req.body;

#   // 기본값 처리
#   const _name = name || "홍길동";
#   const _gender = gender || "남성";
#   const _year = year || "1990";
#   const _month = month || "1";
#   const _day = day || "1";
#   const _calendar = calendar || "양력";
#   const _dream = dream || "하늘에서 용이 내려와서 여의주를 주고 갔다.";

#   const pythonPath = path.join(__dirname, '../best_model/script.py');

#   const python = spawn('python3', [
#     pythonPath,
#     _name,
#     _gender,
#     String(_year),
#     String(_month),
#     String(_day),
#     _calendar,
#     _dream
#   ]);

#   let dataBuffer = '';
#   let errorBuffer = '';

#   python.stdout.on('data', (data) => {
#     dataBuffer += data.toString();
#   });

#   python.stderr.on('data', (data) => {
#     errorBuffer += data.toString();
#     console.error("Python stderr:", data.toString());
#   });

#   python.on('close', (code) => {
#     if (code !== 0) {
#       return res.status(500).json({ error: "Python 실행 실패", stderr: errorBuffer });
#     }

#     try {
#       const result = JSON.parse(dataBuffer);
#       res.json(result);
#     } catch (err) {
#       res.status(500).json({ error: "결과 처리 중 오류", rawData: dataBuffer });
#     }
#   });
# });

# module.exports = router;












# # # views/lotto/lotto.ejs
# <!DOCTYPE html>
# <html lang="ko">
# <head>
#   <meta charset="UTF-8" />
#   <title>로또 분석</title>
# </head>
# <body>
#   <h2>로또번호 분석</h2>
#   <input type="text" id="name" placeholder="이름" /><br>
#   <input type="text" id="gender" placeholder="성별 (남성/여성)" /><br>
#   <input type="number" id="year" placeholder="출생년도" /><br>
#   <input type="number" id="month" placeholder="출생월" /><br>
#   <input type="number" id="day" placeholder="출생일" /><br>
#   <input type="text" id="calendar" placeholder="양력/음력" /><br>
#   <input type="text" id="dream" placeholder="오늘의 꿈" /><br>
#   <button onclick="sendData()">분석하기</button>

#   <pre id="result" style="background:#f1f3f5; padding:10px; border-radius:6px;"></pre>

#   <script>
#     function sendData() {
#       let name = document.getElementById("name").value.trim();
#       let gender = document.getElementById("gender").value.trim();
#       let year = document.getElementById("year").value.trim();
#       let month = document.getElementById("month").value.trim();
#       let day = document.getElementById("day").value.trim();
#       let calendar = document.getElementById("calendar").value.trim();
#       let dream = document.getElementById("dream").value.trim();

#       fetch("/lotto/analysis", {
#         method: "POST",
#         headers: { "Content-Type": "application/json" },
#         body: JSON.stringify({ name, gender, year, month, day, calendar, dream })
#       })
#       .then(res => res.json())
#       .then(data => {
#         if(data.error){
#           document.getElementById("result").innerText = "오류: " + data.error;
#           return;
#         }
#         document.getElementById("result").innerText = JSON.stringify(data, null, 2);
#       })
#       .catch(err => {
#         document.getElementById("result").innerText = "서버 오류";
#         console.error(err);
#       });
#     }
#   </script>
# </body>
# </html>
