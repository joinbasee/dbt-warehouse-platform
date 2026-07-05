import React, { useState, useCallback } from 'react';
import { AGENTS } from '../data/agents.js';

function AgentCard({ agent, isSelected, onClick, isReady }) {
  const statusClass = agent.status === 'completed' ? 'completed'
    : agent.status === 'running' ? 'in-progress'
    : agent.status === 'failed' ? 'failed'
    : 'pending';

  return (
    <div className={`agent-card ${isSelected ? 'selected' : ''}`} onClick={() => onClick(agent)} style={{ opacity: isReady ? 1 : 0.6 }}>
      <div className="agent-card-header">
        <div className="agent-icon" style={{ background: agent.color }}>{agent.icon}</div>
        <div>
          <div className="agent-name">{agent.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{agent.nameEn}</div>
        </div>
        <span className={`agent-status-tag ${statusClass}`}>
          {agent.status === 'completed' ? '已完成' : agent.status === 'running' ? '执行中' : agent.status === 'failed' ? '失败' : '待执行'}
        </span>
      </div>
      <div className="agent-desc">{agent.description}</div>
      <div className="agent-tags">
        {agent.llmCapabilities.slice(0, 3).map((c, i) => <span key={i} className="agent-tag">{c}</span>)}
        {agent.mcpTools.slice(0, 2).map((t, i) => <span key={i} className="agent-tag mcp">{t}</span>)}
      </div>
    </div>
  );
}

function AgentDetail({ agent, onClose }) {
  if (!agent) return null;
  return (
    <div className="agent-detail-panel">
      <div className="agent-detail-header">
        <div className="agent-icon" style={{ background: agent.color, width: 36, height: 36 }}>{agent.icon}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{agent.nameEn} · Order {agent.order} · {agent.dependencies.length > 0 ? `依赖: ${agent.dependencies.join(', ')}` : '无依赖（全局Agent）'}</div>
        </div>
        <button className="btn-mini" onClick={onClose} style={{ marginLeft: 'auto' }}>关闭</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="agent-detail-section">
          <div className="agent-detail-title">LLM 能力</div>
          <div className="agent-detail-text">
            {agent.llmCapabilities.map((c, i) => <div key={i}>· {c}</div>)}
          </div>
        </div>
        <div className="agent-detail-section">
          <div className="agent-detail-title">MCP 工具调用</div>
          <div className="agent-detail-text">
            {agent.mcpTools.map((t, i) => <div key={i}>· {t}</div>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
        <div className="agent-detail-section">
          <div className="agent-detail-title">输入契约</div>
          <div className="agent-detail-text">{agent.inputContract}</div>
        </div>
        <div className="agent-detail-section">
          <div className="agent-detail-title">输出契约</div>
          <div className="agent-detail-text">{agent.outputContract}</div>
        </div>
      </div>

      <div className="agent-detail-section">
        <div className="agent-detail-title">产出物（{agent.filesProduced?.length || 0} 个文件）</div>
        <div className="agent-detail-text" style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 10 }}>
          {agent.filesProduced?.map((f, i) => <div key={i}>{f}</div>)}
        </div>
      </div>

      {agent.subAgents && (
        <div className="agent-detail-section">
          <div className="agent-detail-title">5 个子 Agent</div>
          <div className="agent-detail-text">
            {agent.subAgents.map((sa, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <strong>{sa.id}</strong> — {sa.name}
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{sa.output}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentsPanel() {
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Group agents by DAG rows for visual layout
  const dagRows = [
    { agents: ['agent-0'], arrows: [] },
    { agents: ['agent-1'], arrows: ['↓'] },
    { agents: ['agent-2'], arrows: ['↓'] },
    { agents: ['agent-3'], arrows: ['↓'] },
    { agents: ['agent-4', 'agent-5'], arrows: ['↙', '↘'] },
    { agents: ['agent-6'], arrows: ['↓'] },
    { agents: ['agent-7'], arrows: ['↓'] },
  ];

  const completedCount = AGENTS.filter(a => a.status === 'completed').length;

  return (
    <div className="agents-layout">
      <div className="agents-header">
        <div>
          <h1 className="page-title">Agent 集群</h1>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            8 Agent 协作 · 依赖 DAG 拓扑 · {completedCount}/8 已完成
          </span>
        </div>
        <div className="agents-btn-row">
          <button className="btn primary">触发全管道</button>
        </div>
      </div>

      {/* Agent Pipeline Progress */}
      <div>
        <div className="section-label">管道进度</div>
        <div className="agent-pipeline-bar">
          {AGENTS.map(a => (
            <div
              key={a.id}
              className={`agent-pipeline-step ${a.status === 'completed' ? 'done' : a.status === 'running' ? 'doing' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Agent DAG */}
      <div className="agent-dag">
        {dagRows.map((row, ri) => (
          <div key={ri}>
            {ri > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 40px' }}>
                {row.agents.length === 1
                  ? <span className="agent-dag-arrow">│</span>
                  : row.agents.map((_, i) => <span key={i} className="agent-dag-arrow">{i === 0 ? '┌' : '┐'}</span>)
                }
              </div>
            )}
            <div className="agent-dag-row">
              {row.agents.map((agentId) => {
                const agent = AGENTS.find(a => a.id === agentId);
                if (!agent) return null;
                const isReady = agent.dependencies.every(depId =>
                  AGENTS.find(a => a.id === depId)?.status === 'completed'
                );
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onClick={setSelectedAgent}
                    isReady={isReady}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <AgentDetail agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
}
