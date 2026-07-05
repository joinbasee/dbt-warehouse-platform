// ============================================================
// Unisity 高校数据中台 — 业务域 / 大屏 / 钻取 数据定义
// 来源: 指标体系汇总表 + BI截图
// ============================================================

export const UNISITY_DOMAIN_DASHBOARDS = {
  campus: {
    name:'校园运营', demand:28, color:'#007AFF',
    icon:'01_main',
    dashboards:[
      {
        id:'campus-main', name:'校园运营驾驶舱', level:'main',
        kpis:[
          { label:'在籍学生总数', value:'18,520', unit:'人', trend:'up', trendVal:'+3.2%', src:'' },
          { label:'教职工总数', value:'1,280', unit:'人', trend:'', trendVal:'', src:'' },
          { label:'生师比', value:'14.5', unit:':1', trend:'down', trendVal:'目标≤16', src:'' },
          { label:'学生流动率', value:'2.1', unit:'%', trend:'down', trendVal:'-0.3%', src:'' },
          { label:'校园资产总值', value:'8.52', unit:'亿元', trend:'', trendVal:'', src:'' },
          { label:'年度预算执行率', value:'87.5', unit:'%', trend:'', trendVal:'', src:'' },
        ],
        charts:['campus_kpi','campus_budget','campus_assets'],
        drills:[
          { id:'campus-asset', name:'资产运营概览', icon:'01A' },
          { id:'campus-energy', name:'能源管理分析', icon:'01B' },
          { id:'campus-security', name:'安防与后勤保障', icon:'01C' },
          { id:'campus-finance', name:'财务收支明细', icon:'01D' },
          { id:'campus-research', name:'科研转化与成果', icon:'01E' },
        ],
      },
      { id:'campus-asset', name:'资产运营概览', level:'drill', parent:'campus-main', kpis:[
        { label:'固定资产总额', value:'6.85', unit:'亿元', trend:'', trendVal:'', src:'' },
        { label:'教学设备总值', value:'1.42', unit:'亿元', trend:'up', trendVal:'+5%', src:'' },
        { label:'设备完好率', value:'96.8', unit:'%', trend:'up', trendVal:'', src:'' },
        { label:'实验室使用率', value:'78.5', unit:'%', trend:'', trendVal:'', src:'' },
      ], charts:['asset_detail','asset_trend']},
      { id:'campus-energy', name:'能源管理分析', level:'drill', parent:'campus-main', kpis:[
        { label:'总用电量(月)', value:'285', unit:'万kWh', trend:'down', trendVal:'-8%', src:'' },
        { label:'总用水量(月)', value:'4.2', unit:'万吨', trend:'down', trendVal:'-5%', src:'' },
        { label:'单位面积能耗', value:'58', unit:'kWh/m²', trend:'down', trendVal:'', src:'' },
      ], charts:['energy_trend','energy_building']},
      { id:'campus-security', name:'安防与后勤保障', level:'drill', parent:'campus-main', kpis:[
        { label:'安防事件(月)', value:2, unit:'起', trend:'', trendVal:'', src:'' },
        { label:'宿舍入住率', value:'92.5', unit:'%', trend:'', trendVal:'', src:'' },
        { label:'餐饮满意度', value:'87.2', unit:'%', trend:'up', trendVal:'+2%', src:'' },
      ], charts:['security_log','logistics']},
      { id:'campus-finance', name:'财务收支明细', level:'drill', parent:'campus-main', kpis:[
        { label:'年度总收入', value:'5.82', unit:'亿元', trend:'up', trendVal:'+6%', src:'' },
        { label:'年度总支出', value:'5.45', unit:'亿元', trend:'', trendVal:'', src:'' },
        { label:'科研经费到款', value:'1.25', unit:'亿元', trend:'up', trendVal:'+12%', src:'' },
      ], charts:['finance_structure','finance_trend']},
      { id:'campus-research', name:'科研转化与成果', level:'drill', parent:'campus-main', kpis:[
        { label:'科研项目数', value:285, unit:'项', trend:'', trendVal:'', src:'' },
        { label:'论文发表数', value:520, unit:'篇', trend:'up', trendVal:'+8%', src:'' },
        { label:'专利授权数', value:38, unit:'件', trend:'up', trendVal:'+15%', src:'' },
        { label:'成果转化金额', value:'3,200', unit:'万元', trend:'up', trendVal:'+22%', src:'' },
      ], charts:['research_output','research_fund']},
    ],
  },

  enrollment: {
    name:'招生管理', demand:26, color:'#34C759',
    icon:'02_main',
    dashboards:[
      {
        id:'enroll-main', name:'招生管理分析大屏', level:'main',
        kpis:[
          { label:'招生计划完成率', value:'98.5', unit:'%', trend:'up', trendVal:'+1.2%', src:'' },
          { label:'实际报到人数', value:'4,850', unit:'人', trend:'up', trendVal:'+5.8%', src:'' },
          { label:'报到率', value:'94.2', unit:'%', trend:'up', trendVal:'+0.8%', src:'' },
          { label:'第一志愿录取率', value:'72.5', unit:'%', trend:'', trendVal:'', src:'' },
          { label:'生均招生成本', value:'1,250', unit:'元', trend:'down', trendVal:'-8%', src:'' },
          { label:'国际化生源占比', value:'8.5', unit:'%', trend:'up', trendVal:'+1.2%', src:'' },
        ],
        charts:['enroll_funnel','enroll_trend'],
        drills:[
          { id:'enroll-funnel', name:'招生漏斗逐级穿透', icon:'02A' },
          { id:'enroll-roi', name:'渠道效益ROI分析', icon:'02B' },
          { id:'enroll-quality', name:'生源质量多维画像', icon:'02C' },
          { id:'enroll-region', name:'区域招生竞争力', icon:'02D' },
          { id:'enroll-predict', name:'招生预测与趋势', icon:'02E' },
        ],
      },
      { id:'enroll-funnel', name:'招生漏斗', level:'drill', parent:'enroll-main', kpis:[
        { label:'咨询量', value:'28,500', unit:'人次', trend:'', trendVal:'', src:'' },
        { label:'报名数', value:'8,250', unit:'人', trend:'', trendVal:'', src:'' },
        { label:'录取数', value:'5,150', unit:'人', trend:'', trendVal:'', src:'' },
        { label:'报到数', value:'4,850', unit:'人', trend:'', trendVal:'', src:'' },
      ], charts:['funnel_detail','stage_ratio']},
      { id:'enroll-roi', name:'渠道效益ROI', level:'drill', parent:'enroll-main', charts:['channel_roi','channel_compare']},
      { id:'enroll-quality', name:'生源质量画像', level:'drill', parent:'enroll-main', charts:['quality_radar','quality_dist']},
      { id:'enroll-region', name:'区域竞争力', level:'drill', parent:'enroll-main', charts:['region_map','region_rank']},
      { id:'enroll-predict', name:'招生预测', level:'drill', parent:'enroll-main', charts:['predict_model','predict_compare']},
    ],
  },

  student: {
    name:'学生管理', demand:32, color:'#FF9500',
    icon:'03_main',
    dashboards:[
      {
        id:'student-main', name:'学生画像与学业预警大屏', level:'main',
        kpis:[
          { label:'学业预警人数', value:185, unit:'人', trend:'down', trendVal:'-12%', src:'' },
          { label:'预警解除率', value:'72.5', unit:'%', trend:'up', trendVal:'+5%', src:'' },
          { label:'奖学金覆盖率', value:'28.5', unit:'%', trend:'', trendVal:'', src:'' },
          { label:'毕业生就业率', value:'94.8', unit:'%', trend:'up', trendVal:'+1.5%', src:'' },
          { label:'考研上线率', value:'32.5', unit:'%', trend:'up', trendVal:'+3%', src:'' },
          { label:'心理筛查异常率', value:'5.2', unit:'%', trend:'down', trendVal:'-1%', src:'' },
        ],
        charts:['student_dist','student_warning'],
        drills:[
          { id:'student-profile', name:'学生全景画像', icon:'03A' },
          { id:'student-academic', name:'学业表现与选课指导', icon:'03B' },
          { id:'student-career', name:'就业与职业发展', icon:'03C' },
          { id:'student-behavior', name:'行为与心理健康', icon:'03D' },
          { id:'student-help', name:'精准帮扶管理', icon:'03E' },
        ],
      },
      { id:'student-profile', name:'学生全景画像', level:'drill', parent:'student-main', charts:['profile_detail']},
      { id:'student-academic', name:'学业表现', level:'drill', parent:'student-main', charts:['academic_gpa','academic_course']},
      { id:'student-career', name:'就业发展', level:'drill', parent:'student-main', charts:['career_rate','career_salary']},
      { id:'student-behavior', name:'行为心理', level:'drill', parent:'student-main', charts:['behavior_heat','psychology']},
      { id:'student-help', name:'精准帮扶', level:'drill', parent:'student-main', charts:['help_list','help_progress']},
    ],
  },

  faculty: {
    name:'师资管理', demand:28, color:'#AF52DE',
    icon:'04_main',
    dashboards:[
      {
        id:'faculty-main', name:'师资管理分析大屏', level:'main',
        kpis:[
          { label:'专任教师数', value:685, unit:'人', trend:'up', trendVal:'+3%', src:'' },
          { label:'博士学位占比', value:'62.5', unit:'%', trend:'up', trendVal:'+2%', src:'' },
          { label:'生师比', value:'14.5', unit:':1', trend:'', trendVal:'', src:'' },
          { label:'高级职称占比', value:'48.2', unit:'%', trend:'', trendVal:'', src:'' },
          { label:'教师年均课时', value:'320', unit:'课时', trend:'', trendVal:'', src:'' },
          { label:'师资流失率', value:'3.5', unit:'%', trend:'down', trendVal:'', src:'' },
        ],
        charts:['faculty_structure','faculty_perf'],
        drills:[
          { id:'faculty-profile', name:'教师全景画像', icon:'04A' },
          { id:'faculty-teaching', name:'教学能力评价', icon:'04B' },
          { id:'faculty-research', name:'科研绩效分析', icon:'04C' },
          { id:'faculty-structure', name:'师资结构分析', icon:'04D' },
          { id:'faculty-salary', name:'薪酬与绩效管理', icon:'04E' },
        ],
      },
      { id:'faculty-profile', name:'教师画像', level:'drill', parent:'faculty-main', charts:['teacher_detail']},
      { id:'faculty-teaching', name:'教学评价', level:'drill', parent:'faculty-main', charts:['teaching_score','teaching_peer']},
      { id:'faculty-research', name:'科研绩效', level:'drill', parent:'faculty-main', charts:['research_index','research_compare']},
      { id:'faculty-structure', name:'师资结构', level:'drill', parent:'faculty-main', charts:['structure_age','structure_rank']},
      { id:'faculty-salary', name:'薪酬绩效', level:'drill', parent:'faculty-main', charts:['salary_dist','salary_perf']},
    ],
  },
};

// 数据中台平台功能
export const UNISITY_PLATFORM = [
  { id:'home', name:'数据中台首页', icon:'数据中台_首页' },
  { id:'assets', name:'数据资产目录', icon:'数据中台_数据资产目录' },
  { id:'bi_tool', name:'自助BI分析', icon:'数据中台_自助BI分析' },
  { id:'qa', name:'智能问答', icon:'数据中台_智能问答' },
  { id:'alert', name:'实时告警', icon:'数据中台_实时告警' },
  { id:'report', name:'报告生成', icon:'数据中台_报告生成' },
  { id:'monitor', name:'预警监控中心', icon:'BI模块_预警监控中心' },
];

// 报告
export const UNISITY_REPORTS = [
  { name:'月度运营分析报告', icon:'报告_01' },
  { name:'招生季报', icon:'报告_02' },
  { name:'学生学业分析报告', icon:'报告_03' },
  { name:'师资绩效年报', icon:'报告_04' },
];
