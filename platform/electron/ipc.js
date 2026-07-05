/**
 * IPC 路由器 — 多项目架构支持
 *
 * 注册所有 ipcMain.handle 处理器。
 * 本文件只做路由——将 IPC 通道映射到对应模块的函数，不包含任何业务逻辑。
 *
 * @param {object} ctx — 模块上下文
 * @param {object} ctx.state — 共享状态容器
 * @param {object} ctx.configManager — 配置管理器
 * @param {object} ctx.scanner — 项目扫描器模块
 * @param {object} ctx.lineage — 血缘计算模块
 * @param {object} ctx.documents — 文档扫描模块
 * @param {object} ctx.claude — Claude 进程管理器
 * @param {object} ctx.dbt — dbt 执行器
 * @param {object} ctx.systemInfo — 系统信息模块
 * @param {object} ctx.paths — 路径常量
 * @param {object} ctx.projectManager — 项目管理模块
 */

const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function setupIPC(ctx) {
  const {
    state,
    configManager,
    scanner,
    lineage,
    documents,
    claude,
    dbt,
    systemInfo,
    projectManager,
    paths: P,
  } = ctx;

  // ── 项目扫描（基于活跃项目） ──
  ipcMain.handle('scan-project', () => {
    const result = scanner.scanProject(P.PROJECT_ROOT);
    state.projectCache = result;
    return result;
  });

  ipcMain.handle('get-project-cache', () => {
    return state.projectCache || scanner.scanProject(P.PROJECT_ROOT);
  });

  // ── 项目管理（多项目支持） ──
  ipcMain.handle('projects:list', () => {
    return projectManager.listProjects();
  });

  ipcMain.handle('project:switch', async (_, projectName) => {
    try {
      const result = projectManager.switchProject(projectName);
      return { success: true, ...result };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  ipcMain.handle('project:current', () => {
    return {
      name: projectManager.getActiveProject(),
      platformRoot: P.PLATFORM_ROOT,
      projectRoot: P.PROJECT_ROOT,
    };
  });

  // ── Claude Code 管理 ──
  ipcMain.handle('launch-claude', async () => claude.launch());
  ipcMain.handle('stop-claude', async () => claude.stop());
  ipcMain.handle('send-claude-command', async (_, text) => claude.sendCommand(text));
  ipcMain.handle('get-claude-status', () => claude.getStatus());

  // ── dbt 命令执行 ──
  ipcMain.handle('execute-dbt', async (_, command, target, modelSelect) =>
    dbt.execute(command, target, modelSelect));
  ipcMain.handle('stop-dbt', () => { dbt.stop(); });

  // ── 系统信息 ──
  ipcMain.handle('get-system-info', () => systemInfo.getSystemInfo());

  // 通用命令执行（用于 MonitorPanel）
  ipcMain.handle('execute-command', async (_, cmd) => {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 30000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        resolve({ success: !err, stdout: stdout || '', stderr: stderr || '', error: err ? err.message : null });
      });
    });
  });

  // ── 配置管理 ──
  ipcMain.handle('get-config', () => configManager.config);
  ipcMain.handle('update-config', (_, updates) => configManager.update(updates));

  // ── 文件操作（基于项目根） ──
  ipcMain.handle('read-file', async (_, filePath) => {
    const fullPath = path.join(P.PROJECT_ROOT, filePath);
    try {
      return { success: true, content: fs.readFileSync(fullPath, 'utf-8') };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  ipcMain.handle('load-model-content', async (_, modelPath) => {
    const fullPath = path.join(P.PROJECT_ROOT, modelPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return { success: true, content, size: content.split('\n').length };
    } catch (e) {
      return { success: false, message: e.message };
    }
  });

  // ── 文档扫描（基于项目根） ──
  ipcMain.handle('scan-documents', async () => {
    return documents.scanDocuments(P.PROJECT_ROOT);
  });

  // ── 血缘计算（基于项目根） ──
  ipcMain.handle('compute-lineage', async () => {
    return lineage.computeLineage(P.PROJECT_ROOT);
  });

  // ── UI 辅助 ──
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(state.mainWindow, { properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('open-external', async (_, url) => {
    await shell.openExternal(url);
  });
}

module.exports = { setupIPC };
