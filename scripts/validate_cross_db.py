# -*- coding: utf-8 -*-
"""
跨库数据验证：Hive ADS vs OceanBase ADS 行数对比

用法：
    python scripts/validate_cross_db.py              # 本地模式，读取 profiles.yml
    python scripts/validate_cross_db.py --ci         # CI 模式，从环境变量连接
    python scripts/validate_cross_db.py --table zsdr005  # 仅验证指定表

输出：
    - 控制台打印对比结果
    - 写 JSON 报告到验收/cross_db_report.json

依赖：
    pip install pymysql pyhive thrift
"""
import os
import sys
import json
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 项目根：优先 DBT_PROJECT 环境变量，回退到平台根
PROJECT_ROOT = os.environ.get("DBT_PROJECT", ROOT)
REPORT_DIR = os.path.join(PROJECT_ROOT, "output", "validation")
REPORT_FILE = os.path.join(REPORT_DIR, "cross_db_report.json")


def get_hive_connection():
    """获取 Hive 连接 (pyhive + thrift)。"""
    from pyhive import hive
    return hive.connect(
        host=os.environ.get("HIVE_HOST", "192.168.120.77"),
        port=int(os.environ.get("HIVE_PORT", "10016")),
        username=os.environ.get("HIVE_USER", "spark"),
        password=os.environ.get("HIVE_PASSWORD", ""),
        database="dmp_ads",
        auth="CUSTOM",
    )


def get_ob_connection():
    """获取 OceanBase 连接 (pymysql)。"""
    import pymysql
    return pymysql.connect(
        host=os.environ.get("OB_HOST", "192.168.120.74"),
        port=int(os.environ.get("OB_PORT", "2881")),
        user=os.environ.get("OB_USER", ""),
        password=os.environ.get("OB_PASSWORD", ""),
        database="dmp_ads",
        charset="utf8mb4",
        connect_timeout=30,
    )


# ADS 表清单 (Hive 表名 -> OceanBase 表名)
# 后续新增 ADS 表时在此注册即可
ADS_TABLES = {
    "dmp_ads.ads_fi_zsdr005": "dmp_ads.ads_fi_zsdr005",
}


def count_hive(cursor, table: str) -> int:
    """查询 Hive 表行数。"""
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        row = cursor.fetchone()
        return int(row[0]) if row else -1
    except Exception as e:
        print(f"  [ERROR] Hive 查询失败: {e}")
        return -1


def count_ob(cursor, table: str) -> int:
    """查询 OceanBase 表行数。"""
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        row = cursor.fetchone()
        return int(row[0]) if row else -1
    except Exception as e:
        print(f"  [ERROR] OceanBase 查询失败: {e}")
        return -1


def validate_table(hive_cur, ob_cur, hive_table: str, ob_table: str) -> dict:
    """对比单表，返回结果字典。"""
    print(f"\n{'=' * 60}")
    print(f"  Hive : {hive_table}")
    print(f"  OB   : {ob_table}")

    hive_count = count_hive(hive_cur, hive_table)
    ob_count = count_ob(ob_cur, ob_table)

    diff = hive_count - ob_count
    diff_pct = round(diff / hive_count * 100, 2) if hive_count > 0 else 0

    if hive_count < 0 or ob_count < 0:
        status = "ERROR"
        icon = "[FAIL]"
    elif diff == 0:
        status = "OK"
        icon = "[OK]"
    elif abs(diff_pct) <= 5:
        status = "WARN"
        icon = "[WARN]"
    else:
        status = "FAIL"
        icon = "[FAIL]"

    print(f"  {icon} Hive={hive_count:,}  OB={ob_count:,}  diff={diff:+,}  ({diff_pct:+.2f}%)")

    return {
        "hive_table": hive_table,
        "ob_table": ob_table,
        "hive_count": hive_count,
        "ob_count": ob_count,
        "diff": diff,
        "diff_pct": diff_pct,
        "status": status,
    }


def main() -> None:
    ci_mode = "--ci" in sys.argv
    single_table = None
    for arg in sys.argv[1:]:
        if arg.startswith("--table="):
            single_table = arg.split("=", 1)[1]

    print("=" * 60)
    print("  跨库数据验证: Hive ADS vs OceanBase ADS")
    print("=" * 60)

    mode_label = "CI" if ci_mode else "本地"
    print(f"  模式: {mode_label}")
    print(f"  时间: {datetime.now().isoformat()}")

    tables = ADS_TABLES
    if single_table:
        hive_key = f"dmp_ads.{single_table}" if not single_table.startswith("dmp_ads") else single_table
        if hive_key in ADS_TABLES:
            tables = {hive_key: ADS_TABLES[hive_key]}
        else:
            print(f"\n[WARN] 未注册的表: {single_table}")
            print(f"  已注册表: {list(ADS_TABLES.keys())}")
            sys.exit(1)

    if not tables:
        print("\n[WARN] 没有需要对比的 ADS 表")
        sys.exit(0)

    results = []
    hive_conn = None
    ob_conn = None

    try:
        print("\n连接 Hive ...")
        hive_conn = get_hive_connection()
        hive_cur = hive_conn.cursor()
        print("  [OK] Hive 已连接")

        print("连接 OceanBase ...")
        ob_conn = get_ob_connection()
        ob_cur = ob_conn.cursor()
        print("  [OK] OceanBase 已连接")

        for hive_table, ob_table in tables.items():
            result = validate_table(hive_cur, ob_cur, hive_table, ob_table)
            results.append(result)

    except Exception as e:
        print(f"\n[FAIL] 连接失败: {e}")
        results.append({
            "hive_table": "N/A",
            "ob_table": "N/A",
            "hive_count": -1,
            "ob_count": -1,
            "diff": 0,
            "diff_pct": 0,
            "status": "ERROR",
            "error": str(e),
        })
    finally:
        if hive_conn:
            hive_conn.close()
        if ob_conn:
            ob_conn.close()

    # ── 汇总 ──
    print(f"\n{'=' * 60}")
    print(f"  汇总")
    ok = sum(1 for r in results if r["status"] == "OK")
    warn = sum(1 for r in results if r["status"] == "WARN")
    fail = sum(1 for r in results if r["status"] == "FAIL")
    err = sum(1 for r in results if r["status"] == "ERROR")
    print(f"  OK={ok}  WARN={warn}  FAIL={fail}  ERROR={err}")

    # ── 写报告 ──
    report = {
        "generated_at": datetime.now().isoformat(),
        "mode": mode_label,
        "summary": {"OK": ok, "WARN": warn, "FAIL": fail, "ERROR": err},
        "tables": results,
    }

    os.makedirs(REPORT_DIR, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n报告已保存: {REPORT_FILE}")

    # 退出码：有 FAIL 或 ERROR 则非零
    if fail > 0 or err > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
