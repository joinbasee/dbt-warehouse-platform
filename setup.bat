@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   ╔══════════════════════════════════════╗
echo   ║     智能数仓建设平台                  ║
echo   ║     dbt-platform v0.1.0               ║
echo   ╚══════════════════════════════════════╝
echo.

:: ── 检查 Python ──
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] 请先安装 Python 3.10+
    goto :end
)
echo [OK] Python 就绪

:: ── 创建虚拟环境 ──
if not exist ".venv" (
    echo [..] 创建虚拟环境...
    python -m venv .venv
    echo [OK] 虚拟环境已创建
)

:: ── 安装依赖 ──
echo [..] 安装依赖...
.venv\Scripts\python -m pip install -e . --quiet 2>nul
if errorlevel 1 (
    .venv\Scripts\python -m pip install -r requirements.txt --quiet
)
echo [OK] 依赖就绪

:: ── 生成 profiles.yml ──
if not exist "profiles.yml" (
    echo [..] 生成 profiles.yml...
    .venv\Scripts\python scripts\setup_env.py --check >nul 2>&1
    if errorlevel 1 (
        echo [WARN] profiles.yml 未配置，请编辑后重试
    )
)

echo.
echo   ╔══════════════════════════════════════╗
echo   ║  环境就绪！                           ║
echo   ║                                       ║
echo   ║  1. 编辑 project.yml  填入业务域       ║
echo   ║  2. 编辑 profiles.yml 填入数据库       ║
echo   ║  3. 打开终端，输入 claude 开始         ║
echo   ╚══════════════════════════════════════╝
echo.
echo 选择操作:
echo   [1] 打开 Claude Code
echo   [2] 打开监控面板
echo   [3] 测试环境
echo   [4] 退出
echo.

set /p choice="请输入选项 (1-4): "

if "%choice%"=="1" (
    echo 启动 Claude Code...
    claude
)
if "%choice%"=="2" (
    echo 启动监控面板...
    start "" "bin\智能数据平台.bat"
)
if "%choice%"=="3" (
    echo 运行环境测试...
    .venv\Scripts\dbt-platform scan
    .venv\Scripts\dbt-platform agent list
    .venv\Scripts\dbt parse
)

:end
pause
