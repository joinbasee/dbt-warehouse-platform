# -*- coding: utf-8 -*-
"""临时脚本：通过 dbt adapter 查询 Hive ODS 表"""
import os, sys
os.chdir(r'C:\Users\诗写\Desktop\dbt_warehouse')

import yaml
with open('profiles.yml', encoding='utf-8') as f:
    profiles = yaml.safe_load(f)
with open('dbt_project.yml', encoding='utf-8') as f:
    project = yaml.safe_load(f)

from argparse import Namespace
from dbt.flags import set_flags
from dbt.config.runtime import RuntimeConfig
from dbt.adapters.spark import SparkAdapter

set_flags(Namespace(USE_COLORS=True))

config = RuntimeConfig.from_parts(
    project=project,
    profile=profiles['ecommerce_warehouse'],
    args=Namespace(target='hive', profiles_dir=os.getcwd())
)

adapter = SparkAdapter(config)
conn = adapter.acquire_connection('master')
cursor = conn.handle.cursor()

# ---- ods_sap_pa0001 ----
print("=" * 60)
print("ods_sap_pa0001")

cursor.execute('SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001')
cnt = cursor.fetchone()[0]
print(f"总行数: {cnt}")

cursor.execute('SELECT * FROM dmp_ods.ods_sap_pa0001 LIMIT 1')
cols = [d[0] for d in cursor.description]
print(f"总列数: {len(cols)}")
print(f"\n全部字段 ({len(cols)}):")
for i, c in enumerate(cols):
    print(f"  [{i:3d}] {c}")

print(f"\n字段填充率 (非NULL非空串):")
for c in cols:
    safe_c = '"' + c + '"'
    try:
        cursor.execute(f'SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001 WHERE {safe_c} IS NOT NULL AND TRIM({safe_c}) != ""')
        filled = cursor.fetchone()[0]
        pct = filled * 100.0 / cnt if cnt > 0 else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"  {c:35s} {pct:5.1f}% [{bar}] {filled}/{cnt}")
    except Exception as e:
        print(f"  {c:35s} ERROR: {e}")

print("\n样例数据 (前2行):")
cursor.execute('SELECT * FROM dmp_ods.ods_sap_pa0001 LIMIT 2')
rows = cursor.fetchall()
for i, row in enumerate(rows):
    print(f"  --- Row {i+1} ---")
    for j, (col, val) in enumerate(zip(cols, row)):
        if val is not None and str(val).strip():
            print(f"    {col}: {val}")

adapter.release_connection('master')
print("\nDone.")
