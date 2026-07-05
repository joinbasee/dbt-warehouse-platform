const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Project
  scanProject: () => ipcRenderer.invoke('scan-project'),
  getProjectCache: () => ipcRenderer.invoke('get-project-cache'),

  // Claude Code
  launchClaude: () => ipcRenderer.invoke('launch-claude'),
  stopClaude: () => ipcRenderer.invoke('stop-claude'),
  sendClaudeCommand: (text) => ipcRenderer.invoke('send-claude-command', text),
  getClaudeStatus: () => ipcRenderer.invoke('get-claude-status'),
  onClaudeOutput: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('claude-output', handler);
    return () => ipcRenderer.removeListener('claude-output', handler);
  },
  onClaudeStatusChange: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('claude-status', handler);
    return () => ipcRenderer.removeListener('claude-status', handler);
  },

  // dbt
  executeDbt: (command, target, modelSelect) =>
    ipcRenderer.invoke('execute-dbt', command, target, modelSelect),
  stopDbt: () => ipcRenderer.invoke('stop-dbt'),
  onDbtOutput: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('dbt-output', handler);
    return () => ipcRenderer.removeListener('dbt-output', handler);
  },

  // System
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  executeCommand: (cmd) => ipcRenderer.invoke('execute-command', cmd),

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (updates) => ipcRenderer.invoke('update-config', updates),

  // File ops
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  loadModelContent: (modelPath) => ipcRenderer.invoke('load-model-content', modelPath),
  scanDocuments: () => ipcRenderer.invoke('scan-documents'),
  computeLineage: () => ipcRenderer.invoke('compute-lineage'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
