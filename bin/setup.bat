@echo off
chcp 65001 >nul
echo ================================
echo  智能数仓 — 环境初始化
echo ================================
echo.
cd /d "%~dp0.."

echo [1/3] 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python 未安装，请先安装 Python 3.11+
    pause
    exit /b 1
)
python --version

echo.
echo [2/3] 创建虚拟环境...
if not exist ".venv" (
    python -m venv .venv
    echo [OK] .venv 已创建
) else (
    echo [OK] .venv 已存在
)

echo.
echo [3/3] 安装依赖...
.venv\Scripts\python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [FAIL] 依赖安装失败
    pause
    exit /b 1
)
echo [OK] 依赖安装完成

echo.
echo ================================
echo  环境初始化完成!
echo  下一步:
echo    1. 复制 config/.env.example 为 .env 并填入凭证
echo    2. 运行 bin\generate_bi.bat 生成看板
echo ================================
pause
