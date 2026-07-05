// 68 systems from 业务数据需求汇总表V3.0
// 60 systems, 7 databases

export const BENZ_SYSTEMS = [
  {
    "name": "人工填报",
    "demand": 161,
    "depts": "AS、BS、Battery、MFA AS、MRA2、Machining、PS、QM、SS、生产管理部",
    "domains": "F&C、HR、LOG、Prod、QM、RD、TSS、安全管理部",
    "db": "SQL Server、SQL Server?",
    "tables": [
      "PAF&Torque日报数字化系统",
      "TBD（待用户澄清）",
      "attendance_month/Daily",
      "入库单、出库单",
      "各战役报告",
      "安全培训",
      "应急演练",
      "废水排放记录",
      "报告&excel",
      "财务月报",
      "隐患排查"
    ],
    "tables_raw": [
      "PAF&Torque日报数字化系统",
      "TBD（待用户澄清）",
      "attendance_month/Daily",
      "入库单、出库单",
      "各战役报告",
      "安全培训",
      "应急演练",
      "废水排放记录",
      "报告&excel",
      "财务月报",
      "隐患排查"
    ],
    "vol_gb": 7533,
    "readiness": "A",
    "scenes": "BI报表、BI报表/DI-分析计算、BI报表/DI-数据接口/分析计算、DI-分析计算、低代码自动化接口"
  },
  {
    "name": "MRS",
    "demand": 91,
    "depts": "AS、AS 1、BS、Battery、MFA AS、MRA2、Machining、PS、QM、SYAS、生产管理部",
    "domains": "PP、Prod、QM",
    "db": "mysql",
    "tables": [
      "Delivery_data_hour",
      "KFC直传数据",
      "ftc_mp1_issues ftc_mp3_issues",
      "vehicle_amount",
      "对应的MRS报告名： ISD Trend for Three Days NCC T8",
      "对应的MRS报告名： MRA-I FTQ",
      "对应的MRS报告名： MRA1 GFP Pro Daily Report with picture new",
      "对应的MRS报告名： VoCA Daily Report MRA",
      "战役PBI"
    ],
    "tables_raw": [
      "Delivery_data_hour",
      "KFC直传数据",
      "ftc_mp1_issues ftc_mp3_issues",
      "vehicle_amount",
      "对应的MRS报告名： ISD Trend for Three Days NCC T8",
      "对应的MRS报告名： MRA-I FTQ",
      "对应的MRS报告名： MRA1 GFP Pro Daily Report with picture new",
      "对应的MRS报告名： VoCA Daily Report MRA",
      "战役PBI"
    ],
    "vol_gb": 12288,
    "readiness": "A",
    "scenes": "BI、BI报表、BI报表/DI-分析计算、DI-分析计算"
  },
  {
    "name": "低代码",
    "demand": 45,
    "depts": "AS、AS 1、Battery、MRA2、Machining、PS、QM、SYAS",
    "domains": "F&C、Prod、QM、RD、安全管理部",
    "db": "MongoDB",
    "tables": [
      "无独立数据表"
    ],
    "tables_raw": [
      "无独立数据表"
    ],
    "vol_gb": 20,
    "readiness": "A",
    "scenes": "BI报表、DI-分析计算"
  },
  {
    "name": "HR系统",
    "demand": 34,
    "depts": "AS、BS、MFA AS、MRA2、PS、QM、SM、SS",
    "domains": "HR、安全管理部",
    "db": "SQL Server、视图",
    "tables": [
      "attendance_month/Daily"
    ],
    "tables_raw": [
      "attendance_month/Daily"
    ],
    "vol_gb": 10,
    "readiness": "A",
    "scenes": "BI报表、BI报表/DI-分析计算、BI报表/DI-数据接口"
  },
  {
    "name": "iPortal",
    "demand": 21,
    "depts": "AS 1、BS、Battery、MFA AS、MRA2、PS、SYAS",
    "domains": "PP、Prod、TSS",
    "db": "SQL Server、SQL Server?、mysql",
    "tables": [
      "TBD（待用户澄清）",
      "kpi_indicator",
      "level_1_4"
    ],
    "tables_raw": [
      "TBD（待用户澄清）",
      "kpi_indicator",
      "level_1_4"
    ],
    "vol_gb": 3,
    "readiness": "A",
    "scenes": "BI报表、BI报表/DI-分析计算、DI-分析计算"
  },
  {
    "name": "PiWeb",
    "demand": 19,
    "depts": "QM",
    "domains": "Prod、QM",
    "db": "SQL Server?",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 100,
    "readiness": "B1",
    "scenes": "BI报表、DI-分析计算"
  },
  {
    "name": "tagetik",
    "demand": 13,
    "depts": "BS、MFA AS、MRA2、Machining、SS",
    "domains": "F&C",
    "db": "Sql Server",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 8,
    "readiness": "B1",
    "scenes": "BI报表、BI报表/DI-分析计算、DI-分析计算"
  },
  {
    "name": "PRISMA",
    "demand": 12,
    "depts": "AS、Machining",
    "domains": "Prod、TSS",
    "db": "SQL Server?、oracle",
    "tables": [
      "TBD（待用户澄清）"
    ],
    "tables_raw": [
      "TBD（待用户澄清）"
    ],
    "vol_gb": 2407,
    "readiness": "A",
    "scenes": "BI报表、DI-分析计算"
  },
  {
    "name": "QDA",
    "demand": 11,
    "depts": "AS、Battery、Machining、PS、QM",
    "domains": "Prod、QM",
    "db": "SQL Server?",
    "tables": [
      "TBD（待用户澄清）"
    ],
    "tables_raw": [
      "TBD（待用户澄清）"
    ],
    "vol_gb": 222,
    "readiness": "A",
    "scenes": "BI报表/DI-数据接口/分析计算、DI-分析计算"
  },
  {
    "name": "BDE",
    "demand": 10,
    "depts": "SS",
    "domains": "Prod",
    "db": "SQL Server",
    "tables": [
      "BDE/OFFICE/性能分析/报表/BBAC-SPH/SPH报表（工作场所）",
      "BDE/OFFICE/性能分析/报表/BBAC作业状态/作业状态报告",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/OEE-设备可动率",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/序列化模具停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/新项目模具停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/生产停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/计划停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/设备停机"
    ],
    "tables_raw": [
      "BDE/OFFICE/性能分析/报表/BBAC-SPH/SPH报表（工作场所）",
      "BDE/OFFICE/性能分析/报表/BBAC作业状态/作业状态报告",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/OEE-设备可动率",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/序列化模具停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/新项目模具停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/生产停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/计划停机",
      "BDE/OFFICE/性能分析/报表/停机报告-班次/设备停机"
    ],
    "vol_gb": 6,
    "readiness": "A",
    "scenes": "BI报表/DI-分析计算、DI-分析计算"
  },
  {
    "name": "CBFC",
    "demand": 8,
    "depts": "AS、Battery、Machining、QM、SS",
    "domains": "F&C",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 16602,
    "readiness": "D",
    "scenes": "BI报表、DI-分析计算"
  },
  {
    "name": "Power BI",
    "demand": 6,
    "depts": "AS 1、MFA AS、MRA2、QM",
    "domains": "Prod、QM",
    "db": "SQL Server?",
    "tables": [
      "PowerBI显示数据"
    ],
    "tables_raw": [
      "PowerBI显示数据"
    ],
    "vol_gb": 0,
    "readiness": "A",
    "scenes": "BI报表"
  },
  {
    "name": "AMS",
    "demand": 6,
    "depts": "QM、SS",
    "domains": "LOG、Prod、QM",
    "db": "S/4HANA",
    "tables": [
      "AFKO AFRU",
      "CRHD KAZY",
      "T001W TFACS",
      "TBD（待用户澄清）",
      "VLCVEHICLE"
    ],
    "tables_raw": [
      "AFKO AFRU",
      "CRHD KAZY",
      "T001W TFACS",
      "TBD（待用户澄清）",
      "VLCVEHICLE"
    ],
    "vol_gb": 3,
    "readiness": "A",
    "scenes": "BI报表、BI报表/DI-分析计算、DI-分析计算"
  },
  {
    "name": "CAT-8D",
    "demand": 5,
    "depts": "MRA2、Machining、QM",
    "domains": "QM",
    "db": "SQL Server",
    "tables": [
      "PSP PBI"
    ],
    "tables_raw": [
      "PSP PBI"
    ],
    "vol_gb": 0,
    "readiness": "A",
    "scenes": "BI报表"
  },
  {
    "name": "EMS MRS",
    "demand": 5,
    "depts": "MFA AS、PS",
    "domains": "TSS",
    "db": "SQL Server",
    "tables": [
      "Delivery_data"
    ],
    "tables_raw": [
      "Delivery_data"
    ],
    "vol_gb": 1024,
    "readiness": "A",
    "scenes": "BI报表"
  },
  {
    "name": "OA",
    "demand": 4,
    "depts": "PS、QM、SM",
    "domains": "IT、Prod、安全管理部",
    "db": "sql server",
    "tables": [
      "喷漆工艺文件下发审批流程 Paint shop process document release process"
    ],
    "tables_raw": [
      "喷漆工艺文件下发审批流程 Paint shop process document release process"
    ],
    "vol_gb": 10,
    "readiness": "A",
    "scenes": "BI报表、BI报表/DI-数据接口/分析计算"
  },
  {
    "name": "相关方管理系统",
    "demand": 4,
    "depts": "SM、SS",
    "domains": "安全管理部",
    "db": "SQL Server、sql server",
    "tables": [],
    "tables_raw": [
      "待创建视图"
    ],
    "vol_gb": 16,
    "readiness": "B1",
    "scenes": "BI报表、BI报表/DI-数据接口"
  },
  {
    "name": "QS-Torque",
    "demand": 4,
    "depts": "QM",
    "domains": "Prod、QM",
    "db": "Oracle",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 20,
    "readiness": "B1",
    "scenes": "BI报表、DI-分析计算"
  },
  {
    "name": "SQMS",
    "demand": 4,
    "depts": "QM",
    "domains": "QM",
    "db": "SQL Server?",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 3,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "cbfc",
    "demand": 3,
    "depts": "BS、MFA AS",
    "domains": "F&C、Prod",
    "db": "SAP、Sql Server",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "B1",
    "scenes": "BI报表、BI报表/DI-分析计算、DI-分析计算"
  },
  {
    "name": "FSSC+",
    "demand": 3,
    "depts": "BS、MFA AS、QM",
    "domains": "F&C、Prod",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 10,
    "readiness": "D",
    "scenes": "BI报表、BI报表/DI-分析计算"
  },
  {
    "name": "SFMD",
    "demand": 3,
    "depts": "PS、QM",
    "domains": "Prod、QM",
    "db": "待确认",
    "tables": [
      "各车型大表"
    ],
    "tables_raw": [
      "各车型大表"
    ],
    "vol_gb": 0,
    "readiness": "B2",
    "scenes": "BI报表、BI报表/DI-数据接口/分析计算、DI-分析计算"
  },
  {
    "name": "人工填报 MRS",
    "demand": 3,
    "depts": "PS",
    "domains": "HR、LOG",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 5,
    "readiness": "C",
    "scenes": "BI、BI报表"
  },
  {
    "name": "培训部系统",
    "demand": 3,
    "depts": "PS",
    "domains": "Prod、培训部",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 5,
    "readiness": "D",
    "scenes": "BI报表、BI报表/DI-数据接口/分析计算"
  },
  {
    "name": "WFP",
    "demand": 2,
    "depts": "MFA AS、MRA2",
    "domains": "PP",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "门禁系统",
    "demand": 2,
    "depts": "PS、SM",
    "domains": "安全管理部",
    "db": "tyco",
    "tables": [],
    "tables_raw": [
      "安全管理部负责"
    ],
    "vol_gb": 4,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "人工填报 SFMD",
    "demand": 2,
    "depts": "PS",
    "domains": "QM",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 1,
    "readiness": "C",
    "scenes": "BI报表"
  },
  {
    "name": "安全管理部系统",
    "demand": 2,
    "depts": "PS、SS",
    "domains": "安全管理部",
    "db": "安全管理部负责",
    "tables": [],
    "tables_raw": [
      "安全管理部负责"
    ],
    "vol_gb": 0,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "WMS",
    "demand": 2,
    "depts": "Machining",
    "domains": "Prod",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 108,
    "readiness": "D",
    "scenes": "DI-分析计算"
  },
  {
    "name": "IQVIS",
    "demand": 2,
    "depts": "QM",
    "domains": "Prod",
    "db": "SQL Server?",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 120,
    "readiness": "B1",
    "scenes": "DI-分析计算"
  },
  {
    "name": "DIP",
    "demand": 2,
    "depts": "QM",
    "domains": "P&S、QM",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表、DI-分析计算"
  },
  {
    "name": "GO",
    "demand": 2,
    "depts": "QM",
    "domains": "After sales",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 540,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "WFP Proplan",
    "demand": 1,
    "depts": "MRA2",
    "domains": "PP",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "IRPO",
    "demand": 1,
    "depts": "MFA AS",
    "domains": "F&C",
    "db": "IRPO",
    "tables": [
      "DATI_SALDI_LORDI"
    ],
    "tables_raw": [
      "DATI_SALDI_LORDI"
    ],
    "vol_gb": 1,
    "readiness": "A",
    "scenes": "BI报表"
  },
  {
    "name": "Proplan",
    "demand": 1,
    "depts": "SYAS",
    "domains": "PP",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "Running Cost Dashboard_Cost_V3.3",
    "demand": 1,
    "depts": "BS",
    "domains": "F&C",
    "db": "S/4HANA、SQL Server?、sql server",
    "tables": [
      "TBD（待用户澄清）",
      "？"
    ],
    "tables_raw": [
      "TBD（待用户澄清）",
      "？"
    ],
    "vol_gb": 0,
    "readiness": "A",
    "scenes": "BI报表/DI-分析计算"
  },
  {
    "name": "IN3 transimitter",
    "demand": 1,
    "depts": "BS",
    "domains": "Prod",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 80,
    "readiness": "D",
    "scenes": "BI"
  },
  {
    "name": "飞书-环保科危废称重数据统计平台",
    "demand": 1,
    "depts": "PS",
    "domains": "安全管理部",
    "db": "待确认",
    "tables": [
      "危废数字化"
    ],
    "tables_raw": [
      "危废数字化"
    ],
    "vol_gb": 2,
    "readiness": "B2",
    "scenes": "BI报表"
  },
  {
    "name": "Qlive 人工填报",
    "demand": 1,
    "depts": "PS",
    "domains": "Prod",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 4,
    "readiness": "C",
    "scenes": "BI报表/DI-数据接口/分析计算"
  },
  {
    "name": "PER",
    "demand": 1,
    "depts": "PS",
    "domains": "RD",
    "db": "SQL Server",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "B1",
    "scenes": "BI报表/DI-数据接口/分析计算"
  },
  {
    "name": "ZUES",
    "demand": 1,
    "depts": "PS",
    "domains": "RD",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 5,
    "readiness": "D",
    "scenes": "BI报表/DI-数据接口/分析计算"
  },
  {
    "name": "ipro",
    "demand": 1,
    "depts": "PS",
    "domains": "F&C",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "低代码自动化接口"
  },
  {
    "name": "ipro cbfc fssc",
    "demand": 1,
    "depts": "PS",
    "domains": "F&C",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI"
  },
  {
    "name": "HR系统 MRS",
    "demand": 1,
    "depts": "PS",
    "domains": "HR",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "HR系统 人工填报",
    "demand": 1,
    "depts": "PS",
    "domains": "HR",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "C",
    "scenes": "BI报表"
  },
  {
    "name": "HR系统 党工团各业务系统",
    "demand": 1,
    "depts": "PS",
    "domains": "HR",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "BWE",
    "demand": 1,
    "depts": "SS",
    "domains": "TSS",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "MSB",
    "demand": 1,
    "depts": "Machining",
    "domains": "TSS",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "DI-分析计算"
  },
  {
    "name": "IPT",
    "demand": 1,
    "depts": "Machining",
    "domains": "LOG",
    "db": "Oracle",
    "tables": [
      "AFKO AFPO AUFK"
    ],
    "tables_raw": [
      "AFKO AFPO AUFK"
    ],
    "vol_gb": 3,
    "readiness": "A",
    "scenes": "DI-分析计算"
  },
  {
    "name": "VersionDog",
    "demand": 1,
    "depts": "Machining",
    "domains": "PP",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "DI-分析计算"
  },
  {
    "name": "cbFC",
    "demand": 1,
    "depts": "Machining",
    "domains": "F&C",
    "db": "Sql Server",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "B1",
    "scenes": "DI-分析计算"
  },
  {
    "name": "移动污染源",
    "demand": 1,
    "depts": "SM",
    "domains": "安全管理部",
    "db": "Sqlserver",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 29,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "周界报警系统",
    "demand": 1,
    "depts": "SM",
    "domains": "安全管理部",
    "db": "pgsql",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 184,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "安消联动系统",
    "demand": 1,
    "depts": "SM",
    "domains": "安全管理部",
    "db": "mysql",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 94,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "测速系统",
    "demand": 1,
    "depts": "SM",
    "domains": "安全管理部",
    "db": "mysql",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 116,
    "readiness": "B1",
    "scenes": "BI报表"
  },
  {
    "name": "ARGUS",
    "demand": 1,
    "depts": "QM",
    "domains": "MB/MP",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "SPOT",
    "demand": 1,
    "depts": "QM",
    "domains": "MB/MP",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "BI报表"
  },
  {
    "name": "PIA",
    "demand": 1,
    "depts": "QM",
    "domains": "QM",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "DI-分析计算"
  },
  {
    "name": "PDC",
    "demand": 1,
    "depts": "QM",
    "domains": "QM",
    "db": "待确认",
    "tables": [],
    "tables_raw": [],
    "vol_gb": 0,
    "readiness": "D",
    "scenes": "DI-分析计算"
  },
  {
    "name": "MB.OS Portal",
    "demand": 1,
    "depts": "QM",
    "domains": "QM",
    "db": "待确认",
    "tables": [
      "各战役报告"
    ],
    "tables_raw": [
      "各战役报告"
    ],
    "vol_gb": 0,
    "readiness": "B2",
    "scenes": "BI报表"
  }
];

