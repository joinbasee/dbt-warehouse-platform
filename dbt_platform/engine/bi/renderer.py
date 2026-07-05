# -*- coding: utf-8 -*-
"""
ECharts HTML 渲染器

输入：看板配置 + 查询结果数据
输出：完整可离线打开的 HTML 文件
"""
import json
from datetime import datetime
from typing import Optional

# ECharts CDN（国内镜像 + 国际备用）
ECHARTS_CDN = "https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"

# 默认配色方案
COLORS = [
    "#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de",
    "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc", "#48b8d0",
]


class BIHtmlRenderer:
    """HTML BI 看板渲染器"""

    def __init__(self, config: dict):
        self.config = config
        self.name = config.get("name", "未命名看板")
        self.charts = config.get("charts", [])
        self.layout = config.get("layout", {"type": "grid", "cols": 2})
        self._chart_data = {}

    def set_data(self, chart_id: str, data: list[dict]):
        """注入查询结果"""
        self._chart_data[chart_id] = data

    def render(self) -> str:
        """渲染完整 HTML"""
        return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{self.name} — 智能数仓 BI</title>
<script src="{ECHARTS_CDN}"></script>
<style>
{self._render_css()}
</style>
</head>
<body>
<div class="header">
  <h1>{self.name}</h1>
  <div class="meta">生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ｜ 数据源: {self.config.get('datasource', {}).get('model', 'N/A')}</div>
