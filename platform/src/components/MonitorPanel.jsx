import React, { useState, useEffect, useCallback } from 'react';
import { pipelineEngine } from '../services/pipelineEngine.js';
import { getProjectData } from '../services/projectScanner.js';
import { AGENTS } from '../data/agents.js';

export default function MonitorPanel() {
  const [pipelineState, setPipelineState] = useState(pipelineEngine.getState());
  const [systemInfo, setSystemInfo] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const api = window.electronAPI;

  const refreshAll = useCallback(async () => {
    if (api) {
      const sys = await api.getSystemInfo();
      setSystemInfo(sys);
    }
    const proj = await getProjectData();
    setProjectData(proj);
  }, [api]);

  useEffect(() => {
    const unsub = pipelineEngine.subscribe(setPipelineState);
    return unsub;
  }, []);

  useEffect(() => {
    refreshAll();
    if (!autoRefresh) return;
    const timer = setInterval(refreshAll, 5000);
    return () => clearInterval(timer);
  }, [refreshAll, autoRefresh]);

  const filteredLogs = pipelineState.logs.filter(l => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'agent') return l.agentId !== 'system';
    if (activeFilter === 'system') return l.agentId === 'system';
    if (activeFilter === 'error') return l.level === 'ERROR' || l.level === 'WARN';
    return true;
  });

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('zh-CN'); } catch { return ts; }
  };

  const completedAgents = AGENTS.filter(a => a.status === 'completed').length;
  const stats = projectData?.stats || {};

  return (
    <div className="monitor-layout">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="page-title">运行监控</h1>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {pipelineState.logs.length} 条日志 · {completedAgents}/8 Agent 完成
          </span>
        </div>
        {/* System Info */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {systemInfo && (
            <div className="sys-info-chips">
              <span className="sys-chip" style={{ color: systemInfo.avgCpuUsage > 80 ? 'var(--red)' : 'var(--text-secondary)' }}>
                CPU {systemInfo.avgCpuUsage}%
              </span>
              <span className="sys-chip" style={{ color: systemInfo.usedMemPercent > 80 ? 'var(--red)' : 'var(--text-secondary)' }}>
                MEM {systemInfo.usedMemPercent}%
              </span>
              <span className="sys-chip">{systemInfo.hostname}</span>
              <span className="sys-chip">{systemInfo.cpus} 核</span>
            </div>
          )}
          <button className="btn-mini" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? '暂停刷新' : '开始刷新'}
          </button>
          <button className="btn-mini" onClick={refreshAll}>刷新</button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {[
          { label: 'DWD模型', value: stats.modelCount || 71, unit: '个', color: '#007AFF' },
          { label: '宏函数', value: stats.macroCount || 8, unit: '个', color: '#34C759' },
          { label: 'ODS源表', value: stats.sourceCount || 74, unit: '张', color: '#FF9500' },
          { label: '业务域', value: stats.domainCount || 6, unit: '个', color: '#AF52DE' },
          { label: 'Agent完成', value: `${completedAgents}/8`, unit: '', color: '#FF3B30' },
          { label: '管道状态', value: pipelineState.runId ? '运行中' : '就绪', unit: '', color: pipelineState.runId ? '#34C759' : '#8E8E93' },
        ].map((kpi, i) => (
          <div key={i} className="stat-mini" style={{ padding: '10px 14px' }}>
            <div className="stat-mini-value" style={{ fontSize: 20, color: kpi.color }}>{kpi.value}<span className="stat-mini-unit">{kpi.unit}</span></div>
            <div className="stat-mini-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* System Info Detail */}
      {systemInfo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'CPU 型号', value: systemInfo.cpuModel?.split('CPU')[0]?.trim() || '—' },
            { label: '总内存', value: `${systemInfo.totalMem} MB` },
            { label: '可用内存', value: `${systemInfo.freeMem} MB` },
            { label: '运行时间', value: `${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m` },
          ].map((s, i) => (
            <div key={i} className="stat-mini" style={{ padding: '10px 14px' }}>
              <div className="stat-mini-value" style={{ fontSize: 14 }}>{s.value}</div>
              <div className="stat-mini-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agent Status Table */}
      <div className="section-label">Agent 运行状态</div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Agent</th><th>名称</th><th>状态</th><th>依赖</th><th>输出文件数</th></tr>
          </thead>
          <tbody>
            {AGENTS.map(a => {
              const st = a.status;
              return (
                <tr key={a.id}>
                  <td style={{ fontFamily: "'SF Mono','Consolas',monospace", fontWeight: 600, fontSize: 11 }}>{a.id}</td>
                  <td>{a.name}</td>
                  <td>
                    <span className={`agent-status-tag ${st === 'completed' ? 'completed' : st === 'running' ? 'running' : st === 'failed' ? 'failed' : 'pending'}`}>
                      {{ idle: '待执行', running: '执行中', completed: '已完成', failed: '失败', pending: '待执行' }[st] || st}
                    </span>
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{a.dependencies?.length > 0 ? a.dependencies.join(', ') : '—'}</td>
                  <td style={{ fontWeight: 600 }}>{a.filesProduced?.length || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Log Filters */}
      <div className="monitor-filters">
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginRight: 8 }}>过滤:</span>
        {[
          { key: 'all', label: '全部' },
          { key: 'agent', label: 'Agent' },
          { key: 'system', label: 'System' },
          { key: 'error', label: '警告/错误' },
        ].map(f => (
          <button key={f.key} className={`filter-chip ${activeFilter === f.key ? 'active' : ''}`} onClick={() => setActiveFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          {filteredLogs.length} 条
        </span>
        <button className="btn-mini" onClick={() => pipelineEngine.resetPipeline()}>清空日志</button>
      </div>

      {/* Run info */}
      {pipelineState.runId && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'SF Mono','Consolas',monospace" }}>
          Run: {pipelineState.runId}
          {pipelineState.currentAgent && <span> · Current: <strong>{pipelineState.currentAgent}</strong></span>}
          <span> · Status: <strong>{pipelineState.status}</strong></span>
        </div>
      )}

      {/* Log Viewer */}
      <div className="monitor-log">
        {filteredLogs.length === 0 ? (
          <div style={{ color: '#5A5A6E', padding: 30, textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>暂无日志</div>
            <div style={{ fontSize: 11 }}>进入"流水线执行"→"Agent 管道"触发管道，或手动执行 dbt 命令</div>
          </div>
        ) : (
          filteredLogs.map((entry, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">{formatTime(entry.timestamp)}</span>
              <span className={`log-level ${entry.level}`}>{entry.level}</span>
              <span className="log-agent">[{entry.agentId}]</span>
              <span className="log-msg">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
