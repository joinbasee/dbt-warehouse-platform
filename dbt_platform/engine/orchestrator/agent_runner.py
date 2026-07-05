# -*- coding: utf-8 -*-
"""
Agent 编排器

将 project.yml 中的场景定义 → Agent 执行序列。
场景的每个 step（run/test/validate）映射为一个 Agent 或 dbt 命令。

用法:
    from dbt_platform.engine.orchestrator.agent_runner import AgentRunner
    runner = AgentRunner(project_config)
    runner.run_scene("billing", target="hive")
"""
import subprocess
import sys
from pathlib import Path
from typing import Optional

from dbt_platform.engine.utils.project import get_platform_root, resolve_project_root

PLATFORM_ROOT = get_platform_root()


class AgentRunner:
    """场景编排执行器 — AI Agent + dbt 命令双模式"""

    AGENT_ROLES = {
        0: "规范制定",
        1: "场景分析",
        2: "ODS 搭建",
        3: "DWD 开发",
        4: "DWS 开发",
        5: "DIM 设计",
        6: "ADS 开发",
        7: "OceanBase 迁移验证",
    }

    def __init__(self, project_config: dict, mode: str = "ai",
                 project_root: Optional[Path] = None):
        self.config = project_config
        self.mode = mode
        self.project_root = project_root or resolve_project_root(PLATFORM_ROOT)
        self.scenarios = {s["code"]: s for s in project_config.get("scenarios", [])}
        self._loader = None
        self._agents = None

    @property
    def loader(self):
        if self._loader is None:
            from dbt_platform.engine.orchestrator.agent_loader import AgentLoader
            self._loader = AgentLoader()
        return self._loader

    @property
    def agents(self):
        if self._agents is None:
            self._agents = self.loader.load_all()
        return self._agents

    # ── Agent 管理 ──

    def list_agents(self) -> list[dict]:
        return self.loader.list_all()

    def show_agent(self, agent_id: str) -> Optional[dict]:
        agent = self.loader.load(agent_id)
        return agent.to_dict() if agent else None

    def run_agent(self, agent_id: str, domain: Optional[str] = None,
                  target: str = "hive", dry_run: bool = False) -> dict:
        agent = self.loader.load(agent_id)
        if not agent:
            return {"success": False, "error": f"Agent 不存在: {agent_id}"}

        plan = self._build_agent_plan(agent, domain, target)

        if dry_run:
            return {"success": True, "agent_id": agent_id, "mode": "dry_run", "plan": plan}

        # Legacy 模式：直接执行 dbt 命令
        results = []
        for step in plan:
            try:
                cmd = self._build_dbt_cmd(step["action"], step.get("model", ""), target)
                result = subprocess.run(
                    cmd, cwd=str(self.project_root), capture_output=True, text=True, timeout=3600
                )
                results.append({
                    "action": step["action"], "model": step.get("model", ""),
                    "status": "ok" if result.returncode == 0 else "fail",
                })
            except Exception as e:
                results.append({
                    "action": step["action"], "model": step.get("model", ""),
                    "status": "error", "error": str(e),
                })

        ok = all(r["status"] == "ok" for r in results)
        return {"success": ok, "agent_id": agent_id, "mode": "legacy", "steps": results}

    def list_scenes(self) -> list[dict]:
        """列出所有场景"""
        return [
            {"code": s["code"], "name": s["name"], "schedule": s.get("schedule", "")}
            for s in self.config.get("scenarios", [])
        ]

    def run_scene(self, scene_code: str, target: str = "hive",
                  dry_run: bool = False) -> dict:
        """执行一个场景的所有步骤"""
        scene = self.scenarios.get(scene_code)
        if not scene:
            return {"success": False, "error": f"场景不存在: {scene_code}"}

        results = []
        for step in scene.get("steps", []):
            if isinstance(step, str):
                step = self._parse_step(step)

            action = step.get("action", "run")
            model = step.get("model", "")

            if dry_run:
                results.append({"action": action, "model": model, "status": "dry_run"})
                continue

            try:
                cmd = self._build_dbt_cmd(action, model, target)
                result = subprocess.run(
                    cmd, cwd=str(self.project_root), capture_output=True, text=True, timeout=3600
                )
                results.append({
                    "action": action,
                    "model": model,
                    "status": "ok" if result.returncode == 0 else "fail",
                    "stdout": result.stdout[-500:] if result.stdout else "",
                    "stderr": result.stderr[-500:] if result.stderr else "",
                })
            except Exception as e:
                results.append({
                    "action": action, "model": model, "status": "error", "error": str(e)
                })

        ok = all(r["status"] in ("ok", "dry_run") for r in results)
        return {"success": ok, "scene": scene_code, "steps": results}

    def _parse_step(self, raw: str) -> dict:
        """解析步骤字符串: 'run: +dwd_order_+' → {action: run, model: +dwd_order_+}"""
        if ":" in raw:
            action, model = raw.split(":", 1)
            return {"action": action.strip(), "model": model.strip()}
        return {"action": "run", "model": raw.strip()}

    def _build_dbt_cmd(self, action: str, model: str, target: str) -> list[str]:
        """构建 dbt 命令"""
        dbt = str(PLATFORM_ROOT / ".venv" / "Scripts" / "dbt.exe")
        cmd = [dbt, action, "--target", target]
        if model:
            cmd.extend(["--select", model])
        return cmd

    def _build_agent_plan(self, agent, domain: Optional[str], target: str) -> list[dict]:
        """根据 Agent 定义构建执行计划"""
        plan = []
        for dbt_action in agent.tools.get("dbt", []):
            if dbt_action == "run":
                layer = agent.layer_permissions.get("write", ["dwd"])[0]
                sel = f"+{layer}_"
                if domain:
                    sel += f"{domain}_"
                sel += "+"
                plan.append({"action": "run", "model": sel})
            elif dbt_action == "test":
                layer = agent.layer_permissions.get("write", ["dwd"])[0]
                sel = f"+{layer}_"
                if domain:
                    sel += f"{domain}_"
                sel += "+"
                plan.append({"action": "test", "model": sel})
            elif dbt_action == "parse":
                plan.append({"action": "parse", "model": ""})
        return plan

    def print_plan(self, scene_code: str) -> None:
        """打印场景执行计划（不执行）"""
        scene = self.scenarios.get(scene_code)
        if not scene:
            print(f"场景不存在: {scene_code}")
            return

        print(f"\n场景: {scene['name']} ({scene_code})")
        print(f"调度: {scene.get('schedule', '手动')}")
        print(f"步骤:")
        for i, step in enumerate(scene.get("steps", []), 1):
            if isinstance(step, str):
                step = self._parse_step(step)
            print(f"  {i}. [{step.get('action', 'run')}] {step.get('model', '')}")
        print()
