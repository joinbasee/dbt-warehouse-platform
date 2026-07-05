#!/bin/bash
# 智能数仓建设平台 — 一键部署

cd "$(dirname "$0")"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     智能数仓建设平台                  ║"
echo "  ║     dbt-platform v0.1.0               ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── 检查 Python ──
if ! command -v python3 &> /dev/null; then
    echo "[FAIL] 请先安装 Python 3.10+"
    exit 1
fi
echo "[OK] Python 就绪"

# ── 创建虚拟环境 ──
if [ ! -d ".venv" ]; then
    echo "[..] 创建虚拟环境..."
    python3 -m venv .venv
    echo "[OK] 虚拟环境已创建"
fi

# ── 安装依赖 ──
echo "[..] 安装依赖..."
.venv/bin/pip install -e . --quiet 2>/dev/null || .venv/bin/pip install -r requirements.txt --quiet
echo "[OK] 依赖就绪"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║  环境就绪！                           ║"
echo "  ║                                       ║"
echo "  ║  1. 编辑 project.yml  填入业务域       ║"
echo "  ║  2. 编辑 profiles.yml 填入数据库       ║"
echo "  ║  3. 输入 claude 开始                   ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo " 测试环境: .venv/bin/dbt-platform scan"
echo ""
