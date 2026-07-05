# -*- coding: utf-8 -*-
"""
HTML BI 看板生成器 — 主入口

一条命令生成完整看板：
    python engine/bi/generator.py --config config/bi_dashboards/开票明细.yml

流程：
    config → query ADS → ECharts render → output HTML
"""
import json
import sys
import argparse
from pathlib import Path
from datetime import datetime

from dbt_platform.engine.utils.project import get_platform_root, resolve_project_root

PLATFORM_ROOT = get_platform_root()

from dbt_platform.engine.bi.renderer import BIHtmlRenderer
from dbt_platform.engine.bi.query import AdsQuerier


class BiGenerator:
    """BI 看板生成器"""

    def __init__(self, config_path: str):
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.renderer = BIHtmlRenderer(self.config)
        self.querier = None  # 延迟初始化

    def _load_config(self) -> dict:
        """加载 YAML 配置文件"""
        try:
            import yaml
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except ImportError:
            print("[ERROR] 需要安装 PyYAML: pip install pyyaml")
            sys.exit(1)

    def generate(self, target: str = None) -> str:
        """生成 HTML 看板

        Returns:
            生成的 HTML 文件路径
        """
        ds = self.config.get("datasource", {})
        target = target or ds.get("target", "hive")

        print(f"看板: {self.config.get('name', '未命名')}")
        print(f"数据源: {ds.get('model', 'N/A')} (target={target})")
        print(f"图表数: {len(self.config.get('charts', []))}")
        print()

        # 1. 查询数据
        self.querier = AdsQuerier(
            target=target,
            config={
                "host": ds.get("host", ""),
                "port": ds.get("port", 0),
                "user": ds.get("user", ""),
                "password": ds.get("password", ""),
            }
        )

        model = ds.get("model", "")
        global_filters = ds.get("filters", {})

        for chart in self.config.get("charts", []):
            chart_id = chart["id"]
            chart_type = chart["type"]
            print(f"  [{chart_type}] {chart.get('title', chart_id)} ...", end=" ")

            try:
                # 构建查询
                fields = self._get_fields(chart)
                filters = {**global_filters, **chart.get("filters", {})}
                order_by = self._get_order(chart)
                limit = chart.get("limit", None)

                data = self.querier.query_model(
                    model, fields, filters, order_by, limit
                )
                print(f"{len(data)} 行")

                # 聚合
                data = self._aggregate(chart, data)

                # 注入渲染器
                self.renderer.set_data(chart_id, data)

            except Exception as e:
                print(f"失败: {e}")
                self.renderer.set_data(chart_id, [])

        # 2. 渲染 HTML
        html = self.renderer.render()

        # 3. 输出
        proot = self.project_root if hasattr(self, 'project_root') else resolve_project_root()
        output_dir = proot / "output" / "bi"
        output_dir.mkdir(parents=True, exist_ok=True)
        name = self.config.get("name", "看板")
        safe_name = name.replace("/", "_").replace(" ", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = output_dir / f"{safe_name}_{timestamp}.html"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)

        print(f"\n[OK] 看板已生成: {output_path}")
        return str(output_path)

    @classmethod
    def generate_all(cls, target: str = "hive", config_dir: str = None) -> list[str]:
        """批量生成所有看板"""
        if config_dir is None:
            config_dir = resolve_project_root() / "config" / "bi_dashboards"
        else:
            config_dir = Path(config_dir)

        if not config_dir.exists():
            print(f"[WARN] 看板配置目录不存在: {config_dir}")
            return []

        yaml_files = sorted(list(config_dir.glob("*.yml")) + list(config_dir.glob("*.yaml")))
        if not yaml_files:
            print("[WARN] 未找到看板配置文件")
            return []

        results = []
        for yf in yaml_files:
            print(f"\n看板: {yf.stem}")
            try:
                gen = cls(str(yf))
                path = gen.generate(target=target)
                results.append(path)
            except Exception as e:
                print(f"[FAIL] {yf.stem}: {e}")

        print(f"\n完成: {len(results)}/{len(yaml_files)} 个看板已生成")
        return results

    @staticmethod
    def list_dashboards(config_dir: str = None) -> list[str]:
        """列出所有看板配置"""
        if config_dir is None:
            config_dir = resolve_project_root() / "config" / "bi_dashboards"
        else:
            config_dir = Path(config_dir)
        if not config_dir.exists():
            return []
        names = []
        for f in sorted(config_dir.glob("*.yml")):
            names.append(f.stem)
        for f in sorted(config_dir.glob("*.yaml")):
            names.append(f.stem)
        return names

    def _get_fields(self, chart: dict) -> list[str]:
        """提取图表需要的所有字段"""
        fields = []
        if "x_field" in chart:
            fields.append(chart["x_field"])
        if "dimension" in chart:
            fields.append(chart["dimension"])
        for m in chart.get("metrics", []):
            if isinstance(m, dict):
                fields.append(m.get("field", ""))
        metric = chart.get("metric")
        if isinstance(metric, dict):
            fields.append(metric.get("field", ""))
        for col in chart.get("columns", []):
            if isinstance(col, str):
                fields.append(col)
            elif isinstance(col, dict):
                fields.append(col.get("field", ""))
        return list(set(f for f in fields if f))

    def _get_order(self, chart: dict) -> str:
        """构建 ORDER BY"""
        ob = chart.get("order_by")
        if isinstance(ob, dict):
            return f"{ob['field']} {ob.get('direction', 'DESC')}"
        return None

    def _aggregate(self, chart: dict, data: list[dict]) -> list[dict]:
        """在 Python 侧做简单聚合"""
        chart_type = chart["type"]
        if chart_type in ("kpi",):
            metric = chart.get("metric", {})
            field = metric.get("field", "")
            agg = metric.get("agg", "sum")
            if field and data:
                values = [float(row.get(field, 0) or 0) for row in data]
                if agg == "sum":
                    return [{"_value": sum(values)}]
                elif agg == "avg":
                    return [{"_value": sum(values) / len(values)}]
                elif agg == "count":
                    return [{"_value": len(values)}]
                elif agg == "max":
                    return [{"_value": max(values)}]
                elif agg == "min":
                    return [{"_value": min(values)}]
            return [{"_value": 0}]

        # 按 x_field + metric 聚合
        if chart_type in ("line", "bar"):
            x_field = chart.get("x_field", "")
            metrics = chart.get("metrics", [])
            if x_field and metrics:
                grouped = {}
                for row in data:
                    key = str(row.get(x_field, ""))
                    if key not in grouped:
                        grouped[key] = {x_field: key}
                        for m in metrics:
                            grouped[key][m["field"]] = 0
                    for m in metrics:
                        grouped[key][m["field"]] += float(row.get(m["field"], 0) or 0)
                return list(grouped.values())

        return data


def main():
    parser = argparse.ArgumentParser(description="HTML BI 看板生成器")
    parser.add_argument("--config", "-c", required=True, help="看板 YAML 配置文件路径")
    parser.add_argument("--target", "-t", default=None, help="数据源 target (dev/hive/oceanbase_ads)")
    parser.add_argument("--list", action="store_true", help="列出所有看板配置")
    args = parser.parse_args()

    if args.list:
        config_dir = PLATFORM_ROOT / "config" / "bi_dashboards"
        if config_dir.exists():
            for f in config_dir.glob("*.yml"):
                print(f"  {f.stem}")
            for f in config_dir.glob("*.yaml"):
                print(f"  {f.stem}")
        else:
            print("  (无看板配置)")
        return

    gen = BiGenerator(args.config)
    gen.generate(target=args.target)


if __name__ == "__main__":
    main()
