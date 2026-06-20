# setup.ps1 -- Cai dat va chay FSS AI Service (Windows PowerShell)
# Chay: .\setup.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  FSS AI SERVICE -- SETUP AND START" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Buoc 1: Kiem tra Python
Write-Host ""
Write-Host "[1/4] Kiem tra Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "KHONG tim thay Python! Tai tai: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
Write-Host "OK: $pythonVersion" -ForegroundColor Green

# Buoc 2: Tao virtual environment
Write-Host ""
Write-Host "[2/4] Tao virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "OK: Da tao venv" -ForegroundColor Green
} else {
    Write-Host "OK: venv da ton tai" -ForegroundColor Green
}

# Su dung duong dan tuyet doi den executable trong venv (an toan hon Activate.ps1)
$VENV_PYTHON = ".\venv\Scripts\python.exe"
$VENV_PIP = ".\venv\Scripts\pip.exe"

# Buoc 3: Cai dependencies
Write-Host ""
Write-Host "[3/4] Cai dat dependencies (co the mat 5-10 phut)..." -ForegroundColor Yellow
# Xoa cache va force reinstall click de tranh loi module not found
& $VENV_PIP install --upgrade pip click
& $VENV_PIP install --default-timeout=1000 -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "LOI: Khong the cai dat thu vien! (Co the do mang yeu gay timeout). Vui long chay lai .\setup.ps1" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Da cai dat xong!" -ForegroundColor Green

# Buoc 4: Chay indexer neu ChromaDB chua co data
Write-Host ""
Write-Host "[4/4] Kiem tra ChromaDB..." -ForegroundColor Yellow
if (-not (Test-Path "chroma_db")) {
    Write-Host "ChromaDB chua co du lieu. Dang chay indexer..." -ForegroundColor Yellow
    Write-Host "    (Qua trinh nay mat ~5-15 phut tuy may tinh)" -ForegroundColor Gray
    & $VENV_PYTHON indexer.py --reset
} else {
    Write-Host "OK: ChromaDB da co du lieu. Bo qua indexing." -ForegroundColor Green
    Write-Host "   (Chay '.\venv\Scripts\python.exe indexer.py --reset' de index lai)" -ForegroundColor Gray
}

# Khoi dong server
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Khoi dong AI Service tai http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
& $VENV_PYTHON -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
