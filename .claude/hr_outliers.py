# -*- coding: utf-8 -*-
from pyhive import hive

conn = hive.connect(host='192.168.120.77', port=10016, database='dmp_ods',
                    auth='CUSTOM', username='spark', password='pep2025@A')
cursor = conn.cursor()
TODAY = '20260618'

# ====== 1. 缺失 PA0002 ======
print("=" * 60)
print("一、缺失 PA0002 个人数据")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, p1.orgeh, p1.zhr_fjzt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000'
          AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    LEFT JOIN (SELECT * FROM dmp_ods.ods_sap_pa0002
               WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') p2
        ON p1.pernr=p2.pernr
    WHERE p2.pernr IS NULL ORDER BY p1.pernr
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  组织={r[4]}  状态={r[5]}")

# ====== 2. 缺失 PA0105 ======
print("\n" + "=" * 60)
print("二、缺失 PA0105 通讯")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, p1.zhr_fjzt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    LEFT JOIN (SELECT * FROM dmp_ods.ods_sap_pa0105
               WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') c
        ON p1.pernr=c.pernr
    WHERE c.pernr IS NULL ORDER BY p1.pernr
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  状态={r[4]}")

# ====== 3. 缺失 PA0185 ======
print("\n" + "=" * 60)
print("三、缺失 PA0185 证件")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, p1.zhr_fjzt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    LEFT JOIN (SELECT * FROM dmp_ods.ods_sap_pa0185
               WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}' AND subty='01') i
        ON p1.pernr=i.pernr
    WHERE i.pernr IS NULL ORDER BY p1.pernr
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  状态={r[4]}")

# ====== 4. 姓名缺失 ======
print("\n" + "=" * 60)
print("四、PA0001 姓名缺失")
print("=" * 60)
cursor.execute(f"""
    SELECT pernr, sname, ename, persg, persk, orgeh, zhr_fjzt
    FROM dmp_ods.ods_sap_pa0001
    WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%'
    AND (sname IS NULL OR TRIM(sname)='') ORDER BY pernr
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  英文名={r[2]}  员工组={r[3]}  子组={r[4]}  组织={r[5]}")

# ====== 5. 成本中心缺失 ======
print("\n" + "=" * 60)
print("五、PA0001 成本中心缺失")
print("=" * 60)
cursor.execute(f"""
    SELECT pernr, sname, persg, persk, orgeh, kostl, zhr_fjzt
    FROM dmp_ods.ods_sap_pa0001
    WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%'
    AND (kostl IS NULL OR TRIM(kostl)='') ORDER BY pernr
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  组织={r[4]}  成本中心=[{r[5]}]")

# ====== 6. 家庭成员过多 (>=3) ======
print("\n" + "=" * 60)
print("六、家庭成员 >=3 人")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, COUNT(*) AS fam_cnt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    INNER JOIN (SELECT * FROM dmp_ods.ods_sap_pa0021
                WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') f
        ON p1.pernr=f.pernr
    GROUP BY p1.pernr, p1.sname, p1.persg, p1.persk
    HAVING COUNT(*) >= 3 ORDER BY fam_cnt DESC
""")
for r in cursor.fetchall():
    cursor.execute(f"""
        SELECT subty, famsa, fanam, fasex, fgbdt
        FROM dmp_ods.ods_sap_pa0021 WHERE mandt='800' AND pernr='{r[0]}'
        AND begda<'{TODAY}' AND endda>'{TODAY}' ORDER BY subty
    """)
    ms = cursor.fetchall()
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  成员={r[4]}人")
    for m in ms:
        print(f"    subty={m[0]}  关系={m[1]}  姓名={m[2]}  性别={m[3]}  出生={m[4]}")

# ====== 7. 工作过多 (>=3) ======
print("\n" + "=" * 60)
print("七、工作经历 >=3 条")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, COUNT(*) AS w_cnt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    INNER JOIN (SELECT * FROM dmp_ods.ods_sap_pa0023
                WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') w
        ON p1.pernr=w.pernr
    GROUP BY p1.pernr, p1.sname, p1.persg, p1.persk
    HAVING COUNT(*) >= 3 ORDER BY w_cnt DESC
""")
for r in cursor.fetchall():
    cursor.execute(f"""
        SELECT arbgb, taete, begda, endda FROM dmp_ods.ods_sap_pa0023
        WHERE mandt='800' AND pernr='{r[0]}' AND begda<'{TODAY}' AND endda>'{TODAY}' ORDER BY begda
    """)
    ws = cursor.fetchall()
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  工作={r[4]}条")
    for w in ws:
        print(f"    单位={w[0]}  职务={w[1]}  {w[2]}~{w[3]}")

# ====== 8. 资格过多 (>=3) ======
print("\n" + "=" * 60)
print("八、资格认证 >=3 条")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, COUNT(*) AS q_cnt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    INNER JOIN (SELECT * FROM dmp_ods.ods_sap_pa9112
                WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') q
        ON p1.pernr=q.pernr
    GROUP BY p1.pernr, p1.sname, p1.persg, p1.persk
    HAVING COUNT(*) >= 3 ORDER BY q_cnt DESC
""")
for r in cursor.fetchall():
    cursor.execute(f"""
        SELECT zhr_zgmc, zhr_zgdj, zhr_hqrq, zhr_zsbh FROM dmp_ods.ods_sap_pa9112
        WHERE mandt='800' AND pernr='{r[0]}' AND begda<'{TODAY}' AND endda>'{TODAY}' ORDER BY zhr_hqrq
    """)
    qs = cursor.fetchall()
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  资格={r[4]}条")
    for q in qs:
        print(f"    资格={q[0]}  等级={q[1]}  日期={q[2]}  证书={q[3]}")

# ====== 9. 缺教育 ======
print("\n" + "=" * 60)
print("九、缺失教育 PA9101（前15人）")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, p1.zhr_fjzt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    LEFT JOIN (SELECT * FROM dmp_ods.ods_sap_pa9101
               WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') e
        ON p1.pernr=e.pernr
    WHERE e.pernr IS NULL ORDER BY p1.pernr LIMIT 15
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  状态={r[4]}")

# ====== 10. 缺政治面貌 ======
print("\n" + "=" * 60)
print("十、缺失政治面貌 PA0534（前15人）")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p1.persg, p1.persk, p1.zhr_fjzt
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    LEFT JOIN (SELECT * FROM dmp_ods.ods_sap_pa0534
               WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') pol
        ON p1.pernr=pol.pernr
    WHERE pol.pernr IS NULL ORDER BY p1.pernr LIMIT 15
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  员工组={r[2]}  子组={r[3]}  状态={r[4]}")

# ====== 11. 缺名 vorna ======
print("\n" + "=" * 60)
print("十一、缺失名 PA0002.vorna（前15人）")
print("=" * 60)
cursor.execute(f"""
    SELECT p1.pernr, p1.sname, p2.nachn, p2.vorna, p2.gesch, p1.persg, p1.persk
    FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
          WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
    INNER JOIN (SELECT * FROM dmp_ods.ods_sap_pa0002
                WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') p2
        ON p1.pernr=p2.pernr
    WHERE p2.vorna IS NULL OR TRIM(p2.vorna)='' ORDER BY p1.pernr LIMIT 15
""")
for r in cursor.fetchall():
    print(f"  pernr={r[0]}  姓名={r[1]}  姓={r[2]}  名=[{r[3]}]  性别={r[4]}  员工组={r[5]}")

# ====== 12. 汇总 ======
print("\n" + "=" * 60)
print("十二、异常汇总")
print("=" * 60)

# 总数
cursor.execute(f"""
    SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
        WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
""")
total = cursor.fetchone()[0]

# 各维度缺失
checks = [
    ('缺PA0002个人数据', f"""
        SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
            WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
        LEFT JOIN (SELECT DISTINCT pernr FROM dmp_ods.ods_sap_pa0002
                   WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') p2
            ON p1.pernr=p2.pernr WHERE p2.pernr IS NULL
    """),
    ('缺PA0105通讯', f"""
        SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
            WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
        LEFT JOIN (SELECT DISTINCT pernr FROM dmp_ods.ods_sap_pa0105
                   WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') c
            ON p1.pernr=c.pernr WHERE c.pernr IS NULL
    """),
    ('缺PA0185证件', f"""
        SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
            WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
        LEFT JOIN (SELECT DISTINCT pernr FROM dmp_ods.ods_sap_pa0185
                   WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}' AND subty='01') i
            ON p1.pernr=i.pernr WHERE i.pernr IS NULL
    """),
    ('缺PA9101教育', f"""
        SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
            WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
        LEFT JOIN (SELECT DISTINCT pernr FROM dmp_ods.ods_sap_pa9101
                   WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') e
            ON p1.pernr=e.pernr WHERE e.pernr IS NULL
    """),
    ('缺PA0534政治面貌', f"""
        SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
            WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
        LEFT JOIN (SELECT DISTINCT pernr FROM dmp_ods.ods_sap_pa0534
                   WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') pol
            ON p1.pernr=pol.pernr WHERE pol.pernr IS NULL
    """),
    ('缺姓名sname', f"""
        SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001
        WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%'
        AND (sname IS NULL OR TRIM(sname)='')
    """),
    ('缺成本中心kostl', f"""
        SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001
        WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%'
        AND (kostl IS NULL OR TRIM(kostl)='')
    """),
    ('缺名vorna', f"""
        SELECT COUNT(*) FROM (SELECT * FROM dmp_ods.ods_sap_pa0001
            WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_fjzt LIKE 'A%') p1
        INNER JOIN (SELECT * FROM dmp_ods.ods_sap_pa0002
                    WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}') p2
            ON p1.pernr=p2.pernr WHERE p2.vorna IS NULL OR TRIM(p2.vorna)=''
    """),
]

for label, sql in checks:
    cursor.execute(sql)
    cnt = cursor.fetchone()[0]
    pct = cnt * 100.0 / total if total else 0
    print(f"  {label}: {cnt}人 ({pct:.1f}%)")

# 多条统计
print()
for label, tbl, threshold in [('家庭成员 >=3', 'ods_sap_pa0021', 3),
                                ('工作经历 >=3', 'ods_sap_pa0023', 3),
                                ('资格认证 >=3', 'ods_sap_pa9112', 3)]:
    cursor.execute(f"""
        SELECT COUNT(*) FROM (
            SELECT pernr, COUNT(*) cnt FROM dmp_ods.{tbl}
            WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}'
            GROUP BY pernr HAVING COUNT(*) >= {threshold}
        ) t
    """)
    cnt = cursor.fetchone()[0]
    print(f"  {label}条: {cnt}人")

conn.close()
print("\nDone.")
