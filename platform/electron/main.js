/**
 * 智能数仓建设平台 — Electron 主进程入口
 *
 * 职责：
 *   1. 初始化各模块（config / claude / dbt / scanner / ...）
 *   2. 注册 IPC 路由
 *   3. 创建窗口
 *   4. 应用生命周期管理
 *
 * 所有业务逻辑已拆分到 modules/ 和 shared/ 中。
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

// ── 导入模块 ──
const { createState } = require('./shared/state');
const paths = require('./shared/paths');
const { createConfigManager } = require('./modules/config');
const { scanProject } = require('./modules/scanner');
const { computeLineage } = require('./modules/lineage');
const { scanDocuments } = require('./modules/documents');
const { createClaudeManager } = require('./modules/claude');
const { createDbtExecutor } = require('./modules/dbt');
const { getSystemInfo } = require('./modules/system');
const { setupIPC } = require('./ipc');
const { listProjects, switchProject, getActiveProject } = require('./modules/project-manager');

// ── 初始化状态 ──
const state = createState();
const configManager = createConfigManager(app.getPath('userData'));

// ── 初始化模块 ──
const claudeManager = createClaudeManager({
  workDir: paths.PROJECT_ROOT,
  envVars: configManager.config.envVars || {},
  state,
  onOutput: (stream, text, timestamp) => {
    if (state.mainWindow) {
      state.mainWindow.webContents.send('claude-output', { stream, text, timestamp });
    }
  },
  onStatusChange: (status) => {
    if (state.mainWindow) {
      state.mainWindow.webContents.send('claude-status', status);
    }
  },
});

const dbtExecutor = createDbtExecutor({
  dbtExe: paths.DBT_EXE,
  venvPython: paths.DBT_VENV_PYTHON,
  workDir: paths.PROJECT_ROOT,
  state,
  onOutput: (stream, text) => {
    if (state.mainWindow) {
      state.mainWindow.webContents.send('dbt-output', { stream, text });
    }
  },
});

// ── 窗口管理 ──
function createWindow() {
  state.mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 750,
    title: '智能数仓建设平台 — dbt Agent Platform',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    state.mainWindow.loadURL('http://localhost:5174');
  } else {
    state.mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ── 组装上下文并注册 IPC ──
const ipcContext = {
  state,
  configManager,
  scanner: { scanProject: () => scanProject(paths.PROJECT_ROOT) },
  lineage: { computeLineage: () => computeLineage(paths.PROJECT_ROOT) },
  documents: { scanDocuments: () => scanDocuments(paths.PROJECT_ROOT) },
  projectManager: {
    listProjects: () => listProjects(paths.PLATFORM_ROOT),
    switchProject: (name) => {
      const result = switchProject(paths.PLATFORM_ROOT, name);
      // 重新扫描项目
      state.projectCache = scanProject(result.root);
      if (state.mainWindow) {
        state.mainWindow.webContents.send('project-switched', result);
      }
      return result;
    },
    getActiveProject: () => getActiveProject(paths.PLATFORM_ROOT),
  },
  claude: claudeManager,
  dbt: dbtExecutor,
  systemInfo: { getSystemInfo },
  paths,
};

// ── 应用生命周期 ──
app.whenReady().then(() => {
  setupIPC(ipcContext);
  state.projectCache = scanProject(paths.PROJECT_ROOT);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    claudeManager.stop();
    dbtExecutor.stop();
    app.quit();
  }
});

app.on('before-quit', () => {
  claudeManager.stop();
  dbtExecutor.stop();
});
