# -*- coding: utf-8 -*-
"""
CLI 命令行入口 — 智能数仓建设平台

用法:
  python cli/cli.py init my_project --adapter sap_ecc
  python cli/cli.py run billing --target hive
  python cli/cli.py agent list
  python cli/cli.py agent run agent-03 --domain fi
  python cli/cli.py scan
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

from dbt_platform.engine.utils.project import (
    get_platform_root, resolve_project_root,
    switch_project, list_projects, get_current_project_name, get_data_dir,
)

PLATFORM_ROOT = get_platform_root()


# ═══════════════════════════════════════════════════════════════
# 辅助函数
# ═══════════════════════════════════════════════════════════════

def get_project_root(args=None) -> Path:
    """解析当前活跃项目根目录"""
    project_arg = getattr(args, 'project', None) if args else None
    if project_arg:
        candidate = Path(project_arg)
        # 支持项目名（projects/ 下）或完整路径
        if not candidate.exists():
            candidate = PLATFORM_ROOT / "projects" / project_arg
        if candidate.exists() and (candidate / "project.yml").exists():
            return candidate.resolve()
        print(f"[WARN] 项目 '{project_arg}' 不存在，回退到默认项目")
    return resolve_project_root(PLATFORM_ROOT)


def load_project_config(args=None) -> dict:
    """加载活跃项目的 project.yml"""
    proot = get_project_root(args)
    config_path = proot / "project.yml"
    if not config_path.exists():
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_agent_runner(mode: str = "ai", args=None):
    """获取 AgentRunner 实例"""
    from dbt_platform.engine.orchestrator.agent_runner import AgentRunner
    config = load_project_config(args)
    proot = get_project_root(args)
    return AgentRunner(config, mode=mode, project_root=proot)


# ═══════════════════════════════════════════════════════════════
# init — 初始化新项目
# ═══════════════════════════════════════════════════════════════

def cmd_init(args):
    from dbt_platform.engine.utils.project import get_data_dir
    data = get_data_dir()
    template_dir = data / "templates" / f"{args.adapter}_warehouse"

    # 优先在 PLATFORM_ROOT/projects/ 下创建，回退到当前目录
    projects_parent = PLATFORM_ROOT if (PLATFORM_ROOT / "projects").exists() else Path.cwd()
    target_dir = projects_parent / args.name

    if target_dir.exists():
        print(f"[FAIL] 项目已存在: {target_dir}")
        return 1

    if template_dir.exists():
        shutil.copytree(template_dir, target_dir)
        print(f"[OK] 从模板创建: {args.adapter}_warehouse → projects/{args.name}")
    else:
        target_dir.mkdir(parents=True)
        (target_dir / "models").mkdir()
        (target_dir / "macros").mkdir()
        (target_dir / "config").mkdir()
        (target_dir / "output").mkdir()
        config = {
            "project": {"name": args.name, "description": "", "version": "0.1.0"},
            "source": {"adapter": args.adapter},
            "layers": [
                {"name": "ODS", "code": "ods", "schema": "ods", "read_only": True},
                {"name": "DWD", "code": "dwd", "schema": "dw", "materialized": "table"},
                {"name": "DWS", "code": "dws", "schema": "dw", "materialized": "table"},
                {"name": "ADS", "code": "ads", "schema": "ads"},
            ],
            "domains": [],
            "scenarios": [],
        }
        with open(target_dir / "project.yml", "w", encoding="utf-8") as f:
            yaml.dump(config, f, allow_unicode=True, default_flow_style=False)
        print(f"[OK] 创建空项目: projects/{args.name}")

    # 自动设为活跃项目
    switch_project(PLATFORM_ROOT, args.name)
    print(f"[OK] 已设为活跃项目")

    print(f"\n下一步:")
    print(f"  cd projects/{args.name}")
    print(f"  编辑 projects/{args.name}/project.yml 填入源系统信息和业务域")
    print(f"  dbt-platform scan")
    return 0


# ═══════════════════════════════════════════════════════════════
# run — 执行场景
# ═══════════════════════════════════════════════════════════════

def cmd_run(args):
    runner = get_agent_runner(mode="legacy", args=args)
    result = runner.run_scene(args.scene, target=args.target, dry_run=args.dry_run)

    if args.dry_run:
        runner.print_plan(args.scene)
        return 0

    for step in result.get("steps", []):
        icon = "[OK]" if step["status"] == "ok" else "[FAIL]"
        print(f"  {icon} {step['action']} {step['model']}")

    if result["success"]:
        print(f"\n[OK] 场景 {args.scene} 执行成功")
        return 0
    else:
        print(f"\n[FAIL] 场景 {args.scene} 执行失败")
        return 1


# ═══════════════════════════════════════════════════════════════
# dwd — DWD 模型生成
# ═══════════════════════════════════════════════════════════════

def cmd_dwd(args):
    """从 project.yml + 适配器生成 DWD SQL"""
    from dbt_platform.engine.adapters.mysql import load_adapter
    from dbt_platform.engine.generators.dwd_generator import DwdGenerator

    config = load_project_config(args)
    adapter_name = config.get("source", {}).get("adapter", "sap_ecc")
    adapter = load_adapter(adapter_name)
    gen = DwdGenerator(adapter, config)

    if args.dwd_command == "generate":
        table = args.table
        # 简单列定义（可从 inventory JSON 加载）
        columns = []
        if args.columns:
            for col_def in args.columns.split(","):
                parts = col_def.strip().split(":")
                col = {
                    "name": parts[0],
                    "sap_name": parts[0],
                    "target_type": parts[1] if len(parts) > 1 else "string",
                }
                columns.append(col)

        if not columns:
            print("[INFO] 未指定列定义，生成模板框架。")
            print("  用法: dbt-platform dwd generate --table vbrk --columns 'erdat:date,netwr:decimal'")
            columns = [{"name": "*", "sap_name": "*", "target_type": "string"}]

        sql = gen.generate(table, columns)
        print(sql)

        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(sql, encoding="utf-8")
            print(f"\n[OK] 已保存: {output_path}")

    elif args.dwd_command == "preview":
        table = args.table
        sql = gen.generate(table, [{"name": "*", "sap_name": "*", "target_type": "string"}])
        print(sql)

    return 0


# ═══════════════════════════════════════════════════════════════
# agent — Agent 管理
# ═══════════════════════════════════════════════════════════════

def cmd_agent(args):
    if args.agent_command == "list":
        return _agent_list(args)
    elif args.agent_command == "show":
        return _agent_show(args)
    elif args.agent_command == "run":
        return _agent_run(args)
    elif args.agent_command == "pipeline":
        return _agent_pipeline(args)
    elif args.agent_command == "status":
        return _agent_status(args)
    else:
        print("[FAIL] 未知 agent 子命令")
        return 1


def _agent_list(args):
    runner = get_agent_runner(args=args)
    agents = runner.list_agents()
    if not agents:
        print("(无 Agent 定义，请检查 .claude/agents/ 目录)")
        return 0
    header = f"{'ID':14s} {'名称':16s} {'状态':10s} {'依赖':20s}"
    print(header)
    print("-" * len(header))
    for a in agents:
        deps = ", ".join(a["dependencies"]) if a["dependencies"] else "—"
        print(f"{a['id']:14s} {a['name']:16s} {a['status']:10s} {deps:20s}")
    return 0


def _agent_show(args):
    runner = get_agent_runner(args=args)
    info = runner.show_agent(args.agent_id)
    if not info:
        print(f"[FAIL] Agent 不存在: {args.agent_id}")
        return 1
    print(f"Agent: {info['name']} ({info['id']})")
    print(f"状态: {info['status']}")
    print(f"顺序: {info['order']}")
    print(f"依赖: {', '.join(info['dependencies']) if info['dependencies'] else '—'}")
    print(f"层权限: R={info['layer_permissions'].get('read', [])} W={info['layer_permissions'].get('write', [])}")
    print(f"域范围: {info['domain_scope']}")
    print(f"工具: dbt={info['tools'].get('dbt', [])} scripts={info['tools'].get('scripts', [])}")
    print(f"\n输入合同:\n  {info['input_contract']}")
    print(f"\n输出合同:\n  {info['output_contract']}")
    if info.get("forbidden"):
        print(f"\n禁止事项:")
        for item in info["forbidden"]:
            print(f"  - {item}")
    if info.get("acceptance"):
        print(f"\n验收标准:")
        for item in info["acceptance"]:
            print(f"  - {item}")
    return 0


def _agent_run(args):
    runner = get_agent_runner(mode=getattr(args, 'mode', 'ai'), args=args)
    result = runner.run_agent(
        args.agent_id,
        domain=args.domain,
        target=args.target,
        dry_run=args.dry_run,
    )

    if not result["success"]:
        print(f"[FAIL] {result.get('error', '未知错误')}")
        return 1

    if result["mode"] == "dry_run":
        print(f"\n[DRY RUN] Agent: {result['agent_id']}")
        print("执行计划:")
        for i, step in enumerate(result.get("plan", []), 1):
            print(f"  {i}. [{step['action']}] {step.get('model', '')}")
        return 0

    if result["mode"] == "ai":
        print(f"[AI MODE] Agent {result['agent_id']} prompt 已构建")
        print(f"\n{'='*60}")
        print(result.get("prompt", ""))
        print(f"{'='*60}")
        print(f"\n{result.get('hint', '')}")
        return 0

    # legacy mode
    for step in result.get("steps", []):
        icon = "[OK]" if step["status"] == "ok" else "[FAIL]"
        print(f"  {icon} {step['action']} {step.get('model', '')}")
    print(f"\n[{'OK' if result['success'] else 'FAIL'}] Agent {result['agent_id']}")
    return 0 if result["success"] else 1


def _agent_pipeline(args):
    runner = get_agent_runner(args=args)
    ordered = runner.loader.topological_order()
    if not ordered:
        print("(无 Agent 定义)")
        return 0

    if args.dry_run:
        print("Agent 执行顺序 (拓扑排序):")
        for i, agent in enumerate(ordered):
            deps = ", ".join(agent.dependencies) if agent.dependencies else "—"
            print(f"  {i+1}. {agent.id} ({agent.name}) status={agent.status} deps=[{deps}]")
        return 0

    for agent in ordered:
        if args.start_from and agent.order < int(args.start_from.split("-")[1]):
            continue
        if agent.status != "pending":
            print(f"  [SKIP] {agent.id} ({agent.name}) — 状态: {agent.status}")
            continue
        result = runner.run_agent(
            agent.id,
            domain=args.domain,
            target=args.target,
            dry_run=False,
        )
        status = "[OK]" if result["success"] else "[FAIL]"
        print(f"  {status} {agent.id} ({agent.name})")
        if not result["success"]:
            print(f"    错误: {result.get('error', '未知')}")
            if not args.force:
                print("[STOP] 管道中断（使用 --force 继续）")
                return 1
    return 0


def _agent_status(args):
    runner = get_agent_runner(args=args)
    agents = runner.list_agents()
    if not agents:
        print("(无 Agent 定义)")
        return 0

    status_map = {"completed": "[OK]", "pending": "[ ]", "in_progress": "[>>]", "failed": "[X]"}
    for a in agents:
        icon = status_map.get(a["status"], "[?]")
        print(f"  {icon} {a['id']:14s} {a['name']:16s} {a['status']}")
    return 0


# ═══════════════════════════════════════════════════════════════
# validate — 跨库验证
# ═══════════════════════════════════════════════════════════════

def cmd_validate(args):
    proot = get_project_root(args)
    script = PLATFORM_ROOT / "scripts" / "validate_cross_db.py"
    if script.exists():
        env = os.environ.copy()
        env["DBT_PROJECT"] = str(proot)
        result = subprocess.run([sys.executable, str(script)] + sys.argv[2:], env=env)
        return result.returncode
    print("[FAIL] validate_cross_db.py 不存在")
    return 1


# ═══════════════════════════════════════════════════════════════
# bi — HTML BI 看板
# ═══════════════════════════════════════════════════════════════

def cmd_bi(args):
    proot = get_project_root(args)
    if args.bi_command == "generate":
        from dbt_platform.engine.bi.generator import BiGenerator
        gen = BiGenerator(args.config, project_root=proot)
        gen.generate(target=args.target)
        return 0
    elif args.bi_command == "generate-all":
        from dbt_platform.engine.bi.generator import BiGenerator
        BiGenerator.generate_all(target=args.target or "hive")
        return 0
    elif args.bi_command == "list":
        from dbt_platform.engine.bi.generator import BiGenerator
        names = BiGenerator.list_dashboards()
        if names:
            for n in names:
                print(f"  {n}")
        else:
            print("  (无看板配置)")
        return 0
    else:
        print("[FAIL] 未知 bi 子命令")
        return 1


# ═══════════════════════════════════════════════════════════════
# scan — 项目扫描
# ═══════════════════════════════════════════════════════════════

def cmd_scan(args):
    proot = get_project_root(args)
    result = {"models": [], "macros": [], "domains": {}}

    models_dir = proot / "models"
    if models_dir.exists():
        for layer in models_dir.iterdir():
            if layer.is_dir():
                for sql_file in layer.rglob("*.sql"):
                    result["models"].append({
                        "name": sql_file.stem,
                        "layer": layer.name,
                        "path": str(sql_file.relative_to(proot)),
                    })

    macros_dir = proot / "macros"
    if macros_dir.exists():
        result["macros"] = [f.stem for f in macros_dir.glob("*.sql")]

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"项目: {get_current_project_name()}")
        print(f"Models: {len(result['models'])}")
        print(f"Macros: {len(result['macros'])}")
    return 0


# ═══════════════════════════════════════════════════════════════
# list — 列出场景和域
# ═══════════════════════════════════════════════════════════════

def cmd_list(args):
    config = load_project_config(args)
    print("业务域:")
    for d in config.get("domains", []):
        print(f"  {d['code']:10s} {d['name']}")
    print("\n业务场景:")
    for s in config.get("scenarios", []):
        print(f"  {s['code']:15s} {s['name']:10s} {s.get('schedule', '手动')}")
    return 0


# ═══════════════════════════════════════════════════════════════
# project — 项目管理
# ═══════════════════════════════════════════════════════════════

def cmd_project(args):
    if args.project_command == "list":
        projects = list_projects(PLATFORM_ROOT)
        if not projects:
            print("(无项目，请用 dbt-platform init <name> 创建)")
            return 0
        current = get_current_project_name()
        print(f"{'':2s} {'项目':20s} {'显示名称':25s} {'适配器':12s}")
        print("-" * 62)
        for p in projects:
            marker = "*" if p["name"] in current else " "
            print(f"{marker:1s} {p['name']:20s} {p['display_name']:25s} {p['source_adapter']:12s}")
        print(f"\n* 当前活跃项目")
        return 0

    elif args.project_command == "current":
        name = get_current_project_name()
        proot = resolve_project_root(PLATFORM_ROOT)
        print(f"当前项目: {name}")
        print(f"项目路径: {proot}")
        config = load_project_config()
        p = config.get("project", {})
        print(f"显示名称: {p.get('name', 'N/A')}")
        print(f"源适配器: {config.get('source', {}).get('adapter', 'N/A')}")
        return 0

    elif args.project_command == "switch":
        try:
            new_root = switch_project(PLATFORM_ROOT, args.name)
            print(f"[OK] 已切换到项目: {args.name}")
            print(f"路径: {new_root}")
        except FileNotFoundError as e:
            print(f"[FAIL] {e}")
            return 1
        return 0

    elif args.project_command == "create":
        # 代理到 cmd_init 的逻辑
        from argparse import Namespace
        fake_args = Namespace(
            name=args.name,
            adapter=getattr(args, 'adapter', 'sap_ecc'),
        )
        return cmd_init(fake_args)

    else:
        print("[FAIL] 未知 project 子命令")
        return 1


# ═══════════════════════════════════════════════════════════════
# main — CLI 入口
# ═══════════════════════════════════════════════════════════════

def main():
    # 全局 parent parser（所有子命令继承 --project）
    parent = argparse.ArgumentParser(add_help=False)
    parent.add_argument("--project", "-p", default=None,
                        help="项目名称或路径（默认读取 .active_project）")

    parser = argparse.ArgumentParser(
        prog="dbt-platform",
        description="智能数仓建设平台 — CLI",
    )
    sub = parser.add_subparsers(dest="command")

    # init
    p_init = sub.add_parser("init", help="初始化新项目", parents=[parent])
    p_init.add_argument("name", help="项目名称")
    p_init.add_argument("--adapter", default="sap_ecc",
                        choices=["sap_ecc", "mysql", "custom"],
                        help="源系统适配器")

    # project
    p_project = sub.add_parser("project", help="项目管理", parents=[parent])
    project_sub = p_project.add_subparsers(dest="project_command")
    project_sub.add_parser("list", help="列出所有项目", parents=[parent])
    project_sub.add_parser("current", help="显示当前项目", parents=[parent])
    p_project_switch = project_sub.add_parser("switch", help="切换项目", parents=[parent])
    p_project_switch.add_argument("name", help="项目名称")
    p_project_create = project_sub.add_parser("create", help="创建新项目", parents=[parent])
    p_project_create.add_argument("name", help="项目名称")
    p_project_create.add_argument("--adapter", default="sap_ecc",
                                  choices=["sap_ecc", "mysql", "custom"],
                                  help="源系统适配器")

    # dwd
    p_dwd = sub.add_parser("dwd", help="DWD 模型生成", parents=[parent])
    dwd_sub = p_dwd.add_subparsers(dest="dwd_command")
    p_dwd_gen = dwd_sub.add_parser("generate", help="生成 DWD SQL", parents=[parent])
    p_dwd_gen.add_argument("--table", "-t", required=True, help="源表名")
    p_dwd_gen.add_argument("--columns", "-c", default=None, help="列定义 (name:type,...)")
    p_dwd_gen.add_argument("--output", "-o", default=None, help="输出文件路径")
    p_dwd_preview = dwd_sub.add_parser("preview", help="预览模板", parents=[parent])
    p_dwd_preview.add_argument("--table", "-t", required=True, help="源表名")

    # run
    p_run = sub.add_parser("run", help="执行场景", parents=[parent])
    p_run.add_argument("scene", help="场景代码或名称")
    p_run.add_argument("--target", default="hive", help="目标环境")
    p_run.add_argument("--dry-run", action="store_true", help="仅打印计划")

    # agent
    p_agent = sub.add_parser("agent", help="Agent 管理", parents=[parent])
    agent_sub = p_agent.add_subparsers(dest="agent_command")

    p_agent_list = agent_sub.add_parser("list", help="列出所有 Agent", parents=[parent])

    p_agent_show = agent_sub.add_parser("show", help="显示 Agent 详情", parents=[parent])
    p_agent_show.add_argument("agent_id", help="Agent ID (如 agent-03)")

    p_agent_run = agent_sub.add_parser("run", help="独立执行一个 Agent", parents=[parent])
    p_agent_run.add_argument("agent_id", help="Agent ID")
    p_agent_run.add_argument("--domain", "-d", default=None, help="限定业务域")
    p_agent_run.add_argument("--target", "-t", default="hive", help="目标环境")
    p_agent_run.add_argument("--mode", "-m", default="ai", choices=["ai", "legacy"],
                              help="执行模式: ai (输出prompt) | legacy (直接dbt)")
    p_agent_run.add_argument("--dry-run", action="store_true", help="仅打印执行计划")

    p_agent_pipeline = agent_sub.add_parser("pipeline", help="执行 Agent 管道", parents=[parent])
    p_agent_pipeline.add_argument("--start-from", default=None, help="起始 Agent ID")
    p_agent_pipeline.add_argument("--domain", "-d", default=None, help="限定业务域")
    p_agent_pipeline.add_argument("--target", "-t", default="hive", help="目标环境")
    p_agent_pipeline.add_argument("--dry-run", action="store_true", help="仅打印管道计划")
    p_agent_pipeline.add_argument("--force", action="store_true", help="失败后继续")

    p_agent_status = agent_sub.add_parser("status", help="查看 Agent 执行状态", parents=[parent])

    # validate
    sub.add_parser("validate", help="跨库数据验证", parents=[parent])

    # bi
    p_bi = sub.add_parser("bi", help="HTML BI 看板", parents=[parent])
    bi_sub = p_bi.add_subparsers(dest="bi_command")
    p_bi_gen = bi_sub.add_parser("generate", help="生成看板", parents=[parent])
    p_bi_gen.add_argument("--config", "-c", required=True, help="看板 YAML 配置路径")
    p_bi_gen.add_argument("--target", "-t", default=None, help="数据源 target")
    p_bi_gen_all = bi_sub.add_parser("generate-all", help="批量生成所有看板", parents=[parent])
    p_bi_gen_all.add_argument("--target", "-t", default="hive", help="数据源 target")
    bi_sub.add_parser("list", help="列出所有看板", parents=[parent])

    # scan
    p_scan = sub.add_parser("scan", help="扫描项目结构", parents=[parent])
    p_scan.add_argument("--json", action="store_true", help="JSON 输出")

    # list
    sub.add_parser("list", help="列出场景和域", parents=[parent])

    args = parser.parse_args()

    # 路由
    if args.command == "init":
        return cmd_init(args)
    elif args.command == "project":
        return cmd_project(args)
    elif args.command == "run":
        return cmd_run(args)
    elif args.command == "dwd":
        return cmd_dwd(args)
    elif args.command == "agent":
        return cmd_agent(args)
    elif args.command == "validate":
        return cmd_validate(args)
    elif args.command == "bi":
        return cmd_bi(args)
    elif args.command == "scan":
        return cmd_scan(args)
    elif args.command == "list":
        return cmd_list(args)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
