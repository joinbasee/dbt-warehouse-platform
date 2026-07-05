/**
 * 模块4+5: Claude Code 进程管理 + 上下文注入
 *
 * 封装 Claude Code CLI 子进程的完整生命周期。
 * 通过工厂函数 createClaudeManager 创建实例，内部封装状态。
 */

const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');

// ── 系统提示词（从 project.yml 动态生成） ──

/**
 * 从 project.yml 构建 Claude Code 系统提示词
 * @param {string} projectRoot — 项目根目录
 * @returns {string} 组装好的 SYSTEM_PROMPT
 */
function buildSystemPrompt(projectRoot) {
  const path = require('path');
  const fs = require('fs');
  const yaml = require('yaml');

  let projectName = '数据仓库项目';
  let description = '';
  let layers = [];
  let domains = [];
  let scenarios = [];
  let adapter = 'custom';

  try {
    const configPath = path.join(projectRoot, 'project.yml');
    if (fs.existsSync(configPath)) {
      const config = yaml.parse(fs.readFileSync(configPath, 'utf-8'));
      projectName = config.project?.name || projectName;
      description = config.project?.description || '';
      layers = config.layers || [];
      domains = config.domains || [];
      scenarios = config.scenarios || [];
      adapter = config.source?.adapter || adapter;
    }
  } catch (e) {
    // 降级：使用通用提示词
  }

  const domainList = domains.map(d => `${d.code}(${d.name})`).join(', ') || '待配置';
  const layerList = layers.map(l => `${l.code}(${l.name})`).join(' → ') || 'ODS → DWD → DWS → DIM → ADS';
  const sceneNames = scenarios.map(s => s.name).join(', ') || '待配置';

  return `你是一个数据仓库建设AI助手（多Agent集群架构），当前在「${projectName}」项目中工作。

项目信息：
- 技术栈: dbt-core 1.11.9, DuckDB (本地), Hive (生产), OceanBase (BI输出)
- 源系统适配器: ${adapter}
- 数据分层: ${layerList}
- 业务域: ${domainList}
- 业务场景: ${sceneNames}

8-Agent架构:
Agent 0: 规范制定 → Agent 1: 场景分析 → Agent 2: ODS搭建 → Agent 3: DWD开发 → Agent 4: DWS开发 / Agent 5: DIM设计 → Agent 6: ADS开发 → Agent 7: OceanBase迁移验证

回答时请引用具体的模型名和宏名。如需运行dbt命令，请给出具体命令建议。`;
}

// 默认 SYSTEM_PROMPT（启动时未读到 project.yml 时的回退）
const SYSTEM_PROMPT = buildSystemPrompt(
  require('../shared/paths').DBT_WAREHOUSE
);

/**
 * 查找 Claude CLI 路径
 * @returns {string}
 */
function findClaudePath() {
  const candidate = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'claude.cmd');
  if (fs.existsSync(candidate)) return candidate;
  return candidate; // 回退，让 spawn 报具体错误
}

/**
 * 创建 Claude Code 进程管理器
 * @param {object} options
 * @param {string} options.workDir — 工作目录
 * @param {object} [options.envVars] — 额外环境变量
 * @param {object} [options.state] — 共享状态容器 { claude: { process, sessionLog, maxLogLines } }
 * @param {function} [options.onOutput] — 输出回调 (stream, text, timestamp)
 * @param {function} [options.onStatusChange] — 状态变更回调 (status)
 */
