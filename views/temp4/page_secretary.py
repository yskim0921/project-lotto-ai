import os
import time
import textwrap
import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

# ──────────────────────────────────────────────────────────────────────────────
# 0) 환경 설정
# ──────────────────────────────────────────────────────────────────────────────
load_dotenv()
API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
if not API_KEY:
    raise RuntimeError("OPENAI_API_KEY가 설정되어 있지 않습니다. .env를 확인하세요.")
client = OpenAI(api_key=API_KEY)

st.set_page_config(page_title="우리 비서", page_icon="👩‍💼", layout="centered")
st.title("👩‍💼 우리 비서")
st.caption("원하시는 질문을 말씀해 주시면 상세히 설명 드리겠습니다.")

# ──────────────────────────────────────────────────────────────────────────────
# 1) 사이드바 옵션 (운동 목표/부위 선택 위젯 포함)
# ──────────────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.subheader("⚙️ 추천 옵션")
    model = "gpt-3.5-turbo"

    goal = st.radio(
        "지원 목록",
        ["이용 방법", "방청 신청", "로또 당첨 확인"],
        index=0, horizontal=False
    )

    streaming = st.checkbox("실시간 스트리밍 응답", value=False)

    if st.button("🧹 대화 초기화"):
        st.session_state.clear()
        st.experimental_rerun()
        
    

# ──────────────────────────────────────────────────────────────────────────────
# 2) 세션 상태
# ──────────────────────────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []

# 시스템 가이드(프롬프트) 생성
SYSTEM_GUIDE = textwrap.dedent(f"""
너는 우리 홈페이지 중에 몇개의 페이지를 상세히 설명해주는 우리 비서야.
아래 조건을 반영해서 친절 하게 설명 해주면 돼.

[사용자 조건]
- 목표: {goal}

[제시 형식]
1) 한 줄 요약
2) 단계별 안내(번호 목록)
3) 자주 묻는 질문(FAQ) 3개
4) 다음 추천 질문 3개

[원칙]
- 짧은 문장 위주, 핵심부터 제시
- 버튼/메뉴 경로는 굵게(**경로**)로 표시
- 실제 입력값/예시는 코드블록이 아닌 인라인으로 제시
- 모르면 모른다고 말하고, 가능한 추정은 '예: …'로 구분
- 목표 이외에는 답변을 하지 마.
""").strip()

# ──────────────────────────────────────────────────────────────────────────────
# 3) 과거 대화 렌더링
# ──────────────────────────────────────────────────────────────────────────────
for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.markdown(m["content"])

# ──────────────────────────────────────────────────────────────────────────────
# 4) 사용자 입력 & 모델 호출
# ──────────────────────────────────────────────────────────────────────────────
placeholder_hint_by_goal = {
    "이용 방법": "예) 홈페이지 이용 방법 알려줘 / 결제 과정 포함",
    "방청 신청": "예) 방청 신청 절차 / 당일 현장 신청 가능?",
    "로또 당첨 확인": "예) 1120회 당첨 번호 확인 / 자동 vs 수동 확률?"
}
default_hint = placeholder_hint_by_goal.get(goal, "예) 안내 부탁드립니다.")

# ✅ 사용자 입력 위젯 추가
user_prompt = st.chat_input(default_hint)

if user_prompt:
    # 사용자 메시지 표시/저장
    st.session_state.messages.append({"role": "user", "content": user_prompt})
    with st.chat_message("user"):
        st.markdown(user_prompt)

    # 단일 문자열 합성 (Responses API는 문자열 input 가능)
    composed = f"[SYSTEM]\n{SYSTEM_GUIDE}\n\n[USER]\n{user_prompt}"

    t0 = time.perf_counter()
    try:
        if streaming:
            with st.chat_message("assistant"):
                ph = st.empty()
                chunks = []
                with client.responses.stream(
                    model=model,
                    input=composed,
                    temperature=0.4,
                ) as stream:
                    for event in stream:
                        if event.type == "response.output_text.delta":
                            chunks.append(event.delta)
                            ph.markdown("".join(chunks))
                    stream.until_done()
                answer = "".join(chunks) if chunks else "(응답 없음)"
        else:
            resp = client.responses.create(
                model=model,
                input=composed,
                temperature=0.4,
            )
            answer = getattr(resp, "output_text", None) or str(resp)
            with st.chat_message("assistant"):
                st.markdown(answer)

        # 응답 저장
        st.session_state.messages.append({"role": "assistant", "content": answer})

        # 부가 정보
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        with st.expander("Ⓘ 시스템 가이드(프롬프트)", expanded=False):
            st.code(SYSTEM_GUIDE, language="markdown")
        st.caption(f"⏱️ 응답 시간: {elapsed_ms} ms")

        # 다운로드(마크다운 텍스트)
        st.download_button(
            label="📥 이번 답변 다운로드 (.md)",
            data=answer.encode("utf-8"),
            file_name="site_helper_answer.md",
            mime="text/markdown",
            use_container_width=True,
        )

    except Exception as e:
        with st.chat_message("assistant"):
            st.error(f"OpenAI 호출 실패: {e}")

# ──────────────────────────────────────────────────────────────────────────────
# 5) 안전 안내
# ──────────────────────────────────────────────────────────────────────────────
st.markdown("---")
st.caption("⚠️ 본 내용은 참고용 가이드입니다.")
