import React, { useState, useCallback, useEffect, useRef } from 'react';
import { pipelineEngine } from '../services/pipelineEngine.js';

const DBT_COMMANDS = [
  { cmd: 'parse', label: 'dbt parse', desc: '验证所有模型编译', color: '#007AFF' },
  { cmd: 'run', label: 'dbt run', desc: '执行模型', color: '#34C759' },
  { cmd: 'test', label: 'dbt test', desc: '数据质量测试', color: '#FF9500' },
  { cmd: 'docs generate', label: 'dbt docs', desc: '生成文档血缘', color: '#AF52DE' },
  { cmd: 'compile', label: 'dbt compile', desc: '编译 SQL', color: '#5AC8FA' },
];

const TARGETS = ['dev', 'hive', 'oceanbase_ads'];

export default function PipelinePanel() {
  const [pipelineState, setPipelineState] = useState(pipelineEngine.getState());
  const [activeTab, setActiveTab] = useState('dbt');
  const [selectedTarget, setSelectedTarget] = useState('dev');
  const [modelSelect, setModelSelect] = useState('');
  const [dbtOutput, setDbtOutput] = useState([]);
  const [dbtRunning, setDbtRunning] = useState(false);
  const logEndRef = useRef(null);
  const api = window.electronAPI;

  useEffect(() => {
    const unsub = pipelineEngine.subscribe(setPipelineState);
    return unsub;
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [dbtOutput]);

  // Listen for dbt output from Electron
  useEffect(() => {
    if (!api) return;
    const unsub = api.onDbtOutput?.((data) => {
      setDbtOutput(prev => [...prev.slice(-300), `[${data.stream}] ${data.text}`]);
    });
    return () => unsub?.();
  }, [api]);

  const handleDbtCmd = useCallback(async (command) => {
    if (!api) {
      setDbtOutput(prev => [...prev, '[SYSTEM] Electron API 不可用（需在桌面应用中运行）', `[提示] 请在终端中执行: .venv/Scripts/dbt ${command} --target ${selectedTarget}`]);
      return;
    }
    setDbtRunning(true);
    setDbtOutput(prev => [...prev, `[→] dbt ${command} --target ${selectedTarget} ${modelSelect ? `--select ${modelSelect}` : ''}`]);
    const result = await api.executeDbt(command, selectedTarget, modelSelect || null);
    setDbtOutput(prev => [...prev, `[RESULT] 退出码: ${result.exitCode} · ${result.success ? '成功' : '失败'}`]);
    if (result.stderr) setDbtOutput(prev => [...prev, `[stderr] ${result.stderr}`]);
    setDbtRunning(false);
  }, [api, selectedTarget, modelSelect]);

  const handlePipelineStart = async () => {
    pipelineEngine.resetPipeline();
    await pipelineEngine.triggerPipeline();
  };

  const handlePipelineStop = () => {
    pipelineEngine.stopPipeline();
  };

  const handlePipelineReset = () => {
    pipelineEngine.resetPipeline();
  };

  const completedCount = Object.values(pipelineState.agentsStatus).filter(s => s === 'completed').length;

  return (
    <div className="pipeline-layout">
      <div className="pipeline-header">
        <h1 className="page-title">流水线执行</h1>
        <div className="pipeline-tabs">
          <button className={`pipeline-tab ${activeTab === 'dbt' ? 'active' : ''}`} onClick={() => setActiveTab('dbt')}>
            dbt 命令
          </button>
          <button className={`pipeline-tab ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
            Agent 管道
          </button>
        </div>
      </div>

      {/* dbt Commands Tab */}
      {activeTab === 'dbt' && (
        <>
          <div className="section-label">dbt 命令执行</div>

          {/* Command Buttons */}
          <div className="dbt-cmd-row">
            {DBT_COMMANDS.map(dbt => (
              <button
                key={dbt.cmd}
                className="btn primary"
                style={{ background: dbt.color, borderColor: dbt.color }}
                onClick={() => handleDbtCmd(dbt.cmd)}
                disabled={dbtRunning}
                title={dbt.desc}
              >
                {dbt.label}
              </button>
            ))}
            {dbtRunning && <button className="btn danger" onClick={() => api?.stopDbt()}>停止</button>}
          </div>

          {/* Target Selector + Model Select */}
          <div className="dbt-cmd-row">
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Target:</span>
            <select className="dbt-target-select" value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)}>
              {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>Model:</span>
            <input
              className="dbt-model-input"
              placeholder="--select model_name"
              value={modelSelect}
              onChange={e => setModelSelect(e.target.value)}
            />
          </div>

          {/* Output Terminal */}
          <div className="output-section">
            <div className="section-label">
              执行输出
              <button className="btn-mini" onClick={() => setDbtOutput([])}>清空</button>
            </div>
            <div className="terminal-output">
              {dbtOutput.length === 0 ? (
                <div className="output-placeholder">点击上方 dbt 命令按钮开始执行...<br />本地 DuckDB (dev) 秒级验证 · Hive (hive) 生产执行</div>
              ) : (
                dbtOutput.map((line, i) => <div key={i}>{line}</div>)
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </>
      )}

      {/* Agent Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <>
          <div className="section-label">Agent 管道执行</div>

          {/* Pipeline Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
              <span>进度: {completedCount}/8</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{pipelineState.status === 'running' ? '执行中...' : pipelineState.status === 'completed' ? '全部完成 ✓' : '就绪'}</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${(completedCount / 8) * 100}%` }} />
            </div>
          </div>

          <div className="section-label">Agent 状态</div>
          <div className="agent-pipeline-bar">
            {pipelineState.agents.map(a => (
              <div
                key={a.id}
                className={`agent-pipeline-step ${a.status === 'completed' ? 'done' : a.status === 'running' ? 'doing' : ''}`}
                title={`${a.name} — ${a.status}`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-tertiary)' }}>
            {pipelineState.agents.map(a => <span key={a.id}>A{a.order}</span>)}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn primary" onClick={handlePipelineStart} disabled={pipelineState.status === 'running'}>
              执行全部管道
            </button>
            <button className="btn danger" onClick={handlePipelineStop} disabled={pipelineState.status !== 'running'}>
              停止
            </button>
            <button className="btn" onClick={handlePipelineReset}>重置</button>
          </div>

          {/* State Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>名称</th>
                  <th>状态</th>
                  <th>依赖</th>
                </tr>
              </thead>
              <tbody>
                {pipelineState.agents.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: "'SF Mono','Consolas',monospace", fontWeight: 600 }}>{a.id}</td>
                    <td>{a.name}</td>
                    <td>
                      <span className={`agent-status-tag ${a.status === 'completed' ? 'completed' : a.status === 'running' ? 'running' : a.status === 'failed' ? 'failed' : 'pending'}`}>
                        {{ idle: '待执行', running: '执行中', completed: '已完成', failed: '失败', pending: '待执行' }[a.status] || a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {a.dependencies?.length > 0 ? a.dependencies.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
