/**
 * 项目管理模块
 *
 * 封装项目切换、列表、发现等功能。
 * 用于 Electron IPC 处理。
 */

const path = require('path');
const fs = require('fs');

/**
 * 列出所有可用项目（扫描 projects/ 目录）
 * @param {string} platformRoot — 平台根目录
 * @returns {Array<{id, name, description, path}>}
 */
function listProjects(platformRoot) {
  const projectsDir = path.join(platformRoot, 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  const projects = [];
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const projectYml = path.join(projectsDir, entry.name, 'project.yml');
    if (!fs.existsSync(projectYml)) continue;

    let displayName = entry.name;
    let description = '';
    let sourceAdapter = 'unknown';
    try {
      const yaml = require('js-yaml');
      const config = yaml.load(fs.readFileSync(projectYml, 'utf-8'));
      displayName = (config.project && config.project.name) || entry.name;
      description = (config.project && config.project.description) || '';
      sourceAdapter = (config.source && config.source.adapter) || 'unknown';
    } catch (e) {
      // fall back to directory name
    }

    projects.push({
      id: entry.name,
      name: displayName,
      description,
      sourceAdapter,
      path: path.join(projectsDir, entry.name),
    });
  }
  return projects;
}

/**
 * 切换活跃项目
 * @param {string} platformRoot — 平台根目录
 * @param {string} projectName — 项目名称（projects/ 下的子目录名）
 * @returns {{project, root}}
 */
function switchProject(platformRoot, projectName) {
  const activeFile = path.join(platformRoot, '.active_project');
  const projectDir = path.join(platformRoot, 'projects', projectName);

  if (!fs.existsSync(path.join(projectDir, 'project.yml'))) {
    throw new Error(`项目 ${projectName} 不存在或缺少 project.yml`);
  }

  fs.writeFileSync(activeFile, `projects/${projectName}`, 'utf-8');
  return { project: projectName, root: projectDir };
}

/**
 * 获取当前活跃项目名称
 * @param {string} platformRoot — 平台根目录
 * @returns {string|null}
 */
function getActiveProject(platformRoot) {
  const activeFile = path.join(platformRoot, '.active_project');
  if (fs.existsSync(activeFile)) {
    return fs.readFileSync(activeFile, 'utf-8').trim();
  }
  return null;
}

module.exports = { listProjects, switchProject, getActiveProject };
