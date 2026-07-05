# -*- coding: utf-8 -*-
"""
Agent 定义加载器

从 .claude/agents/*.md 文件中解析 YAML frontmatter + Markdown body，
构建结构化的 AgentDef 对象。

用法:
    from dbt_platform.engine.orchestrator.agent_loader import AgentLoader
    loader = AgentLoader()
    agents = loader.load_all()
    agent = loader.load("agent-03")
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml

from dbt_platform.engine.utils.project import get_platform_root

PLATFORM_ROOT = get_platform_root()

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)", re.DOTALL)


@dataclass
class AgentDef:
    """Agent 定义数据类"""
    id: str
    name: str
    name_en: str = ""
    order: int = 0
    status: str = "pending"          # pending | in_progress | completed | failed
    dependencies: list[str] = field(default_factory=list)
    icon: str = ""
    color: str = ""

    # 职责边界
    layer_permissions: dict = field(default_factory=lambda: {"read": [], "write": []})
    domain_scope: list[str] = field(default_factory=list)

    # 工具白名单
    tools: dict = field(default_factory=lambda: {"dbt": [], "scripts": [], "mcp": []})

    # 输入输出合同
    input_contract: str = ""
    output_contract: str = ""

    # 规则
    forbidden: list[str] = field(default_factory=list)
    acceptance: list[str] = field(default_factory=list)

    # prompt 正文（frontmatter 之后的 Markdown）
    prompt: str = ""

    # 文件路径
    source_file: str = ""

    def to_dict(self) -> dict:
        """转为字典（供 CLI / API 输出）"""
        return {
            "id": self.id,
            "name": self.name,
            "name_en": self.name_en,
            "order": self.order,
            "status": self.status,
            "dependencies": self.dependencies,
            "icon": self.icon,
            "color": self.color,
            "layer_permissions": self.layer_permissions,
            "domain_scope": self.domain_scope,
            "tools": self.tools,
            "input_contract": self.input_contract,
            "output_contract": self.output_contract,
            "forbidden": self.forbidden,
            "acceptance": self.acceptance,
        }

    def can_read(self, layer: str) -> bool:
        """检查是否可读指定层"""
        perms = self.layer_permissions.get("read", [])
        return "*" in perms or layer in perms

    def can_write(self, layer: str) -> bool:
        """检查是否可写指定层"""
        perms = self.layer_permissions.get("write", [])
        return "*" in perms or layer in perms

    def can_access_domain(self, domain: str) -> bool:
        """检查是否可访问指定域"""
        return "*" in self.domain_scope or domain in self.domain_scope


class AgentLoader:
    """从 .claude/agents/ 加载 Agent 定义"""

    def __init__(self, agents_dir: Optional[Path] = None):
        self.agents_dir = agents_dir or (PLATFORM_ROOT / ".claude" / "agents")
        self._cache: dict[str, AgentDef] = {}

    def load_all(self) -> dict[str, AgentDef]:
        """加载所有 Agent 定义"""
        if self._cache:
            return self._cache

        if not self.agents_dir.exists():
            return {}

        for md_file in sorted(self.agents_dir.glob("agent-*.md")):
            try:
                agent = self._parse_file(md_file)
                if agent:
                    self._cache[agent.id] = agent
            except Exception as e:
                print(f"[WARN] 解析 Agent 文件失败: {md_file} — {e}")

        return self._cache

    def load(self, agent_id: str) -> Optional[AgentDef]:
        """加载单个 Agent 定义"""
        all_agents = self.load_all()
        return all_agents.get(agent_id)

    def list_all(self) -> list[dict]:
        """列出所有 Agent（摘要信息）"""
        all_agents = self.load_all()
        result = []
        for agent in sorted(all_agents.values(), key=lambda a: a.order):
            result.append({
                "id": agent.id,
                "name": agent.name,
                "order": agent.order,
                "status": agent.status,
                "dependencies": agent.dependencies,
            })
        return result

    def topological_order(self) -> list[AgentDef]:
        """按依赖 DAG 拓扑排序"""
        all_agents = self.load_all()
        if not all_agents:
            return []

        visited = set()
        temp_mark = set()
        result = []

        def visit(agent_id: str):
            if agent_id in temp_mark:
                raise ValueError(f"Agent 依赖循环: {agent_id}")
            if agent_id in visited:
                return
            temp_mark.add(agent_id)
            agent = all_agents.get(agent_id)
            if agent:
                for dep in agent.dependencies:
                    if dep in all_agents:
                        visit(dep)
            temp_mark.discard(agent_id)
            visited.add(agent_id)
            if agent:
                result.append(agent)

        for aid in sorted(all_agents.keys(), key=lambda k: all_agents[k].order):
            if aid not in visited:
                visit(aid)

        return result

    def next_available(self) -> list[AgentDef]:
        """返回所有依赖已满足且状态为 pending 的 Agent"""
        all_agents = self.load_all()
        available = []
        for agent in all_agents.values():
            if agent.status != "pending":
                continue
            deps_met = all(
                dep not in all_agents or all_agents[dep].status == "completed"
                for dep in agent.dependencies
            )
            if deps_met:
                available.append(agent)
        return sorted(available, key=lambda a: a.order)

    def _parse_file(self, file_path: Path) -> Optional[AgentDef]:
        """解析单个 .md 文件"""
        content = file_path.read_text(encoding="utf-8")
        match = FRONTMATTER_RE.match(content)
        if not match:
            return None

        frontmatter_str = match.group(1)
        body = match.group(2).strip()

        meta = yaml.safe_load(frontmatter_str)
        if not meta:
            return None

        return AgentDef(
            id=meta.get("id", file_path.stem),
            name=meta.get("name", ""),
            name_en=meta.get("name_en", ""),
            order=meta.get("order", 0),
            status=meta.get("status", "pending"),
            dependencies=meta.get("dependencies", []),
            icon=meta.get("icon", ""),
            color=meta.get("color", ""),
            layer_permissions=meta.get("layer_permissions", {"read": [], "write": []}),
            domain_scope=meta.get("domain_scope", []),
            tools=meta.get("tools", {"dbt": [], "scripts": [], "mcp": []}),
            input_contract=meta.get("input_contract", ""),
            output_contract=meta.get("output_contract", ""),
            forbidden=meta.get("forbidden", []),
            acceptance=meta.get("acceptance", []),
            prompt=body,
            source_file=str(file_path.relative_to(PLATFORM_ROOT)),
        )
