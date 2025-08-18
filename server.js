// index.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버가 실행중...(클릭) http://localhost:${PORT}`);
});
