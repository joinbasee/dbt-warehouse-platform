# -*- coding: utf-8 -*-
"""
环境标准化脚本：从 .env 文件生成 profiles.yml

用法：
    python scripts/setup_env.py              # 从 .env 生成 profiles.yml
    python scripts/setup_env.py --check      # 仅检查 .env 是否存在，不生成
    python scripts/setup_env.py --ci         # CI 模式：从环境变量生成（跳过 .env）

生成规则：
    - 读取 .env 文件（或环境变量），与 profiles.yml.template 合并
    - 把 env_var('KEY', 'default') 替换为实际值
    - 输出到 profiles.yml（覆盖）
"""
import os
import re
import sys
from pathlib import Path

# Fix Windows GBK encoding for emoji
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PLATFORM_ROOT = Path(__file__).resolve().parent.parent

def _get_project_root():
    env_proj = os.environ.get("DBT_PROJECT")
    if env_proj:
        p = Path(env_proj)
        if p.exists():
            return p
    active_file = PLATFORM_ROOT / ".active_project"
    if active_file.exists():
        rel = active_file.read_text(encoding="utf-8").strip()
        candidate = PLATFORM_ROOT / rel
        if candidate.exists():
            return candidate
    return PLATFORM_ROOT

PROJECT_ROOT = _get_project_root()
TEMPLATE = PROJECT_ROOT / "config" / "profiles.yml.template"
TARGET = PROJECT_ROOT / "profiles.yml"
ENV_FILE = PROJECT_ROOT / "config" / ".env"


def load_env(ci_mode: bool = False) -> dict[str, str]:
    """加载环境变量。CI 模式跳过 .env 文件读取。"""
    env = {}

    if not ci_mode and ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, _, value = line.partition("=")
                    env[key.strip()] = value.strip()

    # 系统环境变量优先（覆盖 .env）
    for key in os.environ:
        env[key] = os.environ[key]

    return env


def render_template(env: dict[str, str]) -> str:
    """替换模板中的 {{ env_var('KEY', 'default') }} 为实际值。"""
    with open(TEMPLATE, "r", encoding="utf-8") as f:
        content = f.read()

    def replacer(match: re.Match) -> str:
        key = match.group(1)
        default = match.group(2)
        value = env.get(key, default)
        if value is None or value == "":
            print(f"  [WARN] {key} 未设置，使用空字符串")
            return '""'
        if "| int" in match.group(0):
            return value
        return f'"{value}"'

    pattern = re.compile(
        r'"\{\{\s*env_var\(\s*[\'"]([^\'"]+)[\'"]\s*(?:,\s*[\'"]([^\'"]*)[\'"]\s*)?\)\s*(?:\|\s*int\s*)?\}\}"'
    )
    content = pattern.sub(replacer, content)

    # 处理不带引号的 env_var（边界情况）
    pattern2 = re.compile(
        r'\{\{\s*env_var\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*[\'"]([^\'"]*)[\'"]\s*\)\s*\}\}'
    )
    content = pattern2.sub(
        lambda m: (env.get(m.group(1)) or m.group(2) or '""'),
        content
    )

    return content


def check() -> bool:
    """检查环境是否就绪，返回 True 表示就绪。"""
    if not TEMPLATE.exists():
        print(f"[FAIL] 模板文件不存在: {TEMPLATE}")
        return False

    if ENV_FILE.exists():
        print(f"[OK] .env 文件存在: {ENV_FILE}")
        return True
    else:
        print(f"[WARN] .env 文件不存在: {ENV_FILE}")
        print(f"       请复制 .env.example -> .env 并填入真实凭证")
        print(f"       或在 CI 环境中设置对应的环境变量")
        return False


def check_connections(env: dict[str, str]) -> dict[str, bool]:
    """测试数据库连接可达性。"""
    results = {}

    # DuckDB
    duckdb_path = env.get("DUCKDB_PATH", "warehouse.duckdb")
    results["dev (DuckDB)"] = Path(duckdb_path).exists() if not duckdb_path.startswith("$") else True

    # Hive
    if env.get("HIVE_HOST"):
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((env["HIVE_HOST"], int(env.get("HIVE_PORT", 10000))))
            sock.close()
            results["hive"] = result == 0
        except Exception:
            results["hive"] = False

    # OceanBase
    if env.get("OB_HOST"):
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((env["OB_HOST"], int(env.get("OB_PORT", 2881))))
            sock.close()
            results["oceanbase"] = result == 0
        except Exception:
            results["oceanbase"] = False

    return results


