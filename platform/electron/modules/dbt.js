/**
 * 模块6: dbt 命令执行器
 *
 * 封装 dbt CLI 子进程的完整生命周期。
 * 通过工厂函数创建实例，内部封装状态。
 */

const path = require('path');
const { spawn } = require('child_process');

/**
 * 创建 dbt 执行器
 * @param {object} options
 * @param {string} options.dbtExe — dbt.exe 路径
 * @param {string} options.venvPython — .venv Python 路径
 * @param {string} options.workDir — 工作目录
 * @param {object} [options.state] — 共享状态容器 { dbt: { process } }
 * @param {function} [options.onOutput] — 输出回调 (stream, text)
 */
function createDbtExecutor(options = {}) {
  const {
    dbtExe,
    venvPython,
    workDir,
    state,
    onOutput = null,
  } = options;

  /** 获取 dbt 进程状态 */
  function getDbtState() {
    return state ? state.dbt : null;
  }

  /** 推送输出 */
  function emitOutput(stream, text) {
    if (onOutput) onOutput(stream, text);
  }

  /** 执行 dbt 命令 */
  function execute(command, target, modelSelect) {
    return new Promise((resolve) => {
      const dbtState = getDbtState();
      if (dbtState && dbtState.process) {
        resolve({ success: false, message: '已有 dbt 命令在运行中' });
        return;
      }

      const args = [dbtExe, command];
      if (target) args.push('--target', target);
      if (modelSelect) args.push('--select', modelSelect);

      const proc = spawn(venvPython, args, {
        cwd: workDir,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      if (dbtState) {
        dbtState.process = proc;
      }

      let stdout = '', stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        emitOutput('stdout', text);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        emitOutput('stderr', text);
      });

      proc.on('close', (code) => {
        if (dbtState) dbtState.process = null;
        resolve({ success: code === 0, stdout, stderr, exitCode: code });
      });

      proc.on('error', (err) => {
        if (dbtState) dbtState.process = null;
        resolve({ success: false, stderr: err.message, exitCode: -1 });
      });
    });
  }

  /** 停止 dbt 命令 */
  function stop() {
    const dbtState = getDbtState();
    if (dbtState && dbtState.process) {
      try { dbtState.process.kill('SIGTERM'); } catch (e) { /* ignore */ }
      dbtState.process = null;
    }
  }

  return { execute, stop };
}

module.exports = { createDbtExecutor };
