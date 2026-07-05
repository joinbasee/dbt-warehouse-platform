// ============================================================
// 奔驰项目 — 业务域 / 系统 / 数据库 / 看板 数据定义
// 来源: 业务数据需求汇总表V3.0-20260702
// ============================================================

// ── 9个业务域的看板定义 ──
export const BENZ_DOMAIN_DASHBOARDS = {
  // 生产制造 — 4个完整看板
  prod: {
    name:'生产制造', demand:182, systems:20, metrics:122, color:'#007AFF',
    dashboards:[
      {
        id:'prod-ops', name:'生产运营看板',
        kpis:[
          { label:'产量-上线', value:328, unit:'辆', trend:'up', trendVal:'+12', src:'MRS CP:00005094' },
          { label:'产量-下线', value:315, unit:'辆', trend:'up', trendVal:'+8', src:'MRS CP:00005096' },
          { label:'JPH', value:41, unit:'辆/h', trend:'up', trendVal:'目标40', src:'MRS / iPortal' },
          { label:'产量-FOK', value:312, unit:'辆', trend:'', trendVal:'FOK率94.8%', src:'MRS CP:00007203' },
          { label:'产量-HO', value:320, unit:'辆', trend:'up', trendVal:'+5', src:'MRS CP:00008203' },
          { label:'计划达成率', value:'95.2', unit:'%', trend:'warn', trendVal:'计划345', src:'MRS / AMS' },
        ],
        charts:['hourly','jph','plan','monthly','abnormal','summary'],
      },
      {
        id:'prod-quality', name:'质量绩效看板',
        kpis:[
          { label:'FTC 一次性合格率', value:'97.2', unit:'%', trend:'up', trendVal:'CP:5204', src:'MRS' },
          { label:'FTQ 下线合格率', value:'98.5', unit:'%', trend:'up', trendVal:'Area:75111000', src:'MRS' },
          { label:'VoCA 客户车考核', value:'1.2', unit:'分', trend:'up', trendVal:'CP:7012', src:'MRS' },
          { label:'PAF 外观考核', value:'0.8', unit:'分', trend:'up', trendVal:'CP:6920,6921', src:'PowerBI' },
          { label:'GFP 过程审核', value:'0.5', unit:'分', trend:'up', trendVal:'CP:5291-5297', src:'MRS' },
          { label:'ISD 系统内损伤', value:'0.3', unit:'%', trend:'up', trendVal:'Area:7511', src:'MRS' },
        ],
        charts:['trend','voca_pareto','paf_pareto','workshop','quality_issues','quality_snapshot'],
      },
      {
        id:'prod-equip', name:'设备效率看板',
        kpis:[
          { label:'OEE 综合设备效率', value:'83.5', unit:'%', trend:'down', trendVal:'目标85%', src:'BDE' },
          { label:'SPH 每小时冲次', value:22, unit:'次/h', trend:'up', trendVal:'+1', src:'BDE' },
          { label:'MTTR 平均修复', value:15, unit:'min', trend:'up', trendVal:'目标≤20', src:'iPortal' },
          { label:'设备故障停机率', value:'2.3', unit:'%', trend:'up', trendVal:'目标≤3.0%', src:'BDE' },
          { label:'模具停机率', value:'0.8', unit:'%', trend:'up', trendVal:'目标≤1.5%', src:'BDE' },
          { label:'计划停线率', value:'1.1', unit:'%', trend:'', trendVal:'计划内', src:'BDE' },
        ],
        charts:['oee_stack','oee_sph','stop_pareto','stop_top10','stop_pie','takt'],
      },
      {
        id:'prod-process', name:'过程控制看板',
        kpis:[],
        charts:['process_check','cp_swi','film_thickness','cmm_training'],
      },
    ],
  },

  // 质量管理 — 1个总览看板（后续扩展）
  qm: {
    name:'质量管理', demand:138, systems:16, metrics:113, color:'#34C759',
    dashboards:[
      {
        id:'qm-overview', name:'质量总览',
        kpis:[
          { label:'CMM考核完成率', value:'94.5', unit:'%', trend:'up', trendVal:'+2.1%', src:'PiWeb' },
          { label:'8D平均关闭时长', value:'12.3', unit:'天', trend:'down', trendVal:'目标≤15', src:'CAT-8D' },
          { label:'零件交付PPM', value:'2850', unit:'PPM', trend:'down', trendVal:'目标≤3000', src:'SQMS' },
          { label:'供应商索赔接受率', value:'87.2', unit:'%', trend:'up', trendVal:'+3.5%', src:'SQMS' },
          { label:'MSA/检具合格率', value:'99.1', unit:'%', trend:'up', trendVal:'目标≥99%', src:'QDA' },
          { label:'供应商审核得分', value:'82.5', unit:'分', trend:'', trendVal:'ARGUS', src:'ARGUS' },
        ],
        charts:['qm_cmm','qm_8d','qm_supplier','qm_workshop'],
      },
    ],
  },

  // 安全与消防
  safety: {
    name:'安全与消防', demand:50, systems:12, metrics:47, color:'#FF9500',
    dashboards:[
      {
        id:'safety-overview', name:'安防总览',
        kpis:[
          { label:'安全事件(本月)', value:3, unit:'起', trend:'down', trendVal:'较上月-2', src:'人工填报' },
          { label:'周界报警总数', value:12, unit:'次', trend:'down', trendVal:'较上周-5', src:'周界报警' },
          { label:'消防报警总数', value:2, unit:'次', trend:'', trendVal:'误报1次', src:'安消联动' },
          { label:'三方在厂人数', value:487, unit:'人', trend:'', trendVal:'', src:'相关方管理' },
          { label:'危废量(周)', value:'2.8', unit:'吨', trend:'down', trendVal:'目标≤3.5', src:'飞书环保' },
          { label:'门禁入场(日)', value:1250, unit:'人次', trend:'', trendVal:'', src:'门禁系统' },
        ],
        charts:['safety_events','safety_alarm','safety_waste'],
      },
    ],
  },

  // 人力资源
  hr: {
    name:'人力资源', demand:43, systems:6, metrics:27, color:'#AF52DE',
    dashboards:[
      {
        id:'hr-overview', name:'人力总览',
        kpis:[
          { label:'OT(本月累计)', value:'3850', unit:'h', trend:'down', trendVal:'较上月-8%', src:'HR系统' },
          { label:'出勤率', value:'94.2', unit:'%', trend:'up', trendVal:'+0.5%', src:'HR系统' },
          { label:'HPV', value:'22.5', unit:'h/辆', trend:'down', trendVal:'目标≤23', src:'HR系统' },
          { label:'蓝领人数', value:1850, unit:'人', trend:'', trendVal:'', src:'HR系统' },
          { label:'白领人数', value:620, unit:'人', trend:'', trendVal:'', src:'HR系统' },
          { label:'离职率(月)', value:'2.1', unit:'%', trend:'up', trendVal:'目标≤3%', src:'HR系统' },
        ],
        charts:['hr_ot','hr_headcount','hr_skills'],
      },
    ],
  },

  // 财务成本
  fc: {
    name:'财务成本', demand:43, systems:11, metrics:35, color:'#FF3B30',
    dashboards:[
      {
        id:'fc-overview', name:'财务总览',
        kpis:[
          { label:'OH(运营费用)', value:'128.5', unit:'M€', trend:'down', trendVal:'预算135', src:'Tagetik' },
          { label:'PC(人工成本)', value:'45.2', unit:'M€', trend:'', trendVal:'预算44', src:'Tagetik' },
          { label:'工废率', value:'1.8', unit:'%', trend:'down', trendVal:'目标≤2.0%', src:'Tagetik' },
          { label:'PR/PO审批中', value:45, unit:'单', trend:'warn', trendVal:'超期8单', src:'CBFC' },
          { label:'单车成本', value:'32.5', unit:'k€', trend:'down', trendVal:'较上月-0.8', src:'Tagetik' },
          { label:'生产辅料成本', value:'2.8', unit:'M€', trend:'', trendVal:'预算3.0', src:'cbFC' },
        ],
        charts:['fc_cost','fc_prpo','fc_budget'],
      },
    ],
  },

  // 技术支持
  tss: {
    name:'技术支持', demand:32, systems:6, metrics:20, color:'#5AC8FA',
    dashboards:[
      {
        id:'tss-overview', name:'技术支持总览',
        kpis:[
          { label:'整线OEE', value:'83.5', unit:'%', trend:'down', trendVal:'目标85%', src:'PRISMA' },
          { label:'TA(技术可用性)', value:'95.8', unit:'%', trend:'', trendVal:'', src:'PRISMA' },
          { label:'维修停机(日)', value:'85', unit:'min', trend:'down', trendVal:'-15min', src:'人工' },
          { label:'单车用电', value:'385', unit:'kWh', trend:'down', trendVal:'-12', src:'EMS MRS' },
          { label:'单车用水', value:'2.8', unit:'m³', trend:'down', trendVal:'-0.2', src:'EMS MRS' },
          { label:'能源消耗总量', value:'18.5', unit:'MWh', trend:'', trendVal:'', src:'EMS MRS' },
        ],
        charts:['tss_equip','tss_energy'],
      },
    ],
  },

  // 生产计划
  pp: {
    name:'生产计划', demand:16, systems:6, metrics:8, color:'#FF6B35',
    dashboards:[
      {
        id:'pp-overview', name:'计划总览',
        kpis:[
          { label:'OEE', value:'83.5', unit:'%', trend:'', trendVal:'', src:'iPortal' },
          { label:'BBD', value:'12.5', unit:'h', trend:'down', trendVal:'目标≤15', src:'iPortal' },
          { label:'MTTR', value:'15', unit:'min', trend:'up', trendVal:'目标≤20', src:'iPortal' },
          { label:'BC-HCR', value:'92.5', unit:'%', trend:'', trendVal:'', src:'WFP' },
        ],
        charts:['pp_oee','pp_schedule'],
      },
    ],
  },

  // 研发工艺
  rd: {
    name:'研发工艺', demand:6, systems:4, metrics:5, color:'#8E8E93',
    dashboards:[
      {
        id:'rd-overview', name:'研发总览',
        kpis:[
          { label:'IS-TEST', value:28, unit:'项', trend:'', trendVal:'', src:'低代码' },
          { label:'EC/PER实施', value:5, unit:'项', trend:'', trendVal:'进行中', src:'PER' },
          { label:'工艺变更', value:12, unit:'项', trend:'', trendVal:'本月', src:'PER' },
        ],
        charts:['rd_projects'],
      },
    ],
  },

  // 物流
  log: {
    name:'物流', demand:6, systems:4, metrics:5, color:'#FB923C',
    dashboards:[
      {
        id:'log-overview', name:'物流总览',
        kpis:[
          { label:'生产计划达成', value:'95.2', unit:'%', trend:'', trendVal:'', src:'AMS' },
          { label:'毛坯物料库存', value:'12.5', unit:'天', trend:'', trendVal:'', src:'IPT' },
        ],
        charts:['log_material'],
      },
    ],
  },
};

