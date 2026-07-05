// ============================================================
// 智能数仓建设平台 — 项目定义
// ============================================================

export const PROJECTS = [
  {
    id: 'pep',
    name: 'PEP 企业数据仓库',
    subtitle: '人教社 SAP ECC → Hive + OceanBase',
    adapter: 'sap_ecc',
    domains: [
      { code:'order', name:'订单域', count:71, color:'#007AFF' },
      { code:'fi', name:'财务域', count:48, color:'#34C759' },
      { code:'ztppm', name:'选题域', count:23, color:'#AF52DE' },
      { code:'md', name:'主数据域', count:18, color:'#FF9500' },
      { code:'stock', name:'库存域', count:6, color:'#5AC8FA' },
      { code:'bj', name:'编校域', count:12, color:'#FF3B30' },
    ],
    layers: ['ODS','DWD','DWS','DIM','ADS'],
    stats: { models:71, macros:8, sources:74, scenarios:5 },
  },
  {
    id: 'benz',
    name: '奔驰 数据仓库',
    subtitle: '北京奔驰 68系统 → 14业务域',
    adapter: 'custom',
    domains: [
      { code:'prod', name:'生产制造', demand:182, systems:20, metrics:122, color:'#007AFF' },
      { code:'qm', name:'质量管理', demand:138, systems:16, metrics:113, color:'#34C759' },
      { code:'safety', name:'安全与消防', demand:50, systems:12, metrics:47, color:'#FF9500' },
      { code:'hr', name:'人力资源', demand:43, systems:6, metrics:27, color:'#AF52DE' },
      { code:'fc', name:'财务成本', demand:43, systems:11, metrics:35, color:'#FF3B30' },
      { code:'tss', name:'技术支持', demand:32, systems:6, metrics:20, color:'#5AC8FA' },
      { code:'pp', name:'生产计划', demand:16, systems:6, metrics:8, color:'#FF6B35' },
      { code:'rd', name:'研发工艺', demand:6, systems:4, metrics:5, color:'#8E8E93' },
      { code:'log', name:'物流', demand:6, systems:4, metrics:5, color:'#FF9500' },
    ],
    layers: ['ODS','DWD','DWS','ADS'],
    stats: { systems:68, databases:7, demands:522, domainsReady:20 },
  },
  {
    id: 'unisity',
    name: 'Unisity 高校数据中台',
    subtitle: '金融学院 4大屏+钻取 → 数据中台',
    adapter: 'custom',
    domains: [
      { code:'campus', name:'校园运营', demand:28, color:'#007AFF' },
      { code:'enrollment', name:'招生管理', demand:26, color:'#34C759' },
      { code:'student', name:'学生管理', demand:32, color:'#FF9500' },
      { code:'faculty', name:'师资管理', demand:28, color:'#AF52DE' },
    ],
    layers: ['ODS','DWD','DWS','ADS'],
    stats: { indicators:114, dashboards:4, drills:20, reports:4 },
  },
];

export const CURRENT_PROJECT = 'benz';