export const BENZ_DATABASES = [
  {
    "name": "SQL Server",
    "systems": [
      "人工填报",
      "人工填报",
      "HR系统",
      "iPortal",
      "iPortal",
      "PiWeb",
      "tagetik",
      "PRISMA",
      "QDA",
      "BDE",
      "Power BI",
      "CAT-8D",
      "EMS MRS",
      "OA",
      "相关方管理系统",
      "相关方管理系统",
      "SQMS",
      "cbfc",
      "IQVIS",
      "Running Cost Dashboard_Cost_V3.3",
      "Running Cost Dashboard_Cost_V3.3",
      "PER",
      "cbFC",
      "移动污染源"
    ],
    "domains": [
      "F&C",
      "HR",
      "IT",
      "LOG",
      "PP",
      "Prod",
      "QM",
      "RD",
      "TSS",
      "安全管理部"
    ],
    "count": 24
  },
  {
    "name": "MySQL",
    "systems": [
      "MRS",
      "iPortal",
      "安消联动系统",
      "测速系统"
    ],
    "domains": [
      "PP",
      "Prod",
      "QM",
      "TSS",
      "安全管理部"
    ],
    "count": 4
  },
  {
    "name": "Oracle",
    "systems": [
      "PRISMA",
      "QS-Torque",
      "IPT"
    ],
    "domains": [
      "LOG",
      "Prod",
      "QM",
      "TSS"
    ],
    "count": 3
  },
  {
    "name": "SAP HANA",
    "systems": [
      "AMS",
      "Running Cost Dashboard_Cost_V3.3"
    ],
    "domains": [
      "F&C",
      "LOG",
      "Prod",
      "QM"
    ],
    "count": 2
  },
  {
    "name": "MongoDB",
    "systems": [
      "低代码"
    ],
    "domains": [
      "F&C",
      "Prod",
      "QM",
      "RD",
      "安全管理部"
    ],
    "count": 1
  },
  {
    "name": "视图",
    "systems": [
      "HR系统"
    ],
    "domains": [
      "HR",
      "安全管理部"
    ],
    "count": 1
  },
  {
    "name": "SAP",
    "systems": [
      "cbfc"
    ],
    "domains": [
      "F&C",
      "Prod"
    ],
    "count": 1
  },
  {
    "name": "tyco",
    "systems": [
      "门禁系统"
    ],
    "domains": [
      "安全管理部"
    ],
    "count": 1
  },
  {
    "name": "安全管理部负责",
    "systems": [
      "安全管理部系统"
    ],
    "domains": [
      "安全管理部"
    ],
    "count": 1
  },
  {
    "name": "IRPO",
    "systems": [
      "IRPO"
    ],
    "domains": [
      "F&C"
    ],
    "count": 1
  },
  {
    "name": "PostgreSQL",
    "systems": [
      "周界报警系统"
    ],
    "domains": [
      "安全管理部"
    ],
    "count": 1
  }
];

export const READINESS_STATS = { A:16, B1:15, B2:3, C:4, D:22 };
