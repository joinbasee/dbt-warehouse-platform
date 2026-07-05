@echo off
chcp 65001 >nul
echo ================================
echo  智能数仓 — BI 看板一键生成
echo ================================
echo.
cd /d "%~dp0.."

echo [1/2] 列出可用看板...
python -c "from engine.bi.generator import BiGenerator; names=BiGenerator.list_dashboards(); print('\n'.join(f'  - {n}' for n in names) if names else '  (无看板配置)')"

echo.
echo [2/2] 生成所有 BI 看板...
python -c "from engine.bi.generator import BiGenerator; BiGenerator.generate_all(target='hive')"

echo.
echo ================================
echo  BI 看板已生成至 output/bi/
echo ================================
pause
