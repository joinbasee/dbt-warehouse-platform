// Pipeline Engine — manages 8-Agent execution state machine
// v2: Real dbt execution via Electron IPC (with mock fallback for dev mode)
import { AGENTS } from '../data/agents.js';

// Agent → dbt action mapping
const AGENT_DBT_ACTIONS = {
  'agent-0': null,           // Standards — manual, no dbt commands
  'agent-1': null,           // Scene analysis — manual
  'agent-2': { action: 'run', models: '+sources+' },  // ODS setup
  'agent-3': { action: 'run', models: '+dwd_+' },      // DWD layer
  'agent-4': { action: 'run', models: '+dws_+' },      // DWS layer
  'agent-5': { action: 'run', models: '+dim_+' },      // DIM layer
  'agent-6': { action: 'run', models: '+ads_+' },      // ADS layer
  'agent-7': { action: 'run', models: 'validate' },     // OB migration
};

// Check if running in Electron
const hasElectronAPI = () => typeof window !== 'undefined' && window.electronAPI;

class PipelineEngine {
  constructor() {
    this.runId = null;
    this.status = 'idle';
    this.currentAgent = null;
    this.agentsStatus = {};
    this.logs = [];
    this.listeners = [];
    this.dbtTarget = 'hive';

    AGENTS.forEach(a => { this.agentsStatus[a.id] = 'idle'; });
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  getState() {
    return {
      runId: this.runId,
      status: this.status,
      currentAgent: this.currentAgent,
      agentsStatus: { ...this.agentsStatus },
      logs: [...this.logs],
      agents: AGENTS.map(a => ({
        ...a,
        status: this.agentsStatus[a.id] || 'idle',
      })),
    };
  }

  addLog(agentId, level, message) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      agentId,
      level,
      message,
    });
    if (this.logs.length > 500) this.logs.shift();
    this.notify();
  }

  canExecute(agentId) {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return false;
    if (this.agentsStatus[agentId] === 'completed') return false;
    if (this.agentsStatus[agentId] === 'running') return false;
    return agent.dependencies.every(depId => this.agentsStatus[depId] === 'completed');
  }

  async triggerAgent(agentId) {
    if (!this.canExecute(agentId)) {
      this.addLog(agentId, 'WARN', `无法触发: 前置依赖未完成或已执行`);
      return false;
    }

    this.agentsStatus[agentId] = 'running';
    this.currentAgent = agentId;
    if (this.status === 'idle') this.status = 'running';
    this.runId = this.runId || `run-${Date.now()}`;

    const agent = AGENTS.find(a => a.id === agentId);
    const task = AGENT_DBT_ACTIONS[agentId];
    const agentName = agent ? agent.name : agentId;

    // Agent 0 and 1 are manual (standards/scene analysis) — skip with note
    if (!task) {
      this.addLog(agentId, 'INFO', `${agentName} — 手动阶段，跳过自动执行`);
      this.agentsStatus[agentId] = 'completed';
      this.notify();
      return true;
    }

    this.addLog(agentId, 'INFO', `${agentName} — 开始执行 dbt ${task.action} ${task.models}`);

    // Real execution via Electron API
    if (hasElectronAPI()) {
      try {
        const result = await window.electronAPI.executeDbt(
          task.action,
          this.dbtTarget,
          task.models
        );
        if (result.success) {
          this.agentsStatus[agentId] = 'completed';
          this.addLog(agentId, 'INFO', `${agentName} — 执行成功`);
        } else {
          this.agentsStatus[agentId] = 'failed';
          this.addLog(agentId, 'ERROR', `${agentName} — 执行失败 (exit=${result.exitCode})`);
        }
      } catch (err) {
        this.agentsStatus[agentId] = 'failed';
        this.addLog(agentId, 'ERROR', `${agentName} — 异常: ${err.message}`);
      }
    } else {
      // Mock fallback for browser dev mode
      this.addLog(agentId, 'WARN', '(无 Electron API，模拟执行)');
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
      this.agentsStatus[agentId] = 'completed';
      this.addLog(agentId, 'INFO', `${agentName} — 模拟完成`);
    }

    this.notify();
    return this.agentsStatus[agentId] === 'completed';
  }

  async triggerPipeline(startFrom = null) {
    this.status = 'running';
    this.runId = `run-${Date.now()}`;
    this.addLog('system', 'INFO', `管道开始执行 (runId: ${this.runId}, target=${this.dbtTarget})`);

    const startOrder = startFrom
      ? AGENTS.findIndex(a => a.id === startFrom)
      : 0;

    for (let i = startOrder; i < AGENTS.length; i++) {
      const agent = AGENTS[i];
      if (this.status !== 'running') break;

      // Wait for dependencies
      for (const depId of agent.dependencies) {
        while (this.agentsStatus[depId] !== 'completed' && this.status === 'running') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (this.status !== 'running') break;
      const ok = await this.triggerAgent(agent.id);
      if (!ok) {
        this.status = 'failed';
        this.addLog('system', 'ERROR', `管道中断于 ${agent.id}`);
        break;
      }
    }

    if (this.status === 'running') {
      this.status = 'completed';
      this.addLog('system', 'INFO', '管道全部执行完成');
    }
    this.notify();
  }

  stopPipeline() {
    this.status = 'idle';
    this.currentAgent = null;
    // Try to stop running dbt process
    if (hasElectronAPI()) {
      window.electronAPI.stopDbt();
    }
    this.addLog('system', 'WARN', '管道已手动停止');
    this.notify();
  }

  resetPipeline() {
    this.runId = null;
    this.status = 'idle';
    this.currentAgent = null;
    this.logs = [];
    AGENTS.forEach(a => { this.agentsStatus[a.id] = 'idle'; });
    this.notify();
  }
}

export const pipelineEngine = new PipelineEngine();
