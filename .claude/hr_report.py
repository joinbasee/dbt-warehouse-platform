# -*- coding: utf-8 -*-
from pyhive import hive
import os

conn = hive.connect(host='192.168.120.77', port=10016, database='dmp_ods',
                    auth='CUSTOM', username='spark', password='pep2025@A')
cursor = conn.cursor()

TODAY = '20260618'

# ============================================================
# 一、主表基数
# ============================================================
print("=" * 60)
print("一、主表 PA0001 基数")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001 WHERE mandt='800'")
total_800 = cursor.fetchone()[0]
print(f"  mandt=800 总行数: {total_800:,}")

cursor.execute(f"""SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001
    WHERE mandt='800' AND bukrs='2000'
    AND begda < '{TODAY}' AND endda > '{TODAY}'
    AND zhr_ygzt LIKE 'A%'""")
base_cnt = cursor.fetchone()[0]
print(f"  过滤后在职人数: {base_cnt:,}")

cursor.execute("""SELECT bukrs, COUNT(*) FROM dmp_ods.ods_sap_pa0001
    WHERE mandt='800' GROUP BY bukrs ORDER BY COUNT(*) DESC""")
print(f"  公司代码分布: {[(r[0],r[1]) for r in cursor.fetchall()]}")

cursor.execute(f"""SELECT zhr_ygzt, COUNT(*) FROM dmp_ods.ods_sap_pa0001
    WHERE mandt='800' AND bukrs='2000'
    AND begda < '{TODAY}' AND endda > '{TODAY}'
    GROUP BY zhr_ygzt ORDER BY COUNT(*) DESC""")
print(f"  员工状态分布: {[(r[0],r[1]) for r in cursor.fetchall()]}")

# ============================================================
# 二、各表 JOIN 覆盖率
# ============================================================
print("\n" + "=" * 60)
print("二、各表 JOIN 覆盖率")
print("=" * 60)

join_tables = [
    ('PA0002 个人数据', 'ods_sap_pa0002'),
    ('PA0105 通讯', 'ods_sap_pa0105'),
    ('PA0021 家庭成员', 'ods_sap_pa0021'),
    ('PA0023 工作经历', 'ods_sap_pa0023'),
    ('PA0185 证件', 'ods_sap_pa0185'),
    ('PA0534 政治面貌', 'ods_sap_pa0534'),
    ('PA9101 教育经历', 'ods_sap_pa9101'),
    ('PA9112 资格认证', 'ods_sap_pa9112'),
]

for label, tbl in join_tables:
    cursor.execute(f"""SELECT COUNT(DISTINCT p1.pernr)
        FROM dmp_ods.ods_sap_pa0001 p1
        INNER JOIN dmp_ods.{tbl} t ON p1.pernr=t.pernr AND t.mandt='800'
        WHERE p1.mandt='800' AND p1.bukrs='2000'
        AND p1.begda < '{TODAY}' AND p1.endda > '{TODAY}'
        AND p1.zhr_ygzt LIKE 'A%'""")
    matched = cursor.fetchone()[0]

    cursor.execute(f"""SELECT COUNT(*)
        FROM dmp_ods.ods_sap_pa0001 p1
        INNER JOIN dmp_ods.{tbl} t ON p1.pernr=t.pernr AND t.mandt='800'
        WHERE p1.mandt='800' AND p1.bukrs='2000'
        AND p1.begda < '{TODAY}' AND p1.endda > '{TODAY}'
        AND p1.zhr_ygzt LIKE 'A%'""")
    rows = cursor.fetchone()[0]

    pct = matched * 100.0 / base_cnt if base_cnt else 0
    print(f"  {label:20s} 匹配 {matched:>5,} 人 ({pct:5.1f}%)  撑开 {rows:>8,} 行")

# ============================================================
# 三、PA0001 字段填充率
# ============================================================
print("\n" + "=" * 60)
print("三、PA0001 业务字段填充率")
print("=" * 60)

pa1_fields = [
    ('sname', '姓名'), ('ename', '英文名'), ('bukrs', '公司代码'), ('werks', '人事范围'),
    ('btrtl', '人事子范围'), ('persg', '员工组'), ('persk', '员工子组'),
    ('orgeh', '组织单位'), ('plans', '职位'), ('stell', '职务'),
    ('kostl', '成本中心'), ('zhr_ygzt', '员工状态'), ('zhr_fjzt', '附加员工状态'),
    ('zhr_zylx', '专业类型'), ('zhr_edlst', '最高学历'), ('zhr_dglst', '最高学位'),
    ('abkrs', '工资范围'), ('ansvh', '工作合同'), ('vdsk1', '组织代码'),
]