// ── 数据库 ──
export const BENZ_DATABASES = [
  { name:'SQL Server', systems:27, domains:10, color:'#007AFF' },
  { name:'MongoDB', systems:1, domains:5, color:'#34C759' },
  { name:'Oracle', systems:3, domains:4, color:'#FF9500' },
  { name:'SAP HANA', systems:3, domains:3, color:'#FF3B30' },
  { name:'MySQL', systems:2, domains:1, color:'#5AC8FA' },
  { name:'tyco', systems:1, domains:1, color:'#AF52DE' },
  { name:'PostgreSQL', systems:1, domains:1, color:'#8E8E93' },
];

// ── 系统就绪度 ──
export const BENZ_SYSTEMS_READINESS = [
  { system:'BDE', domain:'生产', db:'SQL Server', tables:8, readiness:'A', color:'#34C759' },
  { system:'iPortal', domain:'生产/计划', db:'SQL Server', tables:2, readiness:'A', color:'#34C759' },
  { system:'AMS', domain:'生产/质量', db:'S/4HANA', tables:4, readiness:'A', color:'#34C759' },
  { system:'HR系统', domain:'人力', db:'SQL Server', tables:1, readiness:'A', color:'#34C759' },
  { system:'IRPO', domain:'财务', db:'IRPO', tables:1, readiness:'A', color:'#34C759' },
  { system:'IPT', domain:'物流', db:'Oracle', tables:1, readiness:'A', color:'#34C759' },
  { system:'MRS', domain:'生产/质量', db:'待确认', tables:4, readiness:'B', color:'#FF9500' },
  { system:'PiWeb', domain:'质量', db:'SQL Server?', tables:0, readiness:'B', color:'#FF9500' },
  { system:'PRISMA', domain:'生产/技术支持', db:'SQL Server?/Oracle', tables:0, readiness:'B', color:'#FF9500' },
  { system:'Tagetik', domain:'财务', db:'SQL Server', tables:0, readiness:'B', color:'#FF9500' },
  { system:'QDA', domain:'质量', db:'SQL Server?', tables:0, readiness:'B', color:'#FF9500' },
];

