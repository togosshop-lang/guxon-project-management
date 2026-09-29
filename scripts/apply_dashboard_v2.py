from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()

# Persist per-user preferred project type in browser.
s=s.replace("  const [kindFilter, setKindFilter] = useState('全部')", "  const [kindFilter, setKindFilter] = useState('全部')")
anchor="  const isManager=!REQUIRE_AUTH || !currentEmployee || currentEmployee.role==='manager' || currentEmployee.role==='admin'\n"
insert="""  const isManager=!REQUIRE_AUTH || !currentEmployee || currentEmployee.role==='manager' || currentEmployee.role==='admin'
  useEffect(()=>{
    if(!currentEmployee) return
    const saved=window.localStorage.getItem(`guxon-default-kind-${currentEmployee.id}`)
    if(saved==='brand'||saved==='1688'||saved==='全部') setKindFilter(saved)
  },[currentEmployee?.id])
  function changeKindFilter(value:string) {
    setKindFilter(value)
    if(currentEmployee) window.localStorage.setItem(`guxon-default-kind-${currentEmployee.id}`,value)
  }
"""
if anchor in s: s=s.replace(anchor,insert,1)

# Auto-close projects once all applicable execution work is complete.
auto_anchor="  function openDashboardTask(t:{id:number;project_id:number;container_id:number|null;source:'策略'|'執行'}) {"
auto="""  useEffect(()=>{
    projects.forEach(p=>{
      if(p.status==='已結案') return
      const is1688=(p.project_kind||'brand')==='1688'
      const list=is1688 ? tasks.filter(t=>t.project_id===p.id) : executionTasks.filter(t=>t.project_id===p.id&&t.status!=='不適用')
      if(list.length>0 && list.every(t=>isDone(t.status))) updateProject(p.id,{status:'已結案'})
    })
  },[tasks,executionTasks])

  const projectIsOverdue=(p:Project)=>{
    if(p.status==='已結案') return false
    const is1688=(p.project_kind||'brand')==='1688'
    const list=is1688 ? tasks.filter(t=>t.project_id===p.id) : executionTasks.filter(t=>t.project_id===p.id&&t.status!=='不適用')
    return list.some(t=>t.due_date&&t.due_date<todayIso()&&!isDone(t.status))
  }
  const brandProjects=projects.filter(p=>(p.project_kind||'brand')==='brand')
  const p1688=projects.filter(p=>(p.project_kind||'brand')==='1688')
  const statusCount=(list:Project[],status:string)=>list.filter(p=>p.status===status).length
  const overdueProjectCount=(list:Project[])=>list.filter(projectIsOverdue).length
  const employeePerformance=employees.filter(e=>e.active).map(e=>{
    const assigned=executionTasks.filter(t=>t.assignee_id===e.id&&t.status!=='不適用')
    const currentOverdue=assigned.filter(t=>t.due_date&&t.due_date<todayIso()&&!isDone(t.status))
    const overdueDays=currentOverdue.reduce((sum,t)=>sum+Math.max(0,-daysFromToday(t.due_date!)),0)
    const done=assigned.filter(t=>isDone(t.status))
    const onTime=done.filter(t=>!t.due_date || (t.updated_at||'').slice(0,10)<=t.due_date).length
    return {employee:e,assigned:assigned.length,onTime,currentOverdue:currentOverdue.length,overdueDays,onTimeRate:done.length?Math.round(onTime/done.length*100):0}
  })

"""+auto_anchor
if auto_anchor in s: s=s.replace(auto_anchor,auto,1)

old="""    <div className=\"stats\">
      <Stat label=\"全部專案\" value={projects.length}/><Stat label=\"規劃中\" value={projects.filter(p=>p.status==='規劃中').length}/><Stat label=\"進行中\" value={projects.filter(p=>p.status==='進行中').length}/><Stat label=\"逾期任務\" value={overdue.length} danger={overdue.length>0}/><Stat label=\"卡關任務\" value={blocked.length} danger={blocked.length>0}/>
    </div>
"""
new="""    <section className=\"project-dashboard-v2\">
      <div className=\"project-status-row\"><b>品牌新品專案</b><Stat label=\"規劃中\" value={statusCount(brandProjects,'規劃中')}/><Stat label=\"進行中\" value={statusCount(brandProjects,'進行中')}/><Stat label=\"已逾期\" value={overdueProjectCount(brandProjects)} danger={overdueProjectCount(brandProjects)>0}/><Stat label=\"已結案\" value={statusCount(brandProjects,'已結案')}/></div>
      <div className=\"project-status-row\"><b>1688 新品</b><Stat label=\"進行中\" value={statusCount(p1688,'進行中')+statusCount(p1688,'規劃中')}/><Stat label=\"已逾期\" value={overdueProjectCount(p1688)} danger={overdueProjectCount(p1688)>0}/><Stat label=\"已結案\" value={statusCount(p1688,'已結案')}/></div>
    </section>
"""
if old not in s: raise SystemExit('stats block not found')
s=s.replace(old,new,1)

old2="""      <div className=\"panel\"><div className=\"panel-head\"><b>整體任務</b></div><div className=\"summary-list\"><span>完成 <b>{dashboardItems.filter(t=>isDone(t.status)).length}</b></span><span>進行中 <b>{dashboardItems.filter(t=>t.status==='進行中').length}</b></span><span>待審 <b>{dashboardItems.filter(t=>t.status==='待審').length}</b></span><span>未開始 <b>{dashboardItems.filter(t=>t.status==='未開始').length}</b></span></div></div>
"""
new2="""      <div className=\"panel\"><div className=\"panel-head\"><b>團隊工作狀況</b><small>逾期天數供管理與績效參考</small></div><div className=\"team-performance\">{employeePerformance.map(x=><div className=\"performance-row\" key={x.employee.id}><b>{x.employee.name}</b><span>準時率 {x.onTimeRate}%</span><span>目前逾期 {x.currentOverdue}</span><span className={x.overdueDays>0?'danger-text':''}>累計逾期 {x.overdueDays} 天</span></div>)}</div></div>
"""
if old2 not in s: raise SystemExit('summary block not found')
s=s.replace(old2,new2,1)

s=s.replace("<select value={kindFilter} onChange={e=>setKindFilter(e.target.value)}>","<select value={kindFilter} onChange={e=>changeKindFilter(e.target.value)}>",1)

p.write_text(s)
print('dashboard v2 applied')
