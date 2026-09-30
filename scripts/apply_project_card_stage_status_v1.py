from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()
old="""  const projectIsOverdue=(p:Project)=>{
    if(p.status==='已結案') return false
    const is1688=(p.project_kind||'brand')==='1688'
    const list=is1688 ? tasks.filter(t=>t.project_id===p.id) : executionTasks.filter(t=>t.project_id===p.id&&t.status!=='不適用')
    return list.some(t=>t.due_date&&t.due_date<todayIso()&&!isDone(t.status))
  }"""
new="""  const projectIsOverdue=(p:Project)=>{
    if(p.status==='已結案') return false
    const is1688=(p.project_kind||'brand')==='1688'
    const list=is1688 ? tasks.filter(t=>t.project_id===p.id) : executionTasks.filter(t=>t.project_id===p.id&&t.status!=='不適用')
    const taskOverdue=list.some(t=>t.due_date&&t.due_date<todayIso()&&!isDone(t.status))
    if(is1688) return taskOverdue
    const strategyDue=(p as any).strategy_due_date
    const strategyOverdue=!!strategyDue && strategyDue<todayIso() && !(p as any).strategy_completed
    return taskOverdue || strategyOverdue
  }"""
assert old in s
p.write_text(s.replace(old,new))
