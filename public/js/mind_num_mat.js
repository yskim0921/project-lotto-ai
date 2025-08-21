// 숫자에 따라 로또볼 색상 클래스 반환
function getBallClass(num) {
    if (num >= 1 && num <= 10) return 'ball-yellow';
    if (num >= 11 && num <= 20) return 'ball-blue';
    if (num >= 21 && num <= 30) return 'ball-red';
    if (num >= 31 && num <= 40) return 'ball-gray';
    if (num >= 41 && num <= 45) return 'ball-green';
    return '';
}

// 페이지 로드 시 모든 숫자에 ball 클래스 적용
document.addEventListener('DOMContentLoaded', () => {
    const numbers = document.querySelectorAll('.number-item strong');
    numbers.forEach(numEl => {
        const num = parseInt(numEl.textContent.trim());
        const ballSpan = document.createElement('span');
        ballSpan.className = `ball ${getBallClass(num)}`;
        ballSpan.textContent = num;
        numEl.textContent = ''; // 기존 숫자 제거
        numEl.appendChild(ballSpan);
    });
});

// 감정 박스 호버 이벤트 처리
document.addEventListener('DOMContentLoaded', function() {
    const boxes = document.querySelectorAll('.emotion-box');
    const tooltip = document.getElementById('tooltip');

    boxes.forEach(box => {
        box.addEventListener('mouseenter', (e) => {
            const numbers = JSON.parse(box.dataset.numbers);
            const symbols = JSON.parse(box.dataset.symbols);

            let html = '';
            numbers.forEach((num, idx) => {
                const cls = getBallClass(num);
                html += `<span class="ball ${cls}" title="${symbols[idx]}">${num}</span>`;
            });

            tooltip.innerHTML = html;
            tooltip.style.display = 'block';

            const rect = box.getBoundingClientRect();
            tooltip.style.top = rect.bottom + window.scrollY + 5 + 'px';
            tooltip.style.left = rect.left + window.scrollX + 'px';
        });

        box.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
});
