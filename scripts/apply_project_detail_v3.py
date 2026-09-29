from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()

# Project card: make overdue explicit and keep status overview actionable.
old="""      return <button key={p.id} className={`project-card ${is1688?'project-card-1688':''}`} onClick={()=>{setSelectedProjectId(p.id);const first=stages.find(s=>s.project_id===p.id)?.id;if(first)setExpanded({[first]:true})}}><div className=\"project-top\"><div><div className=\"project-heading-line\"><h2>{p.name}</h2><span className={`kind-badge ${is1688?'kind-1688':'kind-brand'}`}>{is1688?'1688 新品':'品牌新品'}</span></div><p>{p.version||'-'} ・ 負責：{owner}</p></div><StatusPill text={p.status||'未設定'}/></div>"""
new="""      const overdueFlag=projectIsOverdue(p)
      return <button key={p.id} className={`project-card ${is1688?'project-card-1688':''} ${overdueFlag?'project-card-overdue':''}`} onClick={()=>{setSelectedProjectId(p.id);const first=stages.find(s=>s.project_id===p.id)?.id;if(first)setExpanded({[first]:true})}}><div className=\"project-top\"><div><div className=\"project-heading-line\"><h2>{p.name}</h2><span className={`kind-badge ${is1688?'kind-1688':'kind-brand'}`}>{is1688?'1688 新品':'品牌新品'}</span>{overdueFlag&&<span className=\"pill pill-danger\">已逾期</span>}</div><p>{p.version||'-'} ・ 負責：{owner}</p></div><StatusPill text={p.status||'未設定'}/></div>"""
if old not in s: raise SystemExit('project card anchor missing')
s=s.replace(old,new,1)

# Strategy page: add owner, product link, strategy deadline and stronger navigation.
old="""      <Field label=\"型號\"><DebouncedInput value={project.version||''} onSave={v=>props.onUpdateProject(project.id,{version:v||null})}/></Field>
      <Field label=\"上市日 D0\"><input type=\"date\" value={project.launch_date||''} onChange={e=>props.onUpdateProject(project.id,{launch_date:e.target.value||null})}/></Field>"""
new="""      <Field label=\"型號\"><DebouncedInput value={project.version||''} onSave={v=>props.onUpdateProject(project.id,{version:v||null})}/></Field>
      <Field label=\"主要負責人\"><select value={project.owner_id??''} onChange={e=>props.onUpdateProject(project.id,{owner_id:e.target.value?Number(e.target.value):null})}><option value=\"\">未指派</option>{props.employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      <Field label=\"上市日 D0\"><input type=\"date\" value={project.launch_date||''} onChange={e=>props.onUpdateProject(project.id,{launch_date:e.target.value||null})}/></Field>
      <Field label=\"策略完成期限\"><input type=\"date\" value={(project as any).strategy_due_date||''} onChange={e=>props.onUpdateProject(project.id,{strategy_due_date:e.target.value||null} as any)}/></Field>"""
if old not in s: raise SystemExit('strategy fields anchor missing')
s=s.replace(old,new,1)
old2="""      <Field label=\"本輪成功定義\" wide><DebouncedInput value={project.success_goal||''} onSave={v=>props.onUpdateProject(project.id,{success_goal:v||null})} placeholder=\"例：確認目標客群、價格與上市主打方向\"/></Field>
      <Field label=\"備註\" wide><DebouncedTextarea value={(project as any).notes||''} onSave={v=>props.onUpdateProject(project.id,{notes:v||null} as any)} placeholder=\"專案備註\"/></Field>"""
new2="""      <Field label=\"本輪成功定義\" wide><DebouncedInput value={project.success_goal||''} onSave={v=>props.onUpdateProject(project.id,{success_goal:v||null})} placeholder=\"例：確認目標客群、價格與上市主打方向\"/></Field>
      <Field label=\"產品／參考網址\" wide><DebouncedInput value={(project as any).product_url||''} onSave={v=>props.onUpdateProject(project.id,{product_url:v||null} as any)} placeholder=\"https://...\"/></Field>
      <Field label=\"備註\" wide><DebouncedTextarea value={(project as any).notes||''} onSave={v=>props.onUpdateProject(project.id,{notes:v||null} as any)} placeholder=\"專案備註\"/></Field>"""
if old2 not in s: raise SystemExit('strategy lower fields anchor missing')
s=s.replace(old2,new2,1)

# Execution page: surface core project information without forcing users back to strategy.
anchor="""    <section className=\"execution-hero\"><div><span>新品執行管理</span><h1>{project.name}</h1><p>{project.version||'-'} ・ 上市日 {project.launch_date||'尚未設定'} ・ 68 項標準跨部門工作流程</p></div><strong>{overall}%</strong></section>
"""
replacement=anchor+"""    <section className=\"execution-project-info\"><span>負責人 <b>{employees.find(e=>e.id===project.owner_id)?.name||'未指派'}</b></span><span>正式價 <b>NT$ {project.retail_price??'-'}</b></span><span>團購／活動價 <b>NT$ {project.group_price??'-'}</b></span><span>策略期限 <b>{(project as any).strategy_due_date||'-'}</b></span>{(project as any).product_url&&<a href={(project as any).product_url} target=\"_blank\" rel=\"noreferrer\">開啟產品資料 ↗</a>}</section>
"""
if anchor not in s: raise SystemExit('execution hero anchor missing')
s=s.replace(anchor,replacement,1)

p.write_text(s)

# Extend Project type with fields already used by the database/UI plus strategy deadline.
t=Path('src/lib/types.ts')
ts=t.read_text()
old="""  success_goal: string | null
  created_at?: string
}"""
new="""  success_goal: string | null
  product_url?: string | null
  notes?: string | null
  strategy_due_date?: string | null
  created_at?: string
}"""
if old not in ts: raise SystemExit('types anchor missing')
t.write_text(ts.replace(old,new,1))
print('project detail v3 applied')