def init_environment() -> int:
    """一键初始化：创建 .venv + 安装依赖 + 生成 profiles.yml。"""
    import subprocess

    print("=" * 60)
    print("  智能数仓 — 一键环境初始化")
    print("=" * 60)
    print()

    # 1. 检查 Python
    print("[1/4] 检查 Python...")
    result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
    print(f"  {result.stdout.strip()}")
    print()

    # 2. 创建 .venv
    print("[2/4] 创建虚拟环境...")
    venv_dir = PLATFORM_ROOT / ".venv"
    if not venv_dir.exists():
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
        print("  [OK] .venv 已创建")
    else:
        print("  [OK] .venv 已存在")
    print()

    # 3. 安装依赖
    print("[3/4] 安装依赖...")
    pip = str(venv_dir / "Scripts" / "pip.exe")
    subprocess.run([pip, "install", "-r", str(PLATFORM_ROOT / "requirements.txt"), "--quiet"], check=True)
    print("  [OK] 依赖安装完成")
    print()

    # 4. 生成 profiles.yml
    print("[4/4] 生成 profiles.yml...")
    if not ENV_FILE.exists():
        print(f"  [INFO] .env 不存在，创建默认 dev 配置...")
        content = f"""# Auto-generated with dev defaults
ecommerce_warehouse:
  target: dev
  outputs:
    dev:
      type: duckdb
      path: "{PROJECT_ROOT / 'warehouse.duckdb'}"
"""
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        env = load_env(ci_mode=False)
        content = render_template(env)
        with open(TARGET, "w", encoding="utf-8") as f:
            f.write(content)
    print(f"  [OK] {TARGET.name} 已生成")
    print()

    # 连接检查
    env = load_env(ci_mode=False)
    results = check_connections(env)
    print("数据库连接检查:")
    for name, ok in results.items():
        icon = "[OK]" if ok else "[--]"
        print(f"  {icon} {name}")

    print()
    print("下一步:")
    print("  .venv/Scripts/dbt parse --target dev")
    print("  bin/generate_bi.bat")
    return 0


def main() -> None:
    ci_mode = "--ci" in sys.argv
    check_only = "--check" in sys.argv
    init_mode = "--init" in sys.argv

    if init_mode:
        sys.exit(init_environment())

    if check_only:
        ok = check()
        if ok:
            env = load_env(ci_mode=False)
            results = check_connections(env)
            print()
            print("数据库连接检查:")
            for name, ok_conn in results.items():
                icon = "[OK]" if ok_conn else "[--]"
                print(f"  {icon} {name}")
        sys.exit(0 if ok else 1)

    print("=" * 60)
    print("  PEP 数仓 -- 环境标准化")
    print("=" * 60)
    print()

    if ci_mode:
        print("[CI 模式] 从系统环境变量生成 profiles.yml")
    else:
        print("从 .env + 系统环境变量生成 profiles.yml")

    env = load_env(ci_mode=ci_mode)

    # 必需检测
    required_keys = []
    target = env.get("DBT_TARGET", "dev")
    if target == "hive":
        required_keys = ["HIVE_HOST", "HIVE_PASSWORD"]
    elif target in ("oceanbase_ads", "oceanbase_fdt", "oceanbase_fusion"):
        required_keys = ["OB_HOST", "OB_PASSWORD"]

    missing = [k for k in required_keys if not env.get(k)]
    if missing:
        print(f"\n[FAIL] 缺少必需的环境变量: {', '.join(missing)}")
        print(f"       DBT_TARGET={target} 需要对应的数据库凭证")
        if not ci_mode:
            print("       请编辑 .env 文件填入真实凭证后重试")
        sys.exit(1)

    print(f"  当前目标: {target}")
    print()

    try:
        content = render_template(env)
    except Exception as e:
        print(f"[FAIL] 模板渲染失败: {e}")
        sys.exit(1)

    # 备份旧文件
    if TARGET.exists():
        import shutil
        backup = TARGET.with_suffix(".yml.bak")
        shutil.copy2(TARGET, backup)
        print(f"  已备份旧文件: {backup.name}")

    now = __import__('datetime').datetime.now().isoformat()
    with open(TARGET, "w", encoding="utf-8") as f:
        f.write(f"# 自动生成 by scripts/setup_env.py -- 请勿手动编辑\n")
        f.write(f"# 生成时间: {now}\n")
        f.write(f"# 目标环境: {env.get('DBT_TARGET', 'dev')}\n\n")
        f.write(content)

    print(f"[OK] 已生成: {TARGET.name}")
    print()
    print("下一步: cd 到项目根目录，执行 .venv/Scripts/dbt parse 验证")


if __name__ == "__main__":
    main()
