# -*- coding: utf-8 -*-
"""
通用血缘计算引擎

输入: 模型文件目录
输出: DAG 节点-边 JSON
"""
import re
import json
from pathlib import Path
from typing import Optional


def compute_lineage(models_dir: str, macros_dir: Optional[str] = None) -> dict:
    """扫描模型目录，返回 DAG 结构。

    Returns:
        {
            "nodes": [{"id": "n0", "name": "dwd_order_vbrk", "layer": "DWD", "domain": "order"}],
            "edges": [{"from": "n0", "to": "n1", "type": "ref"}],
            "layer_counts": {"ODS": 74, "DWD": 87, "DWS": 8, "DIM": 1, "ADS": 1},
        }
    """
    nodes = []
    edges = []
    node_map = {}
    node_id = 0

    def add_node(name, layer, domain, path, extra=None):
        nonlocal node_id
        if name in node_map:
            return node_map[name]
        nid = f"n{node_id}"
        node_id += 1
        node = {"id": nid, "name": name, "layer": layer, "domain": domain, "path": path}
        if extra:
            node.update(extra)
        nodes.append(node)
        node_map[name] = nid
        return nid

    def add_edge(from_name, to_name, edge_type):
        fid = node_map.get(from_name)
        tid = node_map.get(to_name)
        if fid and tid and fid != tid:
            edges.append({"from": fid, "to": tid, "type": edge_type})

    models_path = Path(models_dir)
    if not models_path.exists():
        return {"nodes": [], "edges": [], "layer_counts": {}}

    for sql_file in models_path.rglob("*.sql"):
        model_name = sql_file.stem
        content = sql_file.read_text(encoding="utf-8")

        # 推断层级和域
        parts = sql_file.parts
        layer = "UNKNOWN"
        domain = "common"
        for p in parts:
            if p in ("dwd", "dws", "dim", "ads"):
                layer = p.upper()
            elif p not in ("models", "intermediate", "finance", "editorial"):
                if layer != "UNKNOWN":
                    domain = p

        # 提取 source 引用
        sources = re.findall(r"source\('ods',\s*'([^']+)'\)", content)
        for src in sources:
            add_node(src, "ODS", domain, "—", {"is_source": True})
            add_edge(model_name, src, "source")

        add_node(model_name, layer, domain,
                 str(sql_file.relative_to(models_path.parent)))

        # 提取 ref 引用
        refs = re.findall(r"ref\('([^']+)'\)", content)
        for ref in refs:
            add_edge(model_name, ref, "ref")

    layer_counts = {}
    for n in nodes:
        layer_counts[n["layer"]] = layer_counts.get(n["layer"], 0) + 1

    return {"nodes": nodes, "edges": edges, "layer_counts": layer_counts}


if __name__ == "__main__":
    import sys
    result = compute_lineage(sys.argv[1] if len(sys.argv) > 1 else "models")
    print(json.dumps(result, ensure_ascii=False, indent=2))
