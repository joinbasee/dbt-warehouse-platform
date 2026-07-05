# -*- coding: utf-8 -*-
"""
BI 看板配置结构定义

一个看板 = 数据源 + N个图表 + 布局
"""
from typing import Optional


# 图表类型枚举
CHART_TYPES = {
    "line": "折线图",
    "bar": "柱状图",
    "pie": "饼图",
    "scatter": "散点图",
    "kpi": "指标卡",       # 大数字 + 同比环比
    "table": "数据表格",
    "heatmap": "热力图",
    "funnel": "漏斗图",
}

# 支持的聚合函数
AGGREGATIONS = ["sum", "avg", "count", "max", "min", "count_distinct"]

# 看板配置示例结构（YAML 格式）
DASHBOARD_SCHEMA_EXAMPLE = """
# 看板名称
name: "开票明细监控"
description: "每日开票金额、数量、税率分布"
refresh: "0 6 * * *"        # 刷新频率（cron）

# 数据源
datasource:
  type: ads                   # ads | sql | file
  model: ads_fi_zsdr005       # ADS 模型名
  target: hive                # dev | hive | oceanbase_ads
  # filters:                  # 可选：全局过滤
  #   invoice_date:
  #     gte: "2025-01-01"

# 图表列表
charts:
  - id: kpi_amount
    type: kpi
    title: "本月开票总额"
    metric: { field: "actual_amount_total", agg: sum }
    format: "¥{:,.2f}"

  - id: trend_amount
    type: line
    title: "每日开票趋势"
    x_field: invoice_date
    metrics:
      - { field: "actual_amount_total", agg: sum, label: "实洋" }
      - { field: "list_price_total", agg: sum, label: "码洋" }
    options:
      smooth: true

  - id: pie_tax_rate
    type: pie
    title: "税率分布"
    dimension: tax_rate
    metric: { field: "actual_amount_total", agg: sum }
    options:
      radius: "60%"

  - id: table_top10
    type: table
    title: "Top 10 客户"
    columns: [customer_code, customer_name, actual_amount_total]
    order_by: { field: "actual_amount_total", direction: desc }
    limit: 10

# 布局
layout:
  type: grid                   # grid | tabs | single
  cols: 2                      # 网格列数
  rows:
    - [kpi_amount]             # 第一行：单指标卡
    - [trend_amount, pie_tax_rate]  # 第二行：折线图+饼图
    - [table_top10]            # 第三行：表格
"""
