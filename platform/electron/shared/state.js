/**
 * 进程状态管理 — 封装全局可变状态
 *
 * 替代 main.js 中的全局变量：
 *   mainWindow, claudeProcess, claudeSessionLog, dbtProcess, projectCache
 *
 * 每个模块通过参数获取需要的状态，而非闭包引用。
 */

/**
 * 创建状态容器
 * @returns {{ mainWindow, projectCache, claude, dbt }}
 */
function createState() {
  return {
    /** @type {import('electron').BrowserWindow|null} */
    mainWindow: null,

    /** @type {object|null} 扫描结果缓存 */
    projectCache: null,

    /** Claude Code 子进程状态 */
    claude: {
      /** @type {import('child_process').ChildProcess|null} */
      process: null,
      /** @type {string[]} 会话日志环形缓冲区 */
      sessionLog: [],
      /** 日志上限 */
      maxLogLines: 1000,
    },

    /** dbt 子进程状态 */
    dbt: {
      /** @type {import('child_process').ChildProcess|null} */
      process: null,
    },
  };
}

module.exports = { createState };
