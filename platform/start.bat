@echo off
chcp 65001 >nul
title 智能数仓建设平台 — dbt Agent Platform

echo ============================================
echo   智能数仓建设平台 v1.0
echo   多Agent集群 · dbt Data Warehouse
echo ============================================
echo.
echo 正在启动应用...
echo.

cd /d "%~dp0"
call npm run dev