function createClaudeManager(options = {}) {
  const {
    workDir,
    envVars = {},
    state,
    onOutput = null,
    onStatusChange = null,
  } = options;

  const claudePath = findClaudePath();

  /** 获取当前 Claude 子进程状态容器 */
  function getClaudeState() {
    return state ? state.claude : null;
  }

  /** 推送输出事件 */
  function emitOutput(stream, text) {
    const timestamp = new Date().toISOString();
    if (onOutput) onOutput(stream, text, timestamp);
  }

  /** 推送状态事件 */
  function emitStatus(status) {
    if (onStatusChange) onStatusChange(status);
  }

  /** 启动 Claude Code */
  function launch() {
    return new Promise((resolve) => {
      const claudeState = getClaudeState();
      if (claudeState && claudeState.process) {
        resolve({ success: false, message: 'Claude Code 已在运行中', pid: claudeState.process.pid });
        return;
      }

      try {
        const proc = spawn('cmd.exe', ['/c', claudePath], {
          cwd: workDir,
          env: { ...process.env, ...envVars, CLAUDE_TERMINAL_WIDTH: '120' },
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
        });

        const timestamp = new Date().toISOString();
        const log = [`[${timestamp}] Claude Code 启动 (PID: ${proc.pid}, CWD: ${workDir})`];

        if (claudeState) {
          claudeState.process = proc;
          claudeState.sessionLog = log;
        }

        // Inject system context after 2s
        setTimeout(() => {
          if (proc && proc.stdin.writable) {
            proc.stdin.write(SYSTEM_PROMPT + '\n');
            if (claudeState) {
              claudeState.sessionLog.push('[SYSTEM] 注入了项目上下文Prompt');
            }
          }
        }, 2000);

        proc.stdout.on('data', (data) => {
          const text = data.toString();
          if (claudeState) {
            claudeState.sessionLog.push(text);
            if (claudeState.sessionLog.length > claudeState.maxLogLines) claudeState.sessionLog.shift();
          }
          emitOutput('stdout', text);
        });

        proc.stderr.on('data', (data) => {
          const text = data.toString();
          if (claudeState) {
            claudeState.sessionLog.push(`[stderr] ${text}`);
            if (claudeState.sessionLog.length > claudeState.maxLogLines) claudeState.sessionLog.shift();
          }
          emitOutput('stderr', text);
        });

        proc.on('close', (code) => {
          if (claudeState) {
            claudeState.sessionLog.push(`[${new Date().toISOString()}] Claude Code 退出 (code: ${code})`);
            claudeState.process = null;
          }
          emitStatus({ running: false, pid: null, exitCode: code });
        });

        proc.on('error', (err) => {
          if (claudeState) {
            claudeState.sessionLog.push(`[${new Date().toISOString()}] 启动错误: ${err.message}`);
            claudeState.process = null;
          }
          resolve({ success: false, message: `启动失败: ${err.message}` });
        });

        emitStatus({ running: true, pid: proc.pid, workDir });

        resolve({ success: true, pid: proc.pid, workDir });
      } catch (err) {
        resolve({ success: false, message: err.message });
      }
    });
  }

  /** 停止 Claude Code（三步安全关闭） */
  function stop() {
    return new Promise((resolve) => {
      const claudeState = getClaudeState();
      if (!claudeState || !claudeState.process) {
        resolve({ success: false, message: 'Claude Code 未在运行' });
        return;
      }
      const proc = claudeState.process;
      const pid = proc.pid;
      try {
        proc.stdin.write('/exit\n');
        setTimeout(() => {
          if (proc && proc.stdin.writable) {
            try { proc.stdin.write('\x03'); } catch (e) { /* ignore */ }
          }
          setTimeout(() => {
            if (proc) {
              try { proc.kill('SIGTERM'); } catch (e) { /* ignore */ }
            }
            resolve({ success: true, pid });
          }, 1000);
        }, 500);
      } catch (err) {
        resolve({ success: false, message: err.message });
      }
    });
  }

  /** 发送命令到 Claude */
  function sendCommand(text) {
    return new Promise((resolve) => {
      const claudeState = getClaudeState();
      if (!claudeState || !claudeState.process) {
        resolve({ success: false, message: 'Claude Code 未在运行' });
        return;
      }
      try {
        claudeState.process.stdin.write(text + '\n');
        claudeState.sessionLog.push(`[→] ${text}`);
        if (claudeState.sessionLog.length > claudeState.maxLogLines) claudeState.sessionLog.shift();
        resolve({ success: true });
      } catch (err) {
        resolve({ success: false, message: err.message });
      }
    });
  }

  /** 获取当前状态 */
  function getStatus() {
    const claudeState = getClaudeState();
    return {
      running: !!(claudeState && claudeState.process),
      pid: (claudeState && claudeState.process) ? claudeState.process.pid : null,
      log: claudeState ? [...claudeState.sessionLog].slice(-100) : [],
    };
  }

  return { launch, stop, sendCommand, getStatus };
}

module.exports = { createClaudeManager, buildSystemPrompt, SYSTEM_PROMPT };
