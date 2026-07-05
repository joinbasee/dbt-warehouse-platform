import React,{useState}from'react';

const TABS=['SQL 编辑器','工作流编排','AI 辅助','模型管理','代码模板'];
const PROMPTS=['生成DWD清洗模型','智能纠错: 跨层引用检查','生成DWS汇总SQL','生成增量加载配置','推荐质量测试规则'];

export default function DevPanel(){const[tab,setTab]=useState(0);const[sql,setSql]=useState(`-- 生产运营：小时产量明细查询
-- 源: MRS.Delivery_data_hour
SELECT DATE_FORMAT(event_time,'%H:00') AS hour,
  SUM(CASE WHEN cp='00005094' THEN qty END) AS 上线,
  SUM(CASE WHEN cp='00005096' THEN qty END) AS 下线,
  AVG(jph) AS JPH
FROM mrs_delivery_data_hour WHERE dt='2026-07-05'
GROUP BY 1 ORDER BY 1;`);const[result,setResult]=useState(null);const[aiInput,setAiInput]=useState('');const[aiHistory,setAiHistory]=useState([]);
  const runSQL=()=>setResult({cols:['时段','上线','下线','FOK','JPH'],rows:[['06:00','18','17','16','38'],['07:00','22','20','19','42'],['08:00','25','24','23','44'],['09:00','20','19','18','40'],['10:00','15','14','13','36'],['11:00','24','22','21','43'],['12:00','19','18','17','39'],['13:00','21','20','19','41'],['14:00','26','25','24','45']],time:'0.8s',rows:9});

  const runAi=(p)=>{const input=p||aiInput;if(!input)return;const responses={'生成':'-- AI生成: DWD清洗模型\n{{ config(materialized="table") }}\n\nSELECT pk_col,\n  {{ sap_date("date_col") }} AS date_col,\n  {{ sap_string("name_col") }} AS name_col,\n  {{ sap_decimal("amount_col") }} AS amount_col,\n  {{ sap_flag("flag_col") }} AS flag_col,\n  {{ audit_columns() }}\nFROM {{ source("ods","table_name") }}','纠错':'-- 智能检查完成\n-- ⚠ 发现2个问题:\n-- 1. dws_prod_oee引用了source(\'ods\',\'bde_oee\')\n--    ⇒ 应改为ref(\'dwd_prod_bde_oee\')\n-- 2. ads_prod_ops未使用incremental_filter()\n--    ⇒ 加上{{ incremental_filter() }}','质量':'-- 推荐质量测试:\nmodels/schema.yml:\n  - name: dwd_prod_bde_stop\n    columns:\n      - name: event_time\n        tests:\n          - not_null\n          - unique\n      - name: shift_id\n        tests:\n          - accepted_values:\n              values: [\'早\',\'中\',\'夜\']'};
  const key=Object.keys(responses).find(k=>input.includes(k))||'生成';
  setAiHistory([...aiHistory,{role:'user',text:input},{role:'ai',text:responses[key]}]);setAiInput('');};

  return(<div className="monitor-layout"><h1 className="page-title">数据开发</h1><div className="models-tabs">{TABS.map((t,i)=><button key={i} className={`models-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,flex:1,minHeight:0}}>
      <div className="chart-card" style={{display:'flex',flexDirection:'column'}}><div className="chart-card-header"><span className="chart-title">SQL 编辑器</span><div style={{display:'flex',gap:4}}><button className="btn-mini" onClick={()=>setResult(null)}>清空</button><button className="btn primary" onClick={runSQL}>▶ 执行 (Ctrl+Enter)</button></div></div>
        <textarea className="terminal-output" value={sql} onChange={e=>setSql(e.target.value)} onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')runSQL()}} style={{flex:1,minHeight:280,fontSize:11,border:'none',outline:'none',resize:'none',whiteSpace:'pre',overflow:'auto',fontFamily:"'SF Mono','Consolas',monospace",lineHeight:1.6}}/>
        <div style={{fontSize:9,color:'var(--text-tertiary)',padding:'4px 0'}}>Ctrl+Enter 执行 · 当前连接: MRS(Delivery_data_hour) / BDE / iPortal · 模拟数据</div>
      </div>
      <div className="chart-card" style={{display:'flex',flexDirection:'column'}}><div className="chart-card-header"><span className="chart-title">查询结果</span><span className="chart-subtitle">{result?`${result.rows} rows · ${result.time} · ${new Date().toLocaleTimeString('zh-CN')}`:'按 ▶ 执行'}</span></div>
        {result?<div style={{overflow:'auto',flex:1}}><table className="data-table"><thead><tr>{result.cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{result.rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>:<div className="empty-state" style={{flex:1}}><div className="empty-state-icon" style={{fontSize:32}}>▸</div><div className="empty-state-text">编写SQL并执行查询</div><div className="empty-state-hint">支持: SELECT / JOIN / GROUP BY / WHERE</div></div>}
      </div>
    </div>}
    {tab===1&&<div><div className="kpi-row" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:10}}>{[{l:'场景数',v:'5',u:'个',c:'#007AFF'},{l:'今日执行',v:'12',u:'次',c:'#34C759'},{l:'成功率',v:'91.7',u:'%',c:'#FF9500'},{l:'平均耗时',v:'8.5',u:'min',c:'#AF52DE'},{l:'下次执行',v:'18:00',u:'',c:'#FF3B30'}].map((k,i)=><div key={i} className="stat-mini"><div className="stat-mini-value" style={{color:k.c}}>{k.v}<span className="stat-mini-unit">{k.u}</span></div><div className="stat-mini-label">{k.l}</div></div>)}</div>
    <div className="arch-diagram"><div className="chart-title" style={{marginBottom:12}}>5场景 DAG 流水线 — 点击场景查看步骤</div><div className="arch-layers">
      {[{s:'01 开票明细',c:'#007AFF',t:'每日 06:00',steps:'dwd_order_* → dws_fi_invoice_base → dws_fi_tax_bridge → ads_fi_zsdr005 → test → cross_db验证'},
        {s:'02 收入执行',c:'#34C759',t:'每月1日 06:00',steps:'dwd_order_* + dwd_fi_* → dws_fi_invoice_* → test'},
        {s:'03 表单报表',c:'#FF9500',t:'每周一 06:00',steps:'dwd_fi_* → test'},
        {s:'04 应收',c:'#AF52DE',t:'每日 07:00',steps:'dwd_order_vbrk* + dwd_fi_* → dws_fi_* → test'},
        {s:'05 选题模块',c:'#FF3B30',t:'每周二 06:00',steps:'dwd_bj_* + dwd_xt_* → test'}].map(s=>(<div key={s.s} className="arch-layer" style={{background:'rgba(0,0,0,0.02)',flexDirection:'column',alignItems:'flex-start',gap:4,padding:10}}>
          <div style={{display:'flex',alignItems:'center',gap:12,width:'100%'}}><span className="arch-layer-tag" style={{background:s.c}}>{s.s}</span><span style={{fontSize:10,color:'var(--text-tertiary)'}}>{s.t}</span></div>
          <span style={{fontSize:10,color:'var(--text-secondary)',fontFamily:"'SF Mono',monospace"}}>{s.steps}</span></div>))}
    </div></div></div>}
    {tab===2&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <div className="chart-card" style={{display:'flex',flexDirection:'column'}}><div className="chart-card-header"><span className="chart-title">AI 辅助 — Claude Code CLI</span></div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>{PROMPTS.map((p,i)=>(<button key={i} className="quick-cmd-chip" onClick={()=>runAi(p)} style={{fontSize:10}}>{p}</button>))}</div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}><input className="chat-input" placeholder="输入需求，AI生成SQL..." value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')runAi()}} style={{fontSize:11}}/>
          <div className="terminal-output" style={{flex:1,minHeight:200,fontSize:10,lineHeight:1.5,overflow:'auto'}}>
            {aiHistory.length===0?<div style={{color:'#5A5A6E'}}>输入自然语言需求或点击上方快捷指令开始...</div>:aiHistory.map((h,i)=>(<div key={i} style={{color:h.role==='user'?'#FFCB6B':'#C3E88D',marginBottom:4}}><span style={{color:h.role==='user'?'#FF9500':'#82AAFF',fontSize:9}}>{h.role==='user'?'YOU: ':'AI: '}</span>{h.text.split('\n').slice(0,1)[0]}{h.text.includes('\n')&&<span style={{color:'#5A5A6E'}}> ...</span>}</div>))}
          </div>
        </div>
      </div>
      <div className="chart-card"><div className="chart-card-header"><span className="chart-title">AI生成预览</span></div>
        {aiHistory.filter(h=>h.role==='ai').length>0?<div className="terminal-output" style={{maxHeight:350,overflow:'auto',fontSize:10,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{aiHistory.filter(h=>h.role==='ai').slice(-1)[0]?.text}</div>:<div className="empty-state"><div className="empty-state-text">AI生成的SQL将显示在这里</div></div>}
      </div>
    </div>}
    {tab===3&&<div><div className="sources-grid"><div className="chart-card"><div className="chart-title">dbt 模型清单 — 生产域</div><table className="data-table"><thead><tr><th>模型</th><th>层</th><th>源系统</th><th>状态</th><th>编译</th></tr></thead><tbody>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>ods_bde_oee_report</td><td>ODS</td><td>BDE</td><td style={{color:'#34C759'}}>已部署</td><td>07-05 06:00</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>ods_iportal_kpi</td><td>ODS</td><td>iPortal</td><td style={{color:'#34C759'}}>已部署</td><td>07-05 06:00</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>ods_ams_afko</td><td>ODS</td><td>AMS</td><td style={{color:'#34C759'}}>已部署</td><td>07-05 06:00</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>dwd_prod_bde_stop</td><td>DWD</td><td>BDE</td><td style={{color:'#34C759'}}>已部署</td><td>07-05 06:05</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>dwd_prod_iportal_oee</td><td>DWD</td><td>iPortal</td><td style={{color:'#34C759'}}>已部署</td><td>07-05 06:05</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>dws_prod_oee_daily</td><td>DWS</td><td>BDE+iPortal</td><td style={{color:'#FF9500'}}>待验证</td><td>07-04 18:00</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:600}}>ads_prod_ops</td><td>ADS</td><td>多源</td><td style={{color:'#8E8E93'}}>设计稿</td><td>-</td></tr>
    </tbody></table></div>
    <div className="chart-card"><div className="chart-title">模型预览 — dwd_prod_bde_stop</div><div className="sql-viewer" style={{maxHeight:300,overflow:'auto',fontSize:10}}>{`{{ config(materialized='table') }}\n\nWITH source AS (\n  SELECT *\n  FROM {{ source('ods','bde_stop_detail') }}\n  WHERE {{ incremental_filter() }}\n)\nSELECT\n  stop_id AS bde_stop_id,\n  {{ sap_date('event_date') }} AS event_date,\n  {{ sap_string('stop_reason') }} AS stop_reason,\n  {{ sap_decimal('duration_min') }} AS duration_min,\n  {{ sap_string('workshop') }} AS workshop,\n  {{ sap_string('line_code') }} AS line_code,\n  {{ audit_columns() }}\nFROM source\nQUALIFY ROW_NUMBER() OVER (\n  PARTITION BY stop_id ORDER BY event_date DESC\n) = 1`}</div></div></div></div>}
    {tab===4&&<div className="sources-grid"><div className="chart-card"><div className="chart-title">DWD 清洗模板</div><div className="sql-viewer" style={{maxHeight:280,overflow:'auto',fontSize:10}}>{`{{ config(materialized='table') }}\n\nSELECT\n  pk_col,\n  {{ sap_date('date_col') }} AS date_col,\n  {{ sap_string('name_col') }} AS name_col,\n  {{ sap_decimal('amount_col') }} AS amount_col,\n  {{ sap_flag('flag_col') }} AS flag_col,\n  {{ audit_columns() }}\nFROM {{ source('ods','table_name') }}\nQUALIFY ROW_NUMBER() OVER (\n  PARTITION BY pk_col ORDER BY date_col DESC\n) = 1`}</div></div>
    <div className="chart-card"><div className="chart-title">DWS 汇总模板</div><div className="sql-viewer" style={{maxHeight:280,overflow:'auto',fontSize:10}}>{`{{ config(materialized='table') }}\n\nSELECT\n  d.dimension_col,\n  SUM(f.amount) AS total_amount,\n  COUNT(DISTINCT f.pk) AS record_count,\n  AVG(f.metric) AS avg_metric,\n  {{ audit_columns() }}\nFROM {{ ref('dwd_fact_table') }} f\nLEFT JOIN {{ ref('dim_table') }} d\n  ON f.dim_key = d.dim_key\nGROUP BY d.dimension_col`}</div></div>
    <div className="chart-card"><div className="chart-title">增量加载配置</div><div className="sql-viewer" style={{maxHeight:280,overflow:'auto',fontSize:10}}>{`# dbt_project.yml\nmodels:\n  my_warehouse:\n    dwd:\n      +materialized: incremental\n      +incremental_strategy: merge\n      +unique_key: pk_col\n      +partition_by: dt\n      +on_schema_change: sync_all_columns`}</div></div>
    <div className="chart-card"><div className="chart-title">测试模板</div><div className="sql-viewer" style={{maxHeight:280,overflow:'auto',fontSize:10}}>{`# models/schema.yml\nversion: 2\nmodels:\n  - name: dwd_prod_bde_stop\n    columns:\n      - name: bde_stop_id\n        tests:\n          - not_null\n          - unique\n      - name: event_date\n        tests:\n          - not_null\n      - name: duration_min\n        tests:\n          - not_null:\n              severity: warn`}</div></div></div>}
  </div>);}
