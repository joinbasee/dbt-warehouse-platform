# -*- coding: utf-8 -*-
"""直接使用 dbt-spark 的 SparkConnectionManager 查询 Hive"""
import os, sys
os.chdir(r'C:\Users\诗写\Desktop\dbt_warehouse')

import yaml
with open('profiles.yml', encoding='utf-8') as f:
    profiles = yaml.safe_load(f)

# 获取 hive target 配置
hive_cfg = profiles['ecommerce_warehouse']['outputs']['hive']
print("Hive config:", {k: v for k, v in hive_cfg.items() if 'password' not in k.lower()})

# 直接用 impyla/pyhive 连接
from pyhive import hive
conn = hive.connect(
    host=hive_cfg['host'],
    port=hive_cfg['port'],
    database=hive_cfg.get('schema', 'dmp_ods'),
    auth=hive_cfg.get('auth', 'NOSASL'),
    username=hive_cfg.get('user', 'hive'),
)
cursor = conn.cursor()

print("\n" + "=" * 60)
print("ods_sap_pa0001")

cursor.execute('SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001')
cnt = cursor.fetchone()[0]
print(f"总行数: {cnt}")

cursor.execute('SELECT * FROM dmp_ods.ods_sap_pa0001 LIMIT 1')
cols = [d[0] for d in cursor.description]
print(f"总列数: {len(cols)}")
print(f"\n全部字段:")
for i, c in enumerate(cols):
    print(f"  [{i:3d}] {c}")

# 填充率
print(f"\n字段填充率:")
for c in cols:
    try:
        cursor.execute(f'SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001 WHERE "{c}" IS NOT NULL AND TRIM("{c}") != ""')
        filled = cursor.fetchone()[0]
        pct = filled * 100.0 / cnt if cnt > 0 else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"  {c:35s} {pct:5.1f}% [{bar}] {filled}/{cnt}")
    except Exception as e:
        print(f"  {c:35s} ERR: {e}")

# 样例
print("\n样例数据 (前2行非空值):")
cursor.execute('SELECT * FROM dmp_ods.ods_sap_pa0001 LIMIT 2')
rows = cursor.fetchall()
for i, row in enumerate(rows):
    print(f"  --- Row {i+1} ---")
    for col, val in zip(cols, row):
        if val is not None and str(val).strip():
            print(f"    {col}: {val}")

conn.close()
print("\nDone.")
