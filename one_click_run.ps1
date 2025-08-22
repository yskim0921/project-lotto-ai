# ===============================
# one_click_run.ps1
# ===============================

# 프로젝트 최상위 폴더
$projectRoot = "C:\Users\campus1N012\Desktop\mini_project\project-lotto-ai"

# .venv 경로
$venvPath = Join-Path $projectRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvActivate = Join-Path $venvPath "Scripts\Activate.ps1"

# 1. 기존 .venv 확인
if (Test-Path $venvPath) {
    $answer = Read-Host "기존 .venv가 있습니다. 삭제하고 새로 만들까요? (y/n)"
    if ($answer -eq "y") {
        Remove-Item -Recurse -Force $venvPath
        Write-Host ".venv 삭제 완료"
        $createVenv = $true
    } else {
        Write-Host "기존 .venv 유지"
        $createVenv = $false
    }
} else {
    $createVenv = $true
}

# 2. 가상환경 .venv 생성
if ($createVenv) {
    python -m venv $venvPath
    Write-Host "가상환경 생성 완료"
}

# 3. 가상환경 활성화
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
. $venvActivate
Write-Host "가상환경 활성화 완료"

# 4. pip 업그레이드
& $venvPython -m pip install --upgrade pip

# 5. 필수 패키지 설치
$packages = @("openai", "streamlit", "python-dotenv")
foreach ($pkg in $packages) {
    & $venvPython -m pip show $pkg | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$pkg 설치 중..."
        & $venvPython -m pip install $pkg
    } else {
        Write-Host "$pkg 이미 설치됨, 건너뜀"
    }
}

# 6. npm 서버 실행 (최상위 폴더, 현재 터미널에서)
if (Test-Path (Join-Path $projectRoot "package.json")) {
    Push-Location $projectRoot
    Write-Host "npm run dev 실행 (현재 터미널에서, 끊기지 않음)..."
    Start-Process "cmd.exe" -ArgumentList "/k npm run dev" -WorkingDirectory $projectRoot
    Pop-Location
} else {
    Write-Host "package.json 없음: npm 실행 생략"
}

# 7. Streamlit 앱 실행 (현재 터미널에서, 끊기지 않음)
$streamlitScript = Join-Path $projectRoot "views\aiSec\page_secretary.py"
Write-Host "Streamlit 앱 실행 (현재 터미널에서, 끊기지 않음)..."
& $venvPython -m streamlit run $streamlitScript