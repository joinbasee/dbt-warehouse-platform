import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QUICK_COMMANDS } from '../data/agents.js';

export default function ChatPanel() {
  const [claudeRunning, setClaudeRunning] = useState(false);
  const [claudePid, setClaudePid] = useState(null);
  const [outputLog, setOutputLog] = useState([]);
  const [commandInput, setCommandInput] = useState('');
  const [config, setConfig] = useState({ claudeWorkDir: 'C:\\Users\\诗写\\Desktop\\dbt_warehouse' });
  const [statusMsg, setStatusMsg] = useState('');
  const logEndRef = useRef(null);
  const api = window.electronAPI;

  useEffect(() => {
    if (!api) return;
    api.getConfig().then(setConfig);
    api.getClaudeStatus().then(s => {
      setClaudeRunning(s.running);
      setClaudePid(s.pid);
      if (s.log?.length) setOutputLog(s.log.map(l => `[HISTORY] ${l}`));
    });

    const unsubOut = api.onClaudeOutput?.((data) => {
      setOutputLog(prev => [...prev.slice(-500), `[${data.stream}] ${data.text}`]);
    });
    const unsubStat = api.onClaudeStatusChange?.((data) => {
      setClaudeRunning(data.running);
      setClaudePid(data.pid);
    });

    return () => { unsubOut?.(); unsubStat?.(); };
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [outputLog]);

  const handleLaunch = useCallback(async () => {
    if (!api) {
      setOutputLog(prev => [...prev, '[SYSTEM] Electron API 不可用（浏览器环境无法启动 Claude CLI）']);
      return;
    }
    setStatusMsg('正在启动 Claude Code...');
    const result = await api.launchClaude();
    if (result.success) {
      setClaudeRunning(true);
      setClaudePid(result.pid);
      setOutputLog(prev => [...prev, `[SYSTEM] Claude Code 已启动 (PID: ${result.pid}, CWD: ${result.workDir})`]);
      setStatusMsg('');
    } else {
      setStatusMsg(result.message);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  }, [api]);

  const handleStop = useCallback(async () => {
    if (!api) return;
    setStatusMsg('正在停止...');
    const result = await api.stopClaude();
    if (result.success) {
      setClaudeRunning(false);
      setClaudePid(null);
      setOutputLog(prev => [...prev, '[SYSTEM] Claude Code 已停止']);
      setStatusMsg('');
    } else {
      setStatusMsg(result.message);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  }, [api]);

  const handleSendCommand = useCallback(async () => {
    if (!commandInput.trim() || !api) return;
    const text = commandInput.trim();
    await api.sendClaudeCommand(text);
    setOutputLog(prev => [...prev, `[→] ${text}`]);
    setCommandInput('');
  }, [commandInput, api]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  }, [handleSendCommand]);

  const handleQuickCmd = useCallback(async (cmd) => {
    if (!api || !claudeRunning) return;
    await api.sendClaudeCommand(cmd.prompt);
    setOutputLog(prev => [...prev, `[→快捷指令] ${cmd.label}`]);
  }, [api, claudeRunning]);

  return (
    <div className="chat-layout">
      {/* Header */}
      <div className="chat-header">
        <h1 className="page-title">智能对话</h1>
        <div className={`chat-status-badge ${claudeRunning ? 'running' : 'stopped'}`}>
          <span className="status-pulse" />
          {claudeRunning ? `Claude Code 运行中 · PID ${claudePid}` : 'Claude Code 已停止'}
        </div>
      </div>

      {/* Control Row */}
      <div className="chat-control-row">
        <div className="chat-control-card">
          <div className="control-card-title">会话控制</div>
          <div className="control-actions">
            <button className={`btn-launch ${claudeRunning ? 'disabled' : ''}`} onClick={handleLaunch} disabled={claudeRunning}>
              启动 Claude Code
            </button>
            <button className={`btn-stop ${!claudeRunning ? 'disabled' : ''}`} onClick={handleStop} disabled={!claudeRunning}>
              停止会话
            </button>
          </div>
          {statusMsg && <div className="status-toast">{statusMsg}</div>}
        </div>

        <div className="chat-control-card">
          <div className="control-card-title">工作目录</div>
          <div className="workdir-row">
            <code className="workdir-path">{config.claudeWorkDir || '未设置'}</code>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
            自动注入项目上下文（Agent架构 / 模型 / 宏 / 规范）
          </div>
        </div>
      </div>

      {/* Quick Commands */}
      <div>
        <div className="section-label">快捷指令</div>
        <div className="quick-cmds">
          {QUICK_COMMANDS.map((qc, i) => (
            <button
              key={i}
              className="quick-cmd-chip"
              onClick={() => handleQuickCmd(qc)}
              disabled={!claudeRunning}
              title={qc.prompt}
            >
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          value={commandInput}
          onChange={e => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入发送到 Claude Code 的命令，Enter 发送..."
          disabled={!claudeRunning}
        />
        <button className="btn-send" onClick={handleSendCommand} disabled={!claudeRunning || !commandInput.trim()}>
          发送
        </button>
      </div>

      {/* Output */}
      <div className="output-section">
        <div className="section-label">
          会话输出
          <button className="btn-mini" onClick={() => setOutputLog([])}>清空</button>
        </div>
        <div className="output-log">
          {outputLog.length === 0 ? (
            <div className="output-placeholder">点击"启动 Claude Code"开始对话 — 将自动注入数仓项目上下文</div>
          ) : (
            outputLog.map((line, i) => (
              <div key={i} className={`log-line ${line.startsWith('[→]') ? 'sent' : line.includes('[stderr]') ? 'error' : line.includes('[SYSTEM]') ? 'system' : ''}`}>
                {line}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
