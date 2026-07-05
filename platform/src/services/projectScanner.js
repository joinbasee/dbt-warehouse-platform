// Project Scanner — scans dbt project and caches results
// Called from Electron main process via IPC

let cachedData = null;
let lastScanTime = null;

export async function scanProject() {
  const api = window.electronAPI;
  if (!api) return getMockData();

  try {
    const data = await api.scanProject();
    cachedData = data;
    lastScanTime = new Date();
    return data;
  } catch (e) {
    console.error('Project scan error:', e);
    return cachedData || getMockData();
  }
}

export async function getProjectData() {
  const api = window.electronAPI;
  if (!api) return getMockData();

  try {
    const data = await api.getProjectCache();
    if (data && data.stats && data.stats.modelCount > 0) {
      cachedData = data;
      return data;
    }
    return await scanProject();
  } catch (e) {
    return cachedData || getMockData();
  }
}

function getMockData() {
  // Fallback data when Electron API is not available (dev mode in browser)
  const domainData = {
    xt: { name: '选题域', models: [] },
    bj: { name: '编校域', models: [] },
    order: { name: '订单域', models: [] },
    fi: { name: '财务域', models: [] },
    md: { name: '主数据域', models: [] },
    stock: { name: '库存域', models: [] },
  };
  return {
    models: [],
    macros: [
      { name: 'sap_date', path: 'macros/sap_date.sql', description: 'SAP日期yyyMMdd→DATE转换', params: '{{ sap_date(\'erdat\') }}' },
      { name: 'sap_string', path: 'macros/sap_string.sql', description: 'TRIM+NULL替换为默认值', params: '{{ sap_string(\'name1\', default="\'UNKNOWN\'") }}' },
      { name: 'sap_flag', path: 'macros/sap_flag.sql', description: 'SAP标记X/空→1/0转换', params: '{{ sap_flag(\'fksto\') }}' },
      { name: 'sap_decimal', path: 'macros/sap_string.sql', description: 'NULL→0+CAST DECIMAL', params: '{{ sap_decimal(\'netwr\') }}' },
      { name: 'audit_columns', path: 'macros/audit_columns.sql', description: '7个审计字段自动注入', params: '{{ audit_columns() }}' },
      { name: 'incremental_filter', path: 'macros/incremental_filter.sql', description: '增量加载WHERE条件', params: '{{ incremental_filter(\'erdat\', 7) }}' },
      { name: 'group_concat', path: 'macros/group_concat.sql', description: '跨4种SQL方言的聚合连接', params: '{{ group_concat(\'col\', separator="\', \'") }}' },
      { name: 'zsdr005_params', path: 'macros/zsdr005_params.sql', description: 'FineReport参数过滤（Hive）', params: '{{ zsdr005_where_clause() }}' },
    ],
    sources: [],
    domains: domainData,
    stats: { modelCount: 71, macroCount: 8, sourceCount: 74, domainCount: 6, connectionCount: 5 },
    updatedAt: new Date().toISOString(),
  };
}
