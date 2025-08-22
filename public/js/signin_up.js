// ================================
// signin_up.js (클라이언트 JS)
// ================================

// ===== DOM 요소 선택 =====
const signInBtn = document.getElementById("signIn");
const signUpBtn = document.getElementById("signUp");
const fistForm = document.getElementById("form1");
const secondForm = document.getElementById("form2");
const container = document.querySelector(".container");

// ===== 패널 전환 이벤트 =====
// Sign In 버튼 클릭 시 오른쪽 패널 비활성화 → 로그인 폼 표시
signInBtn.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

// Sign Up 버튼 클릭 시 오른쪽 패널 활성화 → 회원가입 폼 표시
signUpBtn.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

// ===== 회원가입 폼 제출 처리 =====
signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // 기본 제출 방지 → 페이지 리로드 방지

  // 폼 데이터를 JSON 객체로 변환
  const formData = new FormData(signUpForm);
  const data = Object.fromEntries(formData.entries());

  try {
    // 서버 회원가입 API 호출
    const res = await fetch("/signin_up/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const member = await res.json(); // 회원가입 결과 받기

    if (member.error) {
      alert(member.error); // 에러 알람
    } else if (member.message) {
      alert(member.message); // 성공 알람
      signUpForm.reset();    // 폼 초기화
      
      // ✅ 서버에서 redirect 정보 받으면 페이지 이동
      if (member.redirect) {
        window.location.href = member.redirect;
      }

      // ================================
      // 회원가입 성공 후 자동 로그인
      // ================================
      const loginRes = await fetch("/signin_up/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const loginMember = await loginRes.json();

      if (loginMember.error) {
        alert("자동 로그인 실패: " + loginMember.error);
      } else if (loginMember.message) {
        // 로그인 성공 → 메인 페이지 이동
        alert("자동 로그인 성공!");
        window.location.href = "/"; // 메인 페이지 URL로 이동
      }
    }
  } catch (err) {
    alert("서버 오류 발생!");
    console.error(err);
  }
});

// ===== 로그인 폼 제출 처리 =====
signInForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // 기본 제출 방지

  const formData = new FormData(signInForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/signin_up/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const memnber = await res.json();

    if (memnber.error) {
      alert(memnber.error); // 로그인 실패 알람
    } else if (memnber.message) {
      alert(memnber.message); // 로그인 성공 알람
      signInForm.reset();    // 폼 초기화
      // ✅ 로그인 성공 시 메인 페이지 이동
      if (member.redirect) {
        window.location.href = member.redirect;
      }
    }
  } catch (err) {
    alert("서버 오류 발생!");
    console.error(err);
  }
});