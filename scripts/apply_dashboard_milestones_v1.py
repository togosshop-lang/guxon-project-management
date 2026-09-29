from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()

s=s.replace("  const [templateDefaults, setTemplateDefaults] = useState<ExecutionTemplateDefault[]>([])\n", "  const [templateDefaults, setTemplateDefaults] = useState<ExecutionTemplateDefault[]>([])\n  const [productSheets, setProductSheets] = useState<any[]>([])\n  const [strategyItems, setStrategyItems] = useState<any[]>([])\n")

s=s.replace("    const [p,s,t,g,e,xs,xt,xd] = await Promise.all([", "    const [p,s,t,g,e,xs,xt,xd,ps,si] = await Promise.all([")
s=s.replace("      supabase.from('execution_template_defaults').select('*').order('task_title'),\n", "      supabase.from('execution_template_defaults').select('*').order('task_title'),\n      supabase.from('product_data_sheets').select('project_id,completed,updated_at'),\n      supabase.from('strategy_items').select('project_id,source_status'),\n")
s=s.replace("    const err = p.error || s.error || t.error || g.error || e.error || xs.error || xt.error || xd.error", "    const err = p.error || s.error || t.error || g.error || e.error || xs.error || xt.error || xd.error || ps.error || si.error")
s=s.replace("    if (!xd.error) setTemplateDefaults((xd.data||[]) as ExecutionTemplateDefault[])\n", "    if (!xd.error) setTemplateDefaults((xd.data||[]) as ExecutionTemplateDefault[])\n    if (!ps.error) setProductSheets(ps.data||[])\n    if (!si.error) setStrategyItems(si.data||[])\n")

old="""  useEffect(()=>{
    projects.forEach(p=>{
      if(p.status==='已結案') return
      const is1688=(p.project_kind||'brand')==='1688'
      const list=is1688 ? tasks.filter(t=>t.project_id===p.id) : executionTasks.filter(t=>t.project_id===p.id&&t.status!=='不適用')
      if(list.length>0 && list.every(t=>isDone(t.status))) updateProject(p.id,{status:'已結案'})
    })
  },[tasks,executionTasks])"""
new="""  useEffect(()=>{
    projects.forEach(p=>{
      if(p.status==='已結案') return
      const is1688=(p.project_kind||'brand')==='1688'
      const list=is1688 ? tasks.filter(t=>t.project_id===p.id) : executionTasks.filter(t=>t.project_id===p.id&&t.status!=='不適用')
      const productReady=is1688 || productSheets.some(x=>x.project_id===p.id&&x.completed)
      const strategyForProject=strategyItems.filter(x=>x.project_id===p.id)
      const strategyReady=is1688 || strategyForProject.length===0 || strategyForProject.every(x=>x.source_status==='已確認')
      if(list.length>0 && list.every(t=>isDone(t.status)) && productReady && strategyReady) updateProject(p.id,{status:'已結案'})
    })
  },[tasks,executionTasks,productSheets,strategyItems])"""
if old not in s: raise SystemExit('auto-close anchor missing')
s=s.replace(old,new)

anchor="""  const overdueProjectCount=(list:Project[])=>list.filter(projectIsOverdue).length
"""
insert="""  const productDataDone=(projectId:number)=>productSheets.some(x=>x.project_id===projectId&&x.completed)
  const strategyDecisionProgress=(projectId:number)=>{const list=strategyItems.filter(x=>x.project_id===projectId);return {total:list.length,done:list.filter(x=>x.source_status==='已確認').length,complete:list.length>0&&list.every(x=>x.source_status==='已確認')}}
"""
s=s.replace(anchor,anchor+insert)

# browser history for project detail state
old2="""  function openDashboardTask(t:{id:number;project_id:number;container_id:number|null;source:'策略'|'執行'}) {
    setFocusTask({source:t.source,id:t.id,project_id:t.project_id,container_id:t.container_id})"""
new2="""  useEffect(()=>{const onPop=()=>{setFocusTask(null);setSelectedProjectId(null)};window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[])
  function openProject(projectId:number){window.history.pushState({projectId},'',`?project=${projectId}`);setSelectedProjectId(projectId)}
  function closeProject(){if(new URLSearchParams(window.location.search).has('project')) window.history.back(); else {setFocusTask(null);setSelectedProjectId(null)}}

  function openDashboardTask(t:{id:number;project_id:number;container_id:number|null;source:'策略'|'執行'}) {
    window.history.pushState({projectId:t.project_id},'',`?project=${t.project_id}`)
    setFocusTask({source:t.source,id:t.id,project_id:t.project_id,container_id:t.container_id})"""
if old2 not in s: raise SystemExit('open task anchor missing')
s=s.replace(old2,new2)

s=s.replace("onBack={()=>{setFocusTask(null);setSelectedProjectId(null)}}", "onBack={closeProject}")
s=s.replace("onClick={()=>{setSelectedProjectId(p.id);const first=stages.find(s=>s.project_id===p.id)?.id;if(first)setExpanded({[first]:true})}}", "onClick={()=>{openProject(p.id);const first=stages.find(s=>s.project_id===p.id)?.id;if(first)setExpanded({[first]:true})}}")

# add milestone badges to project card footer after progress meter
needle="""<span>執行 {execProgress}%</span>"""
replacement="""<span>執行 {execProgress}%</span>{!is1688&&<><span className={productDataDone(p.id)?'milestone-ok':'milestone-pending'}>產品資料 {productDataDone(p.id)?'✓':'待完成'}</span>{(()=>{const sp=strategyDecisionProgress(p.id);return <span className={sp.complete?'milestone-ok':'milestone-pending'}>策略 {sp.total?`${sp.done}/${sp.total}`:'待建立'}</span>})()}</>}"""
if needle in s:s=s.replace(needle,replacement)

p.write_text(s)

css=Path('app/globals.css')
c=css.read_text()
if '.milestone-ok' not in c:
 c += "\n.milestone-ok,.milestone-pending{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:800}.milestone-ok{background:#edf8f1;color:#267a46}.milestone-pending{background:#fff7e6;color:#9a6b12}\n"
 css.write_text(c)
print('dashboard milestones v1 applied')