// ── 模拟数据生成 ──
export function generateMockData() {
  const hours = []; for (let i=0;i<24;i++) hours.push(`${('0'+(i+6)%24).slice(-2)}:00`);
  const days = ['06-29','06-30','07-01','07-02','07-03','07-04','07-05'];
  const trend30 = []; for (let i=29;i>=0;i--) trend30.push(`${('0'+(i+6>30?i-24:i+6)).slice(-2)}日`);

  return {
    hourly: hours.map(h=>({hour:h, 上线:Math.round(10+Math.random()*20), 下线:Math.round(9+Math.random()*19), FOK:Math.round(9+Math.random()*18)})),
    jph: days.map(d=>({day:d, JPH:39+Math.round(Math.random()*6), 目标:40})),
    monthly: ['2月','3月','4月','5月','6月','7月'].map(m=>({month:m, 上线:6500+Math.round(Math.random()*2000), 下线:6300+Math.round(Math.random()*1900), FOK:6200+Math.round(Math.random()*1900), HO:6400+Math.round(Math.random()*1900)})),
    qualityTrend: trend30.map(d=>({day:d, 'FTC%':(96+Math.random()*3).toFixed(1), 'FTQ%':(97+Math.random()*2.5).toFixed(1), VoCA:(0.8+Math.random()*1.2).toFixed(1), PAF:(0.4+Math.random()*1).toFixed(1)})),
    vocaPareto:[{name:'装配间隙',value:45},{name:'表面划伤',value:30},{name:'漆面缺陷',value:22},{name:'功能异响',value:15},{name:'内饰脏污',value:10},{name:'线束松动',value:8},{name:'管路干涉',value:5},{name:'其它',value:3}],
    pafPareto:[{name:'漆面颗粒',value:38},{name:'漆面流挂',value:22},{name:'色差',value:18},{name:'橘皮',value:12},{name:'划伤',value:8},{name:'缩孔',value:6},{name:'针孔',value:4},{name:'其它',value:3}],
    workshops:['AS总装','MRA2','BS焊装','PS涂装','SS冲压','机加','电池'].map(w=>({name:w,'FTC%':(94+Math.random()*5).toFixed(1),'FTQ%':(96+Math.random()*3.5).toFixed(1),VoCA:(0.8+Math.random()*1.4).toFixed(1)})),
    oee30:trend30.map(d=>({day:d,可用性:87+Math.random()*9,性能:83+Math.random()*11,质量率:90+Math.random()*8})),
    oeeDaily:days.map(d=>({day:d,OEE:83+Math.random()*3,SPH:21+Math.round(Math.random()*4)})),
    stopPareto:[{name:'设备故障',value:120},{name:'换模调试',value:85},{name:'质量检查',value:60},{name:'物料短缺',value:45},{name:'人员休息',value:35},{name:'计划保养',value:30},{name:'新项目',value:20},{name:'其它',value:15}],
    stopTop10:[{name:'ST-120夹具故障',min:45},{name:'ST-085机器人报警',min:38},{name:'ST-045输送链卡滞',min:32},{name:'ST-150升降机异常',min:28},{name:'ST-032焊接故障',min:25},{name:'ST-078传感器脏污',min:20},{name:'ST-110拧紧轴超时',min:18},{name:'ST-065气路压力低',min:15},{name:'ST-095冷却水温高',min:12},{name:'ST-012安全门触发',min:10}],
    stopPie:[{name:'设备故障',value:120},{name:'模具停机',value:85},{name:'生产停机',value:60},{name:'计划停机',value:35},{name:'新项目',value:20}],
    takt:['ST-012','ST-032','ST-045','ST-065','ST-078','ST-085','ST-095','ST-110','ST-120','ST-150'].map(s=>({station:s,actual:65+Math.round(Math.random()*15),target:72})),
    film:trend30.map(d=>({day:d,电泳:(21+Math.random()*3).toFixed(1),面漆:(42+Math.random()*8).toFixed(1),分层:(8+Math.random()*4).toFixed(1)})),
    // 其他域的模拟数据
    qmCmm:['Z2.3','HOP QZ','HOP FA','HOP FO','HOP VK','HOP MH','Z4'].map(s=>({station:s,cpk:(1.0+Math.random()*1.2).toFixed(2),okRate:(90+Math.random()*9).toFixed(1)})),
    qm8d:trend30.map(d=>({day:d,open:Math.round(5+Math.random()*15),closed:Math.round(3+Math.random()*12)})),
    safetyEvents:['1月','2月','3月','4月','5月','6月','7月'].map(m=>({month:m,安全事件:Math.round(1+Math.random()*4),消防报警:Math.round(Math.random()*3),周界报警:Math.round(5+Math.random()*10)})),
    hrOT:trend30.map(d=>({day:d,OT:3000+Math.round(Math.random()*1000),目标:3500})),
    fcCost:trend30.map(d=>({day:d,预算:128,实际:125+Math.random()*6})),
  };
}
