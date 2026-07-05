# -*- coding: utf-8 -*-
"""
项目路径解析工具 — 多项目支持的核心模块

提供 PROJECT_ROOT 的单真源解析逻辑。
所有 engine/ 模块通过此模块获取项目根目录。

解析优先级（从高到低）：
  1. DBT_PROJECT 环境变量（指向具体项目目录）
  2. DBT_WAREHOUSE 环境变量（平台根，兼容旧版）
  3. PLATFORM_ROOT/.active_project 文件
  4. 回退到 PLATFORM_ROOT（向后兼容——项目即根目录）
"""

import os
from pathlib import Path
from typing import Optional


def get_platform_root() -> Path:
    """平台根目录 — Git 仓库根（开发模式）或包安装目录"""
    # dbt_platform/engine/utils/project.py → utils → engine → dbt_platform → repo root
    return Path(__file__).resolve().parent.parent.parent.parent


def get_data_dir() -> Path:
    """数据文件目录（templates/ agents/）— 优先包内，回退文件系统"""
    try:
        from importlib import resources
        # Python 3.12+: 包数据在 dbt_platform/data/
        with resources.as_file(resources.files("dbt_platform.data")) as p:
            return Path(str(p))
    except Exception:
        pass
    # 开发模式回退
    pkg_dir = Path(__file__).resolve().parent.parent  # dbt_platform/
    return pkg_dir / "data"


def resolve_project_root(platform_root: Optional[Path] = None) -> Path:
    """
    解析当前活跃的项目根目录。

    Args:
        platform_root: 平台根目录，默认自动计算

    Returns:
        活跃项目的根目录 Path
    """
    if platform_root is None:
        platform_root = get_platform_root()

    # 1. DBT_PROJECT 环境变量 — 显式指向项目目录
    env_project = os.environ.get("DBT_PROJECT")
    if env_project:
        candidate = Path(env_project)
        if candidate.exists() and (candidate / "project.yml").exists():
            return candidate.resolve()

    # 2. DBT_WAREHOUSE 环境变量（兼容旧版，指向平台根）
    env_warehouse = os.environ.get("DBT_WAREHOUSE")
    if env_warehouse:
        candidate = Path(env_warehouse)
        if candidate.exists():
            # 如果 DBT_WAREHOUSE 下有 project.yml，它本身就是项目
            if (candidate / "project.yml").exists():
                return candidate.resolve()
            # 否则作为平台根，尝试读 .active_project
            platform_root = candidate.resolve()

    # 3. .active_project 文件（位于平台根）
    active_file = platform_root / ".active_project"
    if active_file.exists():
        project_path = active_file.read_text(encoding="utf-8").strip()
        # 支持相对路径（相对于平台根）
        if not os.path.isabs(project_path):
            candidate = platform_root / project_path
        else:
            candidate = Path(project_path)
        if candidate.exists() and (candidate / "project.yml").exists():
            return candidate.resolve()

    # 4. 回退：platform_root 本身就是项目（向后兼容）
    return platform_root.resolve()


def load_project_config(project_root: Optional[Path] = None) -> dict:
    """加载活跃项目的 project.yml"""
    import yaml

    if project_root is None:
        project_root = resolve_project_root()

    config_path = project_root / "project.yml"
    if not config_path.exists():
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def switch_project(platform_root: Optional[Path], project_name: str) -> Path:
    """
    切换活跃项目（更新 .active_project 文件）。

    Args:
        platform_root: 平台根目录
        project_name: 项目名称（projects/ 下的子目录名）

    Returns:
        新项目的根目录 Path
    """
    if platform_root is None:
        platform_root = get_platform_root()

    active_file = platform_root / ".active_project"
    target = platform_root / "projects" / project_name

    if not target.exists():
        raise FileNotFoundError(f"项目不存在: {target}")
    if not (target / "project.yml").exists():
        raise FileNotFoundError(f"项目缺少 project.yml: {target}")

    active_file.write_text(f"projects/{project_name}", encoding="utf-8")
    return target.resolve()


def list_projects(platform_root: Optional[Path] = None) -> list[dict]:
    """列出所有可用项目"""
    import yaml

    if platform_root is None:
        platform_root = get_platform_root()

    projects_dir = platform_root / "projects"
    if not projects_dir.exists():
        return []

    result = []
    for child in sorted(projects_dir.iterdir()):
        if not child.is_dir():
            continue
        config_file = child / "project.yml"
        if not config_file.exists():
            continue

        config = {}
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f) or {}
        except Exception:
            pass

        result.append({
            "name": child.name,
            "path": str(child.resolve()),
            "display_name": config.get("project", {}).get("name", child.name),
            "description": config.get("project", {}).get("description", ""),
            "source_adapter": config.get("source", {}).get("adapter", "unknown"),
        })

    return result


def get_current_project_name(platform_root: Optional[Path] = None) -> str:
    """获取当前活跃项目名称"""
    if platform_root is None:
        platform_root = get_platform_root()

    active_file = platform_root / ".active_project"
    if active_file.exists():
        return active_file.read_text(encoding="utf-8").strip()

    # 回退：检查平台根是否本身就是项目
    if (platform_root / "project.yml").exists():
        return platform_root.name

    return "unknown"