for col, cn in pa1_fields:
    cursor.execute(f"""SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001
        WHERE mandt='800' AND bukrs='2000'
        AND begda < '{TODAY}' AND endda > '{TODAY}'
        AND zhr_ygzt LIKE 'A%'
        AND {col} IS NOT NULL AND TRIM({col}) != ''""")
    filled = cursor.fetchone()[0]
    pct = filled * 100.0 / base_cnt if base_cnt else 0
    bar = '#' * int(pct/5) + '.' * (20 - int(pct/5))
    print(f"  {cn:15s} {pct:5.1f}% [{bar}] {filled}/{base_cnt}")

# ============================================================
# 四、PA0002 字段填充率
# ============================================================
print("\n" + "=" * 60)
print("四、PA0002 关键字段填充率")
print("=" * 60)

pa2_fields = [
    ('nachn', '姓'), ('vorna', '名'), ('gesch', '性别'), ('gbdat', '出生日期'),
    ('natio', '国籍'), ('famst', '婚姻状况'), ('anzkd', '子女数'),
    ('zhr_mz', '民族'), ('zhr_hkxz', '户口性质'), ('zhr_jgss', '籍贯省'),
    ('zhr_jgs', '籍贯市'), ('zhr_sthea', '健康状况'), ('zhr_relig', '宗教信仰'),
    ('zhr_heduc', '最高学历'), ('zhr_hdegr', '最高学位'),
]

for col, cn in pa2_fields:
    cursor.execute(f"""SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001 p1
        INNER JOIN dmp_ods.ods_sap_pa0002 p2 ON p1.pernr=p2.pernr AND p2.mandt='800'
        WHERE p1.mandt='800' AND p1.bukrs='2000'
        AND p1.begda < '{TODAY}' AND p1.endda > '{TODAY}'
        AND p1.zhr_ygzt LIKE 'A%'
        AND p2.begda < '{TODAY}' AND p2.endda > '{TODAY}'
        AND p2.{col} IS NOT NULL AND TRIM(p2.{col}) != ''""")
    filled = cursor.fetchone()[0]
    pct = filled * 100.0 / base_cnt if base_cnt else 0
    bar = '#' * int(pct/5) + '.' * (20 - int(pct/5))
    print(f"  {cn:15s} {pct:5.1f}% [{bar}] {filled}/{base_cnt}")

# ============================================================
# 五、1:N 子表数据量
# ============================================================
print("\n" + "=" * 60)
print("五、1:N 子表分布")
print("=" * 60)

for label, tbl in [('家庭成员','ods_sap_pa0021'),('工作经历','ods_sap_pa0023'),
                    ('教育经历','ods_sap_pa9101'),('资格认证','ods_sap_pa9112')]:
    cursor.execute(f"""SELECT COUNT(*), COUNT(DISTINCT pernr),
        MIN(cn), MAX(cn), CAST(AVG(cn) AS DECIMAL(5,1))
        FROM (SELECT pernr, COUNT(*) cn FROM dmp_ods.{tbl}
              WHERE mandt='800' AND begda<'{TODAY}' AND endda>'{TODAY}'
              GROUP BY pernr) t""")
    t, d, mn, mx, avg = cursor.fetchone()
    print(f"  {label}: {t:>5,}行 {d:>4,}人  min={mn}  max={mx}  avg={avg}")

# ============================================================
# 六、通讯方式覆盖
# ============================================================
print("\n" + "=" * 60)
print("六、通讯方式覆盖")
print("=" * 60)

cursor.execute(f"""SELECT t.subty, COUNT(DISTINCT t.pernr), COUNT(*)
    FROM dmp_ods.ods_sap_pa0001 p1
    INNER JOIN dmp_ods.ods_sap_pa0105 t ON p1.pernr=t.pernr AND t.mandt='800'
    WHERE p1.mandt='800' AND p1.bukrs='2000'
    AND p1.begda<'{TODAY}' AND p1.endda>'{TODAY}'
    AND p1.zhr_ygzt LIKE 'A%'
    AND t.begda<'{TODAY}' AND t.endda>'{TODAY}'
    GROUP BY t.subty""")
for r in cursor.fetchall():
    pct = r[1] * 100.0 / base_cnt
    print(f"  {r[0]:>6s}: {r[1]:>5,}人 ({pct:4.1f}%)  {r[2]:>8,}行")

# ============================================================
# 七、全表 JOIN 总行数
# ============================================================
print("\n" + "=" * 60)
print("七、全表 JOIN 总规模")
print("=" * 60)