</div>
<div class="dashboard">
{self._render_layout()}
</div>
<script>
{self._render_js()}
</script>
</body>
</html>"""

    def _render_css(self) -> str:
        return """
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif; background: #f0f2f5; color: #333; }
.header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 24px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.header h1 { font-size: 24px; font-weight: 600; }
.header .meta { font-size: 12px; opacity: 0.8; margin-top: 6px; }
.dashboard { max-width: 1400px; margin: 0 auto; padding: 24px; }
.row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.col { background: white; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 16px; }
.col-1 { flex: 1; min-width: 0; }
.col-2 { flex: 2; min-width: 0; }
.card-title { font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.chart-box { width: 100%; height: 360px; }
.chart-box-tall { width: 100%; height: 480px; }
.kpi-card { text-align: center; padding: 24px; }
.kpi-value { font-size: 42px; font-weight: 700; color: #333; }
.kpi-label { font-size: 13px; color: #999; margin-top: 4px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: #fafafa; font-weight: 600; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e8e8e8; }
td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
tr:hover td { background: #fafafa; }
@media (max-width: 768px) { .row { flex-direction: column; } }
"""

    def _render_layout(self) -> str:
        """渲染布局"""
        layout_type = self.layout.get("type", "grid")
        html = ""

        # 构建 chart_id → chart_config 映射
        chart_map = {c["id"]: c for c in self.charts}

        if layout_type == "grid":
            cols = self.layout.get("cols", 2)
            for row in self.layout.get("rows", []):
                html += '<div class="row">'
                for chart_id in row:
                    chart = chart_map.get(chart_id, {})
                    span = len(row)
                    col_class = f"col-{cols}" if span > 1 else "col-1"
                    html += f'<div class="col {col_class}">'
                    html += f'<div class="card-title">{chart.get("title", chart_id)}</div>'
                    if chart.get("type") == "kpi":
                        html += f'<div class="kpi-card"><div class="kpi-value" id="kpi_{chart_id}">--</div><div class="kpi-label">{chart.get("title", "")}</div></div>'
                    elif chart.get("type") == "table":
                        html += f'<div id="table_{chart_id}"></div>'
                    else:
                        height = "chart-box-tall" if span == 1 else "chart-box"
                        html += f'<div class="{height}" id="chart_{chart_id}"></div>'
                    html += '</div>'
                html += '</div>'
        else:
            # 默认：单列堆叠
            for chart in self.charts:
                html += '<div class="row"><div class="col col-1">'
                html += f'<div class="card-title">{chart.get("title", chart["id"])}</div>'
                html += f'<div class="chart-box" id="chart_{chart["id"]}"></div>'
                html += '</div></div>'

        return html

    def _render_js(self) -> str:
        """渲染 ECharts JS 代码"""
        js = [
            "// BI 看板脚本",
            "const COLORS = " + json.dumps(COLORS) + ";",
            "",
        ]

        for chart in self.charts:
            chart_id = chart["id"]
            chart_type = chart["type"]
            data = self._chart_data.get(chart_id, [])
            chart_json = json.dumps(data, ensure_ascii=False, default=str)

            if chart_type == "kpi":
                js.append(self._kpi_js(chart_id, chart_json, chart))
            elif chart_type == "table":
                js.append(self._table_js(chart_id, chart_json, chart))
            elif chart_type == "line":
                js.append(self._chart_js(chart_id, chart_json, chart))
            elif chart_type == "bar":
                js.append(self._chart_js(chart_id, chart_json, chart, chart_type="bar"))
            elif chart_type == "pie":
                js.append(self._pie_js(chart_id, chart_json, chart))
            else:
                js.append(self._chart_js(chart_id, chart_json, chart))

        js.append("window.addEventListener('resize', () => { Object.values(charts).forEach(c => c.resize()); });")
        return "\n".join(js)

    def _kpi_js(self, chart_id: str, data_json: str, chart: dict) -> str:
        metric = chart.get("metric", {})
        fmt = chart.get("format", "{:,.2f}")
        return f"""
(function() {{
  const data = {data_json};
  if (data.length > 0) {{
    const val = data[0]['_value'] || Object.values(data[0])[0] || 0;
    document.getElementById('kpi_{chart_id}').innerText = '{fmt}'.replace('{{}}', val).replace('{{:,.2f}}', Number(val).toLocaleString('zh-CN', {{minimumFractionDigits:2}})).replace('{{:,.0f}}', Number(val).toLocaleString('zh-CN'));
  }}
}})();
"""

    def _table_js(self, chart_id: str, data_json: str, chart: dict) -> str:
        return f"""
(function() {{
  const data = {data_json};
  if (data.length > 0) {{
    const cols = Object.keys(data[0]).filter(k => !k.startsWith('_'));
    let html = '<table><thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>';
    data.forEach(row => {{
      html += '<tr>' + cols.map(c => '<td>' + (row[c] !== null ? row[c] : '-') + '</td>').join('') + '</tr>';
    }});
    html += '</tbody></table>';
    document.getElementById('table_{chart_id}').innerHTML = html;
  }}
}})();
"""

    def _chart_js(self, chart_id: str, data_json: str, chart: dict, chart_type: str = "line") -> str:
        x_field = chart.get("x_field", "")
        metrics = chart.get("metrics", [])
        options = chart.get("options", {})
        chart_title = chart.get("title", chart_id)
        yAxisName = chart.get("y_axis_label", "")

        return f"""
(function() {{
  const data = {data_json};
  const chart = echarts.init(document.getElementById('chart_{chart_id}'));
  charts = charts || {{}};
  charts['{chart_id}'] = chart;

  const xData = [...new Set(data.map(d => d['{x_field}']))].sort();
  const series = {json.dumps(metrics, ensure_ascii=False)}.map((m, i) => ({{
    name: m.label || m.field,
    type: '{chart_type}',
    data: xData.map(x => {{
      const row = data.find(d => d['{x_field}'] === x);
      return row ? (row[m.field] || 0) : 0;
    }}),
    smooth: {str(options.get('smooth', True)).lower()},
    itemStyle: {{ color: COLORS[i % COLORS.length] }},
  }}));

  chart.setOption({{
    title: {{ text: '', left: 'center' }},
    tooltip: {{ trigger: 'axis' }},
    legend: {{ bottom: 0, type: 'scroll' }},
    grid: {{ left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true }},
    xAxis: {{ type: 'category', data: xData, axisLabel: {{ rotate: xData.length > 10 ? 45 : 0 }} }},
    yAxis: {{ type: 'value', name: '{yAxisName}' }},
    series: series,
    color: COLORS,
  }});
}})();
"""

    def _pie_js(self, chart_id: str, data_json: str, chart: dict) -> str:
        dimension = chart.get("dimension", "")
        metric = chart.get("metric", {})
        options = chart.get("options", {})

        return f"""
(function() {{
  const data = {data_json};
  const chart = echarts.init(document.getElementById('chart_{chart_id}'));
  charts = charts || {{}};
  charts['{chart_id}'] = chart;

  const pieData = data.map(d => ({{
    name: String(d['{dimension}']),
    value: Number(d['{metric.get("field", "")}']) || 0,
  }}));

  chart.setOption({{
    title: {{ text: '', left: 'center' }},
    tooltip: {{ trigger: 'item', formatter: '{{b}}: {{c}} ({{d}}%)' }},
    legend: {{ bottom: 0, type: 'scroll' }},
    series: [{{
      type: 'pie',
      radius: '{options.get("radius", "60%")}',
      center: ['50%', '45%'],
      data: pieData,
      emphasis: {{ itemStyle: {{ shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' }} }},
    }}],
    color: COLORS,
  }});
}})();
"""