cursor.execute(f"""
    SELECT COUNT(*) FROM dmp_ods.ods_sap_pa0001 p1
    LEFT JOIN dmp_ods.ods_sap_pa0002 p2 ON p1.pernr=p2.pernr AND p2.mandt='800' AND p2.begda<'{TODAY}' AND p2.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa0105 c ON p1.pernr=c.pernr AND c.mandt='800' AND c.begda<'{TODAY}' AND c.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa0021 f ON p1.pernr=f.pernr AND f.mandt='800' AND f.begda<'{TODAY}' AND f.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa0023 w ON p1.pernr=w.pernr AND w.mandt='800' AND w.begda<'{TODAY}' AND w.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa0185 i ON p1.pernr=i.pernr AND i.mandt='800' AND i.begda<'{TODAY}' AND i.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa0534 pol ON p1.pernr=pol.pernr AND pol.mandt='800' AND pol.begda<'{TODAY}' AND pol.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa9101 e ON p1.pernr=e.pernr AND e.mandt='800' AND e.begda<'{TODAY}' AND e.endda>'{TODAY}'
    LEFT JOIN dmp_ods.ods_sap_pa9112 q ON p1.pernr=q.pernr AND q.mandt='800' AND q.begda<'{TODAY}' AND q.endda>'{TODAY}'
    WHERE p1.mandt='800' AND p1.bukrs='2000' AND p1.begda<'{TODAY}' AND p1.endda>'{TODAY}' AND p1.zhr_ygzt LIKE 'A%'
""")
total_rows = cursor.fetchone()[0]
print(f"  全表 JOIN 总行数: {total_rows:,}")
print(f"  去重人数: {base_cnt:,}")

# ============================================================
# 八、性别/学历/状态分布
# ============================================================
print("\n" + "=" * 60)
print("八、关键维度分布")
print("=" * 60)

# 性别
cursor.execute(f"""SELECT p2.gesch, COUNT(*) FROM dmp_ods.ods_sap_pa0001 p1
    INNER JOIN dmp_ods.ods_sap_pa0002 p2 ON p1.pernr=p2.pernr AND p2.mandt='800'
    WHERE p1.mandt='800' AND p1.bukrs='2000' AND p1.begda<'{TODAY}' AND p1.endda>'{TODAY}'
    AND p1.zhr_ygzt LIKE 'A%' AND p2.begda<'{TODAY}' AND p2.endda>'{TODAY}'
    GROUP BY p2.gesch""")
print(f"  性别: {[(r[0],r[1]) for r in cursor.fetchall()]}")

# 婚姻
cursor.execute(f"""SELECT p2.famst, COUNT(*) FROM dmp_ods.ods_sap_pa0001 p1
    INNER JOIN dmp_ods.ods_sap_pa0002 p2 ON p1.pernr=p2.pernr AND p2.mandt='800'
    WHERE p1.mandt='800' AND p1.bukrs='2000' AND p1.begda<'{TODAY}' AND p1.endda>'{TODAY}'
    AND p1.zhr_ygzt LIKE 'A%' AND p2.begda<'{TODAY}' AND p2.endda>'{TODAY}'
    GROUP BY p2.famst""")
print(f"  婚姻: {[(r[0],r[1]) for r in cursor.fetchall()]}")

# 员工组
cursor.execute(f"""SELECT persg, persk, COUNT(*) FROM dmp_ods.ods_sap_pa0001
    WHERE mandt='800' AND bukrs='2000' AND begda<'{TODAY}' AND endda>'{TODAY}' AND zhr_ygzt LIKE 'A%'
    GROUP BY persg, persk ORDER BY persg, persk""")
print(f"  员工组/子组: {[(r[0],r[1],r[2]) for r in cursor.fetchall()]}")

# 民族 TOP10
cursor.execute(f"""SELECT p2.zhr_mz, COUNT(*) FROM dmp_ods.ods_sap_pa0001 p1
    INNER JOIN dmp_ods.ods_sap_pa0002 p2 ON p1.pernr=p2.pernr AND p2.mandt='800'
    WHERE p1.mandt='800' AND p1.bukrs='2000' AND p1.begda<'{TODAY}' AND p1.endda>'{TODAY}'
    AND p1.zhr_ygzt LIKE 'A%' AND p2.begda<'{TODAY}' AND p2.endda>'{TODAY}'
    GROUP BY p2.zhr_mz ORDER BY COUNT(*) DESC LIMIT 10""")
print(f"  民族TOP10: {[(r[0],r[1]) for r in cursor.fetchall()]}")

conn.close()
print("\n" + "=" * 60)
print("报告完成")
