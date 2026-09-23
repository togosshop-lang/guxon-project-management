'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase'
import { STANDARD_TEMPLATE } from '@/src/lib/template'
import { EXECUTION_TEMPLATE, EXECUTION_TASK_COUNT } from '@/src/lib/execution-template'
import { addDays, dLabel, daysFromToday, todayIso } from '@/src/lib/date'
import type { Employee, ExecutionSection, ExecutionTask, ExecutionTemplateDefault, Project, Stage, StageGate, Task } from '@/src/lib/types'

const TASK_STATUS = ['未開始', '進行中', '待審', '已完成', '卡關']
const EXECUTION_STATUS = ['未開始', '進行中', '待審', '已完成', '卡關', '不適用']
const PRIORITIES = ['高', '中', '低']
const PROJECT_STATUS = ['規劃中', '進行中', '已上市', '已結案', '暫停']
const BUDGETS = ['', '保守測試 3–5 萬', '標準上市 8–15 萬', '加速放大 20–30 萬+']
const PROJECT_TYPES = ['', '小額測試', '完整上市', '放大期']
const STRATEGY_MODES = [
  { value:'none', label:'不使用策略', description:'不建立策略任務，只建立新品執行管理。' },
  { value:'simple', label:'簡易策略', description:'建立約 10 項核心策略工作，適合一般新品快速上市。' },
  { value:'full', label:'完整策略', description:'建立完整 6 階段／41 項策略工作。' },
] as const

const SIMPLE_STRATEGY_TEMPLATE = [
  {
    name:'商品定位',
    description:'快速確認商品定位與市場基本條件',
    tasks:[
      { title:'確認目標客群', description:'確認這個商品主要賣給誰，以及最核心的使用情境。', ownerDepartment:'行銷', dueOffset:-45 },
      { title:'確認核心賣點', description:'整理最重要的 1～3 個購買理由與差異化。', ownerDepartment:'行銷', dueOffset:-42 },
      { title:'競品／市場簡易確認', description:'快速確認主要競品、價格帶與市場常見賣點。', ownerDepartment:'行銷', dueOffset:-40 },
    ]
  },
  {
    name:'商業策略',
    description:'確認價格與主要銷售通路',
    tasks:[
      { title:'確認正式售價', description:'確認正式售價、團購／活動價格與基本毛利條件。', ownerDepartment:'負責人', dueOffset:-35 },
      { title:'確認通路策略', description:'確認官網、蝦皮、經銷、團購等主要銷售方式。', ownerDepartment:'負責人', dueOffset:-32 },
    ]
  },
  {
    name:'行銷準備',
    description:'確認上市主要溝通與素材方向',
    tasks:[
      { title:'確認主打溝通方向', description:'確認上市時最主要要對消費者說什麼。', ownerDepartment:'行銷', dueOffset:-28 },
      { title:'確認素材需求', description:'確認商品圖、影片、KOL、社群等素材需求。', ownerDepartment:'行銷', dueOffset:-25 },
      { title:'確認上市活動', description:'確認首發優惠、組合、贈品或其他上市活動。', ownerDepartment:'行銷', dueOffset:-18 },
    ]
  },
  {
    name:'上市確認',
    description:'上市前後快速確認',
    tasks:[
      { title:'上市前最終確認', description:'確認商品頁、庫存、價格、素材與通路都已準備完成。', ownerDepartment:'負責人', dueOffset:-3 },
      { title:'上市成效追蹤', description:'上市後追蹤銷售、廣告與消費者反應，確認是否需要調整。', ownerDepartment:'行銷', dueOffset:7 },
    ]
  },
]

const SIMPLE_1688_TASKS = [
  { title:'到貨清點', description:'確認到貨數量、款式、顏色與外觀是否正常。', dueOffset:-14 },
  { title:'貨號建立', description:'建立內部貨號／SKU，確認品名與規格。', dueOffset:-10 },
  { title:'美編設計', description:'完成商品主圖、規格圖與銷售所需基本圖片。', dueOffset:-7 },
  { title:'產品上架', description:'完成銷售平台商品建立、售價與基本資訊設定。', dueOffset:-2 },
  { title:'已入庫至平台', description:'確認庫存已入庫並可正常銷售／出貨。', dueOffset:0 },
]
const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true'

type NewProjectForm = {
  name:string; version:string; owner_id:string; launch_date:string; retail_price:string; group_price:string;
  status:string; budget_version:string; project_type:string; project_kind:'brand'|'1688'; success_goal:string;
  product_url:string; notes:string; strategy_mode:'none'|'simple'|'full'
}
type TaskInsert = Omit<Task, 'id'|'created_at'|'updated_at'>
type GateInsert = Omit<StageGate, 'id'>
type ExecutionTaskInsert = Omit<ExecutionTask, 'id'|'created_at'|'updated_at'|'depends_on_task_id'> & { depends_on_task_id?: number | null }

function isDone(status: string) { return status === '已完成' || status === '完成' }
function isExecutionDone(status: string) { return isDone(status) || status === '不適用' }
function countsInExecutionProgress(status: string) { return status !== '不適用' }

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!REQUIRE_AUTH)
  const [projects, setProjects] = useState<Project[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [gates, setGates] = useState<StageGate[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [executionSections, setExecutionSections] = useState<ExecutionSection[]>([])
  const [executionTasks, setExecutionTasks] = useState<ExecutionTask[]>([])
  const [templateDefaults, setTemplateDefaults] = useState<ExecutionTemplateDefault[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dashboard'|'employees'|'template'>('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [kindFilter, setKindFilter] = useState('全部')
  const [assigneeFilter, setAssigneeFilter] = useState('全部')
  const [attentionProjectFilter, setAttentionProjectFilter] = useState('全部')
  const [showNewProject, setShowNewProject] = useState(false)
  const [editingDashboardTask, setEditingDashboardTask] = useState<{source:'策略'|'執行';id:number}|null>(null)
  const [focusTask, setFocusTask] = useState<{source:'策略'|'執行';id:number;project_id:number;container_id:number|null}|null>(null)
  const [newProject, setNewProject] = useState<NewProjectForm>({
    name:'', version:'v1.0', owner_id:'', launch_date:'', retail_price:'', group_price:'',
    status:'規劃中', budget_version:'', project_type:'', project_kind:'brand', success_goal:'',
    product_url:'', notes:'', strategy_mode:'simple'
  })

  useEffect(() => {
    if (!REQUIRE_AUTH) return
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setAuthReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authReady || (REQUIRE_AUTH && !session)) return
    loadAll()
    const channel = supabase.channel('guxon-formal-v1')
      .on('postgres_changes', {event:'*',schema:'public',table:'projects'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'stages'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'tasks'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'stage_gates'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'employees'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'execution_sections'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'execution_tasks'}, () => loadAll(false))
      .on('postgres_changes', {event:'*',schema:'public',table:'execution_template_defaults'}, () => loadAll(false))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authReady, session])

  async function loadAll(showLoading = true) {
    if (showLoading) setLoading(true)
    const [p,s,t,g,e,xs,xt,xd] = await Promise.all([
      supabase.from('projects').select('*').order('id',{ascending:false}),
      supabase.from('stages').select('*').order('sort_order'),
      supabase.from('tasks').select('*').order('sort_order'),
      supabase.from('stage_gates').select('*').order('sort_order'),
      supabase.from('employees').select('*').order('id'),
      supabase.from('execution_sections').select('*').order('sort_order'),
      supabase.from('execution_tasks').select('*').order('sort_order'),
      supabase.from('execution_template_defaults').select('*').order('task_title'),
    ])
    const err = p.error || s.error || t.error || g.error || e.error || xs.error || xt.error || xd.error
    if (err) console.error(err)
    if (!p.error) setProjects((p.data||[]) as Project[])
    if (!s.error) setStages((s.data||[]) as Stage[])
    if (!t.error) setTasks((t.data||[]) as Task[])
    if (!g.error) setGates((g.data||[]) as StageGate[])
    if (!e.error) setEmployees((e.data||[]) as Employee[])
    if (!xs.error) setExecutionSections((xs.data||[]) as ExecutionSection[])
    if (!xt.error) setExecutionTasks((xt.data||[]) as ExecutionTask[])
    if (!xd.error) setTemplateDefaults((xd.data||[]) as ExecutionTemplateDefault[])
    setLoading(false)
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null
  const projectStages = selectedProject ? stages.filter(s=>s.project_id===selectedProject.id) : []
  const projectTasks = selectedProject ? tasks.filter(t=>t.project_id===selectedProject.id) : []
  const projectGates = selectedProject ? gates.filter(g=>g.project_id===selectedProject.id) : []
  const projectExecutionSections = selectedProject ? executionSections.filter(s=>s.project_id===selectedProject.id) : []
  const projectExecutionTasks = selectedProject ? executionTasks.filter(t=>t.project_id===selectedProject.id) : []

  function employeeName(id:number|null) { return employees.find(e=>e.id===id)?.name || '未指派' }
  function projectTaskList(projectId:number) { return tasks.filter(t=>t.project_id===projectId) }
  function stageTasks(stageId:number) { return tasks.filter(t=>t.stage_id===stageId) }
  function taskProgress(list:Task[]) { return list.length ? Math.round(list.filter(t=>isDone(t.status)).length/list.length*100) : 0 }
  function executionTaskList(projectId:number) { return executionTasks.filter(t=>t.project_id===projectId) }
  function executionProgress(list:ExecutionTask[]) {
    const active=list.filter(t=>countsInExecutionProgress(t.status))
    return active.length ? Math.round(active.filter(t=>isDone(t.status)).length/active.length*100) : 0
  }

  async function updateTask(id:number, patch:Partial<Task>) {
    const {error}=await supabase.from('tasks').update({...patch,updated_at:new Date().toISOString()}).eq('id',id)
    if(error) return alert('更新失敗：'+error.message)
    setTasks(cur=>cur.map(t=>t.id===id?{...t,...patch}:t))
  }
  async function updateProject(id:number, patch:Partial<Project>) {
    const {error}=await supabase.from('projects').update(patch).eq('id',id)
    if(error) return alert('更新失敗：'+error.message)
    setProjects(cur=>cur.map(p=>p.id===id?{...p,...patch}:p))
  }
  async function updateStage(id:number, patch:Partial<Stage>) {
    const {error}=await supabase.from('stages').update(patch).eq('id',id)
    if(error) return alert('更新失敗：'+error.message)
    setStages(cur=>cur.map(s=>s.id===id?{...s,...patch}:s))
  }
  async function toggleGate(gate:StageGate, checked:boolean) {
    const {error}=await supabase.from('stage_gates').update({checked}).eq('id',gate.id)
    if(error) return alert('更新失敗：'+error.message)
    setGates(cur=>cur.map(g=>g.id===gate.id?{...g,checked}:g))
  }

  function departmentAssignee(dept:string, ownerId:number|null) {
    if (dept==='負責人' && ownerId) return ownerId
    const exact=employees.find(e=>e.active && e.department===dept)
    return exact?.id || null
  }

  async function createExecutionTemplate(project:Project, silent=false) {
    const existing=executionSections.filter(s=>s.project_id===project.id)
    if(existing.length) {
      if(!silent) alert('這個專案已經有新品執行模板。')
      return true
    }
    const {data:createdSections,error:sectionError}=await supabase.from('execution_sections').insert(
      EXECUTION_TEMPLATE.map((section,i)=>({project_id:project.id,section_number:i+1,name:section.name,description:section.description,sort_order:i+1}))
    ).select()
    if(sectionError||!createdSections) { alert('建立執行模組失敗：'+(sectionError?.message||'未知錯誤')); return false }

    const sectionByNumber=new Map<number,ExecutionSection>()
    ;(createdSections as ExecutionSection[]).forEach(section=>sectionByNumber.set(section.section_number,section))
    const rows:ExecutionTaskInsert[]=[]
    EXECUTION_TEMPLATE.forEach((sectionTpl,i)=>{
      const section=sectionByNumber.get(i+1)
      if(!section) return
      sectionTpl.tasks.forEach((task,j)=>{
        const preset=templateDefaults.find(d=>d.task_title===task.title && ((d as any).project_kind||'brand')==='brand')
        if(preset && !preset.enabled) return
        const startOffset=(preset as any)?.default_start_offset ?? task.startOffset
        const dueOffset=(preset as any)?.default_due_offset ?? task.dueOffset
        rows.push({
        project_id:project.id, section_id:section.id, title:task.title, description:task.description,
        assignee_id:preset?.default_assignee_id ?? departmentAssignee(task.department,project.owner_id),
        reviewer_id:preset?.default_reviewer_id ?? (task.reviewerDepartment?departmentAssignee(task.reviewerDepartment,project.owner_id):null),
        status:'未開始', priority:preset?.default_priority || task.priority,
        start_date:project.launch_date?addDays(project.launch_date,startOffset):null,
        due_date:project.launch_date?addDays(project.launch_date,dueOffset):null,
        start_offset:startOffset, due_offset:dueOffset, note:null, sort_order:j+1, depends_on_task_id:null,
      })})
    })
    const {data:createdTasks,error:taskError}=await supabase.from('execution_tasks').insert(rows).select()
    if(taskError||!createdTasks) { alert('建立執行工作失敗：'+(taskError?.message||'未知錯誤')); return false }

    const taskByTitle=new Map<string,ExecutionTask>()
    ;(createdTasks as ExecutionTask[]).forEach(task=>taskByTitle.set(task.title.trim(),task))
    const dependencyUpdates:PromiseLike<unknown>[]=[]
    EXECUTION_TEMPLATE.forEach(section=>section.tasks.forEach(task=>{
      if(!task.dependencyTitle) return
      const target=taskByTitle.get(task.title.trim())
      const dependency=taskByTitle.get(task.dependencyTitle.trim())
      if(target&&dependency) dependencyUpdates.push(supabase.from('execution_tasks').update({depends_on_task_id:dependency.id}).eq('id',target.id))
    }))
    await Promise.all(dependencyUpdates)
    await loadAll(false)
    if(!silent) alert(`新品執行模板建立完成：9 大工作區、${EXECUTION_TASK_COUNT} 個標準工作項目。`)
    return true
  }

  async function updateExecutionTask(id:number, patch:Partial<ExecutionTask>) {
    const {error}=await supabase.from('execution_tasks').update({...patch,updated_at:new Date().toISOString()}).eq('id',id)
    if(error) return alert('更新失敗：'+error.message)
    setExecutionTasks(cur=>cur.map(t=>t.id===id?{...t,...patch}:t))
  }

  async function addExecutionTask(sectionId:number) {
    if(!selectedProject) return
    const title=prompt('工作項目名稱')?.trim(); if(!title) return
    const current=executionTasks.filter(t=>t.section_id===sectionId)
    const {data,error}=await supabase.from('execution_tasks').insert({
      project_id:selectedProject.id, section_id:sectionId, title, status:'未開始', priority:'中', sort_order:current.length+1
    }).select().single()
    if(error) return alert('新增失敗：'+error.message)
    setExecutionTasks(cur=>[...cur,data as ExecutionTask])
  }

  async function deleteExecutionTask(id:number) {
    if(!confirm('確定刪除這個執行工作項目？')) return
    const {error}=await supabase.from('execution_tasks').delete().eq('id',id)
    if(error) return alert('刪除失敗：'+error.message)
    setExecutionTasks(cur=>cur.filter(t=>t.id!==id).map(t=>t.depends_on_task_id===id?{...t,depends_on_task_id:null}:t))
  }

  async function rescheduleExecution(project:Project) {
    if(!project.launch_date) return alert('請先設定上市日 D0。')
    const list=executionTasks.filter(t=>t.project_id===project.id)
    if(!list.length) return alert('目前還沒有新品執行模板。')
    if(!confirm(`依新的上市日 ${project.launch_date} 重新計算 ${list.length} 個執行工作的開始日與截止日？\n\n手動修改過的日期也會被 D-Day 規則重新計算。`)) return
    const results=await Promise.all(list.map(t=>supabase.from('execution_tasks').update({
      start_date:t.start_offset===null?t.start_date:addDays(project.launch_date,t.start_offset), due_date:t.due_offset===null?t.due_date:addDays(project.launch_date,t.due_offset), updated_at:new Date().toISOString()
    }).eq('id',t.id)))
    const failed=results.find(r=>r.error)
    if(failed?.error) return alert('重新排程失敗：'+failed.error.message)
    await loadAll(false)
    alert('新品執行工作已依上市日重新排程。')
  }

  async function create1688Template(project:Project, ownerId:number|null) {
    const presets=(templateDefaults as any[]).filter(d=>(d.project_kind||'brand')==='1688' && d.enabled!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
    const source=presets.length ? presets.map((d,i)=>({
      title:d.task_title, description:d.task_description||null, assignee_id:d.default_assignee_id??ownerId,
      priority:d.default_priority||'中', sort_order:d.sort_order||((i+1)*10),
      dueOffset:SIMPLE_1688_TASKS.find(x=>x.title===d.task_title)?.dueOffset ?? 0,
    })) : SIMPLE_1688_TASKS.map((task,i)=>({title:task.title,description:task.description,assignee_id:ownerId,priority:'中',sort_order:(i+1)*10,dueOffset:task.dueOffset}))
    const {data:stage,error:stageError}=await supabase.from('stages').insert({
      project_id:project.id, stage_number:1, name:'1688 新品上架流程',
      description:'依「執行模板設定」中的 1688 新品模板自動建立。',
      status:'未開始', sort_order:1, approval_note:null,
    }).select().single()
    if(stageError||!stage) return {error:stageError?.message||'建立 1688 流程失敗'}
    const rows:TaskInsert[]=source.map((task,i)=>({
      project_id:project.id, stage_id:stage.id, title:task.title, description:task.description,
      assignee_id:task.assignee_id, status:'未開始', due_offset:task.dueOffset,
      due_date:project.launch_date?addDays(project.launch_date,task.dueOffset):null, note:null, sort_order:i+1,
    }))
    const {error}=await supabase.from('tasks').insert(rows)
    return {error:error?.message||null}
  }

  async function createProject() {
    if(!newProject.name.trim()) return alert('請輸入專案名稱')
    const ownerId = newProject.owner_id ? Number(newProject.owner_id) : null
    const {data:project,error}=await supabase.from('projects').insert({
      name:newProject.name.trim(), version:newProject.version||null, owner_id:ownerId,
      launch_date:newProject.launch_date||null,
      retail_price:newProject.retail_price?Number(newProject.retail_price):null,
      group_price:newProject.group_price?Number(newProject.group_price):null,
      status:newProject.status, budget_version:newProject.budget_version||null,
      project_type:newProject.project_type||null, project_kind:newProject.project_kind, success_goal:newProject.success_goal||null,
      product_url:newProject.project_kind==='1688' ? (newProject.product_url||null) : null,
      notes:newProject.notes||null,
    }).select().single()
    if(error||!project) return alert('新增專案失敗：'+(error?.message||'未知錯誤'))

    if(newProject.project_kind==='1688') {
      const result=await create1688Template(project as Project,ownerId)
      if(result.error) return alert('建立 1688 流程失敗：'+result.error)
      setShowNewProject(false)
      setNewProject({name:'',version:'v1.0',owner_id:'',launch_date:'',retail_price:'',group_price:'',status:'規劃中',budget_version:'',project_type:'',project_kind:'brand',success_goal:'',product_url:'',notes:'',strategy_mode:'simple'})
      await loadAll(false)
      setSelectedProjectId(project.id)
      alert('1688 新品專案建立完成：已依目前的 1688 模板自動產生工作流程。')
      return
    }

    if(newProject.strategy_mode!=='none') {
      const strategyTemplate = newProject.strategy_mode==='full' ? STANDARD_TEMPLATE : SIMPLE_STRATEGY_TEMPLATE
      const {data:createdStages,error:stageError}=await supabase.from('stages').insert(
        strategyTemplate.map((s:any,i:number)=>({
          project_id:project.id,
          stage_number:i+1,
          name:s.name,
          description:newProject.strategy_mode==='full' ? `${s.range} ｜ ${s.description}` : s.description,
          status:'未開始',
          sort_order:i+1,
          approval_note:null,
        }))
      ).select()
      if(stageError||!createdStages) return alert('建立策略階段失敗：'+(stageError?.message||'未知錯誤'))

      const taskRows:TaskInsert[]=[]
      const gateRows:GateInsert[]=[]
      ;(createdStages as Stage[]).forEach((stage,i)=>{
        const tpl:any = strategyTemplate[i]
        tpl.tasks.forEach((task:any,j:number)=>taskRows.push({
          project_id:project.id,
          stage_id:stage.id,
          title:task.title,
          description:task.description,
          assignee_id:departmentAssignee(task.ownerDepartment,ownerId),
          status:'未開始',
          due_offset:task.dueOffset,
          due_date:project.launch_date?addDays(project.launch_date,task.dueOffset):null,
          note:null,
          sort_order:j+1,
        }))
        if(newProject.strategy_mode==='full') {
          tpl.gates.forEach((label:string,j:number)=>gateRows.push({
            project_id:project.id,stage_id:stage.id,label,checked:false,sort_order:j+1
          }))
        }
      })

      const taskResult=taskRows.length?await supabase.from('tasks').insert(taskRows):{error:null}
      const gateResult=gateRows.length?await supabase.from('stage_gates').insert(gateRows):{error:null}
      if(taskResult.error||gateResult.error) return alert('建立策略流程失敗：'+(taskResult.error?.message||gateResult.error?.message||''))
    }
    setShowNewProject(false)
    setNewProject({name:'',version:'v1.0',owner_id:'',launch_date:'',retail_price:'',group_price:'',status:'規劃中',budget_version:'',project_type:'',project_kind:'brand',success_goal:'',product_url:'',notes:'',strategy_mode:'simple'})
    await createExecutionTemplate(project as Project, true)
    await loadAll(false)
    setSelectedProjectId(project.id)
    const strategyLabel = newProject.strategy_mode==='full'
      ? '完整策略 6 階段／41 項工作'
      : newProject.strategy_mode==='simple'
        ? '簡易策略 4 階段／10 項工作'
        : '不建立策略工作'
    alert(`專案建立完成：${strategyLabel}；新品執行管理 9 大工作區／${EXECUTION_TASK_COUNT} 項工作。`)
  }

  async function upgradeSelectedProjectTemplate() {
    if (!selectedProject) return
    if (!confirm('要補齊完整標準模板嗎？\n\n不會刪除現有任務，只會新增缺少的標準任務與通關檢核。')) return
    const resolvedStages: Stage[] = []
    for (let i=0;i<STANDARD_TEMPLATE.length;i++) {
      const tpl=STANDARD_TEMPLATE[i]
      let stage=stages.find(x=>x.project_id===selectedProject.id && x.stage_number===i+1)
      if (!stage) {
        const {data,error}=await supabase.from('stages').insert({project_id:selectedProject.id,stage_number:i+1,name:tpl.name,description:`${tpl.range} ｜ ${tpl.description}`,status:'未開始',sort_order:i+1,approval_note:null}).select().single()
        if(error||!data) return alert('補齊階段失敗：'+(error?.message||''))
        stage=data as Stage
      }
      resolvedStages.push(stage)
    }
    const missingTasks:TaskInsert[]=[]; const missingGates:GateInsert[]=[]
    resolvedStages.forEach((stage,i)=>{
      const existingTasks=tasks.filter(t=>t.project_id===selectedProject.id&&t.stage_id===stage.id)
      const existingGates=gates.filter(g=>g.project_id===selectedProject.id&&g.stage_id===stage.id)
      STANDARD_TEMPLATE[i].tasks.forEach((task,j)=>{
        if(!existingTasks.some(t=>t.title.trim()===task.title.trim())) missingTasks.push({project_id:selectedProject.id,stage_id:stage.id,assignee_id:departmentAssignee(task.ownerDepartment,selectedProject.owner_id),title:task.title,description:task.description,status:'未開始',due_date:addDays(selectedProject.launch_date,task.dueOffset),due_offset:task.dueOffset,note:null,sort_order:existingTasks.length+j+1})
      })
      STANDARD_TEMPLATE[i].gates.forEach((label,j)=>{
        if(!existingGates.some(g=>g.label.trim()===label.trim())) missingGates.push({project_id:selectedProject.id,stage_id:stage.id,label,checked:false,sort_order:j+1})
      })
    })
    const [tr,gr]=await Promise.all([
      missingTasks.length?supabase.from('tasks').insert(missingTasks):Promise.resolve({error:null}),
      missingGates.length?supabase.from('stage_gates').insert(missingGates):Promise.resolve({error:null}),
    ])
    if(tr.error||gr.error) return alert('補齊模板失敗：'+(tr.error?.message||gr.error?.message||''))
    await loadAll(false)
    alert(`補齊完成：新增 ${missingTasks.length} 個標準任務、${missingGates.length} 個通關檢核。`)
  }

  async function addTask(stageId:number) {
    if(!selectedProject) return
    const title=prompt('工作項目名稱')?.trim(); if(!title) return
    const {data,error}=await supabase.from('tasks').insert({project_id:selectedProject.id,stage_id:stageId,title,status:'未開始',sort_order:stageTasks(stageId).length+1}).select().single()
    if(error) return alert('新增失敗：'+error.message)
    setTasks(cur=>[...cur,data as Task])
  }
  async function deleteTask(id:number) {
    if(!confirm('確定刪除此工作項目？')) return
    const {error}=await supabase.from('tasks').delete().eq('id',id)
    if(error) return alert('刪除失敗：'+error.message)
    setTasks(cur=>cur.filter(t=>t.id!==id))
  }
  async function deleteProject(project:Project) {
    if(!confirm(`確定刪除「${project.name}」？專案底下階段、任務與檢核也會一併刪除。`)) return
    const {error}=await supabase.from('projects').delete().eq('id',project.id)
    if(error) return alert('刪除失敗：'+error.message)
    setSelectedProjectId(null); await loadAll(false)
  }

  async function addEmployee() {
    const name=prompt('員工姓名')?.trim(); if(!name) return
    const department=prompt('部門／職務（例：行銷、設計、客服、倉管）')?.trim()||null
    const email=prompt('Email（可留白）')?.trim()||null
    const {data,error}=await supabase.from('employees').insert({name,department,email,role:'member',active:true}).select().single()
    if(error) return alert('新增失敗：'+error.message)
    setEmployees(cur=>[...cur,data as Employee])
  }
  async function updateEmployee(id:number, patch:Partial<Employee>) {
    const {error}=await supabase.from('employees').update(patch).eq('id',id)
    if(error) return alert('更新失敗：'+error.message)
    setEmployees(cur=>cur.map(e=>e.id===id?{...e,...patch}:e))
  }

  async function saveTemplateDefault(taskTitle:string, patch:Partial<ExecutionTemplateDefault> & Record<string,unknown>) {
    const kind=(patch.project_kind as string)||'brand'
    const current=(templateDefaults as any[]).find(d=>d.task_title===taskTitle && (d.project_kind||'brand')===kind)
    const payload={
      task_title:taskTitle,
      project_kind:kind,
      default_assignee_id:current?.default_assignee_id??null,
      default_reviewer_id:current?.default_reviewer_id??null,
      default_priority:current?.default_priority||'中',
      default_start_offset:current?.default_start_offset??null,
      default_due_offset:current?.default_due_offset??null,
      enabled:current?.enabled??true,
      ...patch,
      updated_at:new Date().toISOString(),
    }

    if(current?.id) {
      const {data,error}=await supabase
        .from('execution_template_defaults')
        .update(payload)
        .eq('id',current.id)
        .select()
        .single()
      if(error) return alert('模板設定更新失敗：'+error.message)
      setTemplateDefaults(cur=>[...cur.filter(x=>x.id!==current.id),data as ExecutionTemplateDefault])
      return
    }

    const {data,error}=await supabase
      .from('execution_template_defaults')
      .insert(payload)
      .select()
      .single()
    if(error) return alert('模板設定新增失敗：'+error.message)
    setTemplateDefaults(cur=>[...cur,data as ExecutionTemplateDefault])
  }

  async function add1688TemplateItem() {
    const title=prompt('新增 1688 模板工作項目名稱')?.trim(); if(!title) return
    if((templateDefaults as any[]).some(d=>(d.project_kind||'brand')==='1688'&&d.task_title===title)) return alert('這個工作項目已存在。')
    const list=(templateDefaults as any[]).filter(d=>(d.project_kind||'brand')==='1688')
    const sortOrder=Math.max(0,...list.map(d=>Number(d.sort_order)||0))+10
    const {data,error}=await supabase.from('execution_template_defaults').insert({task_title:title,project_kind:'1688',task_description:null,sort_order:sortOrder,default_assignee_id:null,default_reviewer_id:null,default_priority:'中',enabled:true,updated_at:new Date().toISOString()}).select().single()
    if(error) return alert('新增模板項目失敗：'+error.message)
    setTemplateDefaults(cur=>[...cur,data as ExecutionTemplateDefault])
  }

  async function delete1688TemplateItem(taskTitle:string) {
    if(!confirm(`確定從 1688 模板刪除「${taskTitle}」？\n\n只影響之後新建立的專案，既有專案不會被刪除。`)) return
    const {error}=await supabase.from('execution_template_defaults').delete().eq('task_title',taskTitle).eq('project_kind','1688')
    if(error) return alert('刪除模板項目失敗：'+error.message)
    setTemplateDefaults(cur=>cur.filter(x=>!(x.task_title===taskTitle&&((x as any).project_kind||'brand')==='1688')))
  }

  const filteredProjects=useMemo(()=>projects.filter(p=>{
    const q=query.trim().toLowerCase()
    return (!q||p.name.toLowerCase().includes(q)||(p.version||'').toLowerCase().includes(q)) && (statusFilter==='全部'||p.status===statusFilter) && (kindFilter==='全部'||(p.project_kind||'brand')===kindFilter)
  }),[projects,query,statusFilter,kindFilter])

  const currentEmployee=useMemo(()=>{
    if(!session?.user) return null
    const loginEmail=session.user.email?.toLowerCase()
    return employees.find(e=>e.auth_user_id===session.user.id) || (loginEmail ? employees.find(e=>(e.email||'').toLowerCase()===loginEmail) : null) || null
  },[session,employees])
  const isManager=!REQUIRE_AUTH || !currentEmployee || currentEmployee.role==='manager' || currentEmployee.role==='admin'
  const effectiveAssigneeFilter=!isManager && currentEmployee ? String(currentEmployee.id) : assigneeFilter
  const activeDashboardProjectIds=useMemo(()=>new Set(projects.filter(p=>p.status==='進行中'||p.status==='已上市').map(p=>p.id)),[projects])
  const dashboardStrategyTasks=useMemo(()=>tasks.filter(t=>activeDashboardProjectIds.has(t.project_id) && (effectiveAssigneeFilter==='全部'||String(t.assignee_id)===effectiveAssigneeFilter) && (attentionProjectFilter==='全部'||String(t.project_id)===attentionProjectFilter)),[tasks,activeDashboardProjectIds,effectiveAssigneeFilter,attentionProjectFilter])
  const dashboardExecutionTasks=useMemo(()=>executionTasks.filter(t=>activeDashboardProjectIds.has(t.project_id) && (effectiveAssigneeFilter==='全部'||String(t.assignee_id)===effectiveAssigneeFilter) && (attentionProjectFilter==='全部'||String(t.project_id)===attentionProjectFilter) && t.status!=='不適用'),[executionTasks,activeDashboardProjectIds,effectiveAssigneeFilter,attentionProjectFilter])
  const dashboardItems=useMemo(()=>[
    ...dashboardStrategyTasks.map(t=>({key:`s-${t.id}`,id:t.id,project_id:t.project_id,container_id:t.stage_id,title:t.title,due_date:t.due_date,assignee_id:t.assignee_id,status:t.status,source:'策略' as const})),
    ...dashboardExecutionTasks.map(t=>({key:`e-${t.id}`,id:t.id,project_id:t.project_id,container_id:t.section_id,title:t.title,due_date:t.due_date,assignee_id:t.assignee_id,status:t.status,source:'執行' as const})),
  ],[dashboardStrategyTasks,dashboardExecutionTasks])
  const overdue=dashboardItems.filter(t=>t.due_date && t.due_date<todayIso() && !isDone(t.status))
  const dueSoon=dashboardItems.filter(t=>t.due_date && !isDone(t.status) && daysFromToday(t.due_date)>=0 && daysFromToday(t.due_date)<=7)
  const blocked=dashboardItems.filter(t=>t.status==='卡關')
  const myTasks=useMemo(()=>{
    if(!currentEmployee) return []
    return [
      ...tasks.filter(t=>activeDashboardProjectIds.has(t.project_id) && t.assignee_id===currentEmployee.id && !isDone(t.status) && (attentionProjectFilter==='全部'||String(t.project_id)===attentionProjectFilter))
        .map(t=>({key:`my-s-${t.id}`,id:t.id,project_id:t.project_id,container_id:t.stage_id,title:t.title,due_date:t.due_date,assignee_id:t.assignee_id,status:t.status,source:'策略' as const})),
      ...executionTasks.filter(t=>activeDashboardProjectIds.has(t.project_id) && t.assignee_id===currentEmployee.id && !isDone(t.status) && t.status!=='不適用' && (attentionProjectFilter==='全部'||String(t.project_id)===attentionProjectFilter))
        .map(t=>({key:`my-e-${t.id}`,id:t.id,project_id:t.project_id,container_id:t.section_id,title:t.title,due_date:t.due_date,assignee_id:t.assignee_id,status:t.status,source:'執行' as const})),
    ].sort((a,b)=>{
      if(a.due_date&&b.due_date) return a.due_date.localeCompare(b.due_date)
      if(a.due_date) return -1
      if(b.due_date) return 1
      return a.title.localeCompare(b.title)
    })
  },[tasks,executionTasks,currentEmployee,attentionProjectFilter,activeDashboardProjectIds])
  function openDashboardTask(t:{id:number;project_id:number;container_id:number|null;source:'策略'|'執行'}) {
    setFocusTask({source:t.source,id:t.id,project_id:t.project_id,container_id:t.container_id})
    if(t.source==='策略' && t.container_id) setExpanded({[t.container_id]:true})
    setSelectedProjectId(t.project_id)
  }


  if(!authReady) return <Loading />
  if(REQUIRE_AUTH && !session) return <AuthScreen />
  if(loading) return <Loading />
  if(REQUIRE_AUTH && session && !currentEmployee) return <AccessDeniedScreen email={session.user.email||''} />
  if(view==='employees') return <EmployeeView employees={employees} onBack={()=>setView('dashboard')} onAdd={addEmployee} onUpdate={updateEmployee} />
  if(view==='template') return <TemplateSettingsView employees={employees} defaults={templateDefaults} onBack={()=>setView('dashboard')} onSave={saveTemplateDefault} onAdd1688={add1688TemplateItem} onDelete1688={delete1688TemplateItem} />
  if(selectedProject) return <ProjectView project={selectedProject} stages={projectStages} tasks={projectTasks} gates={projectGates} executionSections={projectExecutionSections} executionTasks={projectExecutionTasks} employees={employees} expanded={expanded} setExpanded={setExpanded} focusTask={focusTask} onBack={()=>{setFocusTask(null);setSelectedProjectId(null)}} onUpdateProject={updateProject} onUpdateTask={updateTask} onUpdateStage={updateStage} onToggleGate={toggleGate} onAddTask={addTask} onDeleteTask={deleteTask} onDeleteProject={deleteProject} onUpgradeTemplate={upgradeSelectedProjectTemplate} onCreateExecutionTemplate={()=>createExecutionTemplate(selectedProject)} onUpdateExecutionTask={updateExecutionTask} onAddExecutionTask={addExecutionTask} onDeleteExecutionTask={deleteExecutionTask} onRescheduleExecution={()=>rescheduleExecution(selectedProject)} />

  return <main className="page"><div className="shell">
    <Header right={REQUIRE_AUTH&&session?<div className="login-user"><span><b>{currentEmployee?.name||session.user.email}</b><small>{currentEmployee?.role||''}</small></span><button className="btn" onClick={()=>supabase.auth.signOut()}>登出</button></div>:null}/>
    <div className="page-title-row"><div><h1>新品管理平台</h1><p>品牌新品使用完整策略／執行流程；1688 新品使用簡化上架流程</p></div><div className="actions">{isManager&&<button className="btn" onClick={()=>setView('employees')}>員工管理</button>}{isManager&&<button className="btn" onClick={()=>setView('template')}>執行模板設定</button>}{isManager&&<button className="btn-primary" onClick={()=>setShowNewProject(true)}>＋ 新增專案</button>}</div></div>

    <div className="stats">
      <Stat label="全部專案" value={projects.length}/><Stat label="規劃中" value={projects.filter(p=>p.status==='規劃中').length}/><Stat label="進行中" value={projects.filter(p=>p.status==='進行中').length}/><Stat label="逾期任務" value={overdue.length} danger={overdue.length>0}/><Stat label="卡關任務" value={blocked.length} danger={blocked.length>0}/>
    </div>

    <section className="dashboard-grid">
      <div className="panel"><div className="panel-head"><b>需要關注</b><div className="attention-filters"><select value={attentionProjectFilter} onChange={e=>setAttentionProjectFilter(e.target.value)}><option value="全部">全部專案</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>{isManager?<select value={assigneeFilter} onChange={e=>setAssigneeFilter(e.target.value)}><option value="全部">全部員工</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>:<span className="viewer-chip">我的任務：{currentEmployee?.name||'目前帳號'}</span>}</div></div>
        <Attention title="逾期" items={overdue} employees={employees} projects={projects}/><Attention title="7 天內到期" items={dueSoon} employees={employees} projects={projects}/><Attention title="卡關" items={blocked} employees={employees} projects={projects}/>
        <MyTaskList items={myTasks} projects={projects} onOpen={t=>setEditingDashboardTask({source:t.source,id:t.id})}/>
      </div>
      <div className="panel"><div className="panel-head"><b>整體任務</b></div><div className="summary-list"><span>完成 <b>{dashboardItems.filter(t=>isDone(t.status)).length}</b></span><span>進行中 <b>{dashboardItems.filter(t=>t.status==='進行中').length}</b></span><span>待審 <b>{dashboardItems.filter(t=>t.status==='待審').length}</b></span><span>未開始 <b>{dashboardItems.filter(t=>t.status==='未開始').length}</b></span></div></div>
    </section>

    <div className="filters"><input placeholder="搜尋專案名稱或型號…" value={query} onChange={e=>setQuery(e.target.value)}/><select value={kindFilter} onChange={e=>setKindFilter(e.target.value)}><option value="全部">全部類型</option><option value="brand">GUXON 品牌新品</option><option value="1688">1688 新品</option></select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>全部</option>{PROJECT_STATUS.map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="project-list">{filteredProjects.map(p=>{
      const pt=projectTaskList(p.id), pct=taskProgress(pt), et=executionTaskList(p.id), ep=executionProgress(et), owner=employeeName(p.owner_id)
      const is1688=(p.project_kind||'brand')==='1688'
      return <button key={p.id} className={`project-card ${is1688?'project-card-1688':''}`} onClick={()=>{setSelectedProjectId(p.id);const first=stages.find(s=>s.project_id===p.id)?.id;if(first)setExpanded({[first]:true})}}><div className="project-top"><div><div className="project-heading-line"><h2>{p.name}</h2><span className={`kind-badge ${is1688?'kind-1688':'kind-brand'}`}>{is1688?'1688 新品':'品牌新品'}</span></div><p>{p.version||'-'} ・ 負責：{owner}</p></div><StatusPill text={p.status||'未設定'}/></div><div className="project-meta"><span>上市日 <b>{p.launch_date||'-'}</b></span><span>正式價 <b>NT$ {p.retail_price??'-'}</b></span><span>團購價 <b>NT$ {p.group_price??'-'}</b></span><span>{is1688?'簡易工作':'執行工作'} <b>{is1688?`${pt.filter(t=>isDone(t.status)).length}/${pt.length}`:`${et.filter(t=>isDone(t.status)).length}/${et.filter(t=>countsInExecutionProgress(t.status)).length}`}</b></span></div>{is1688?<div className="single-progress"><span>1688 上架進度 <b>{pct}%</b></span><div className="progress"><i style={{width:`${pct}%`}}/></div></div>:<div className="dual-progress"><div><span>策略管理 <b>{pct}%</b></span><div className="progress"><i style={{width:`${pct}%`}}/></div></div><div><span>執行管理 <b>{et.length?`${ep}%`:'尚未建立'}</b></span><div className="progress execution-progress"><i style={{width:`${ep}%`}}/></div></div></div>}</button>
    })}{!filteredProjects.length&&<div className="empty">目前沒有符合條件的專案</div>}</div>
    {showNewProject&&<NewProjectModal data={newProject} setData={setNewProject} employees={employees} onClose={()=>setShowNewProject(false)} onCreate={createProject}/>} 
    {editingDashboardTask&&<DashboardTaskModal source={editingDashboardTask.source} task={editingDashboardTask.source==='策略'?tasks.find(t=>t.id===editingDashboardTask.id)||null:executionTasks.find(t=>t.id===editingDashboardTask.id)||null} projects={projects} employees={employees} onClose={()=>setEditingDashboardTask(null)} onUpdateTask={updateTask} onUpdateExecutionTask={updateExecutionTask} onOpenProject={(projectId,containerId,source,id)=>{setEditingDashboardTask(null);openDashboardTask({project_id:projectId,container_id:containerId,source,id})}}/>}
  </div></main>
}

type ProjectViewProps = {
  project:Project; stages:Stage[]; tasks:Task[]; gates:StageGate[]; executionSections:ExecutionSection[]; executionTasks:ExecutionTask[]; employees:Employee[];
  expanded:Record<number,boolean>; setExpanded:(v:Record<number,boolean>|((c:Record<number,boolean>)=>Record<number,boolean>))=>void;
  focusTask:{source:'策略'|'執行';id:number;project_id:number;container_id:number|null}|null;
  onBack:()=>void; onUpdateProject:(id:number,p:Partial<Project>)=>void; onUpdateTask:(id:number,p:Partial<Task>)=>void;
  onUpdateStage:(id:number,p:Partial<Stage>)=>void; onToggleGate:(g:StageGate,c:boolean)=>void; onAddTask:(stageId:number)=>void;
  onDeleteTask:(id:number)=>void; onDeleteProject:(p:Project)=>void; onUpgradeTemplate:()=>void; onCreateExecutionTemplate:()=>void;
  onUpdateExecutionTask:(id:number,p:Partial<ExecutionTask>)=>void; onAddExecutionTask:(sectionId:number)=>void; onDeleteExecutionTask:(id:number)=>void;
  onRescheduleExecution:()=>void
}

function ProjectView(props:ProjectViewProps) {
  const [module,setModule]=useState<'strategy'|'execution'>(()=>props.focusTask?.source==='執行'?'execution':'strategy')
  useEffect(()=>{
    if(!props.focusTask) return
    if(props.focusTask.source==='執行' && (props.project.project_kind||'brand')!=='1688') setModule('execution')
    if(props.focusTask.source==='策略') setModule('strategy')
    const timer=setTimeout(()=>{
      const el=document.getElementById(`focus-${props.focusTask?.source}-${props.focusTask?.id}`)
      el?.scrollIntoView({behavior:'smooth',block:'center'})
    },180)
    return ()=>clearTimeout(timer)
  },[props.focusTask,props.project.project_kind])
  if((props.project.project_kind||'brand')==='1688') return <Simple1688ProjectView {...props}/>
  if(module==='execution') return <ExecutionProjectView {...props} onOpenStrategy={()=>setModule('strategy')}/>
  return <StrategyProjectView {...props} onOpenExecution={()=>setModule('execution')}/>
}

function StrategyProjectView(props:ProjectViewProps & {onOpenExecution:()=>void}) {
  const {project,stages,tasks,gates,employees,expanded,setExpanded}=props
  const pTasks=(sid:number)=>tasks.filter(t=>t.stage_id===sid); const pGates=(sid:number)=>gates.filter(g=>g.stage_id===sid)
  const progress=(sid:number)=>{const x=pTasks(sid);return x.length?Math.round(x.filter(t=>isDone(t.status)).length/x.length*100):0}
  const passed=(sid:number)=>{const t=pTasks(sid),g=pGates(sid);return t.length>0&&t.every(x=>isDone(x.status))&&(g.length===0||g.every(x=>x.checked))}
  const state=(sid:number)=>pTasks(sid).some(t=>t.status==='卡關')?'卡關':passed(sid)?'已通關':pTasks(sid).some(t=>t.status!=='未開始')?'進行中':'未開始'
  const overall=tasks.length?Math.round(tasks.filter(t=>isDone(t.status)).length/tasks.length*100):0
  const warnings:string[]=[]
  stages.forEach((s,i)=>{
    const ts=pTasks(s.id),gs=pGates(s.id)
    ts.filter(t=>t.status==='卡關').forEach(t=>warnings.push(`階段 ${s.stage_number}「${t.title}」目前卡關`))
    if(ts.length&&ts.every(t=>isDone(t.status))&&gs.some(g=>!g.checked)) warnings.push(`階段 ${s.stage_number} 任務已完成，但通關檢核尚未完成`)
    const next=stages[i+1]; if(next&&!passed(s.id)&&pTasks(next.id).some(t=>t.status!=='未開始')) warnings.push(`階段 ${next.stage_number} 已開始，但前一階段尚未通關`)
  })
  return <main className="page"><div className="shell"><Header/>
    <ProjectModuleTabs active="strategy" onStrategy={()=>{}} onExecution={props.onOpenExecution}/>
    <div className="toolbar"><button className="btn" onClick={props.onBack}>← 返回專案列表</button><button className="btn" onClick={()=>setExpanded(Object.fromEntries(stages.map(s=>[s.id,true])))}>展開全部</button><button className="btn" onClick={()=>setExpanded({})}>收合全部</button><button className="btn" onClick={()=>window.print()}>列印／存 PDF</button><button className="btn" onClick={props.onUpgradeTemplate}>補齊完整標準模板</button><button className="btn-danger" onClick={()=>props.onDeleteProject(project)}>刪除專案</button></div>
    <section className="meta-card"><div className="meta-grid">
      <Field label="專案名稱"><DebouncedInput value={project.name} onSave={v=>props.onUpdateProject(project.id,{name:v})}/></Field>
      <Field label="型號"><DebouncedInput value={project.version||''} onSave={v=>props.onUpdateProject(project.id,{version:v||null})}/></Field>
      <Field label="主要負責人"><select value={project.owner_id??''} onChange={e=>props.onUpdateProject(project.id,{owner_id:e.target.value?Number(e.target.value):null})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      <Field label="上市日 D0"><input type="date" value={project.launch_date||''} onChange={e=>props.onUpdateProject(project.id,{launch_date:e.target.value||null})}/></Field>
      <Field label="正式定價"><input type="number" value={project.retail_price??''} onChange={e=>props.onUpdateProject(project.id,{retail_price:e.target.value?Number(e.target.value):null})}/></Field>
      <Field label="團購／活動價"><input type="number" value={project.group_price??''} onChange={e=>props.onUpdateProject(project.id,{group_price:e.target.value?Number(e.target.value):null})}/></Field>
      <Field label="本輪預算版本"><select value={project.budget_version||''} onChange={e=>props.onUpdateProject(project.id,{budget_version:e.target.value||null})}>{BUDGETS.map(x=><option key={x} value={x}>{x||'未決定'}</option>)}</select></Field>
      <Field label="本輪性質"><select value={project.project_type||''} onChange={e=>props.onUpdateProject(project.id,{project_type:e.target.value||null})}>{PROJECT_TYPES.map(x=><option key={x} value={x}>{x||'未決定'}</option>)}</select></Field>
      <Field label="專案狀態"><select value={project.status||'規劃中'} onChange={e=>props.onUpdateProject(project.id,{status:e.target.value})}>{PROJECT_STATUS.map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="本輪成功定義" wide><DebouncedInput value={project.success_goal||''} onSave={v=>props.onUpdateProject(project.id,{success_goal:v||null})} placeholder="例：確認勝出素材與可放大通路"/></Field><Field label="備註" wide><DebouncedTextarea value={(project as any).notes||''} onSave={v=>props.onUpdateProject(project.id,{notes:v||null} as any)} placeholder="專案備註"/></Field>
    </div></section>
    <section className="overall"><div><b>策略管理進度</b><p>{tasks.filter(t=>isDone(t.status)).length}/{tasks.length} 項任務完成</p></div><strong>{overall}%</strong><div className="overall-bar"><i style={{width:`${overall}%`}}/></div></section>
    <div className="stage-cards">{stages.map(s=><button key={s.id} className={`stage-mini state-${state(s.id)}`} onClick={()=>setExpanded(c=>({...c,[s.id]:true}))}><small>STAGE {s.stage_number}</small><b>{s.name}</b><div className="mini-progress"><i style={{width:`${progress(s.id)}%`}}/></div><span>{pTasks(s.id).filter(t=>isDone(t.status)).length}/{pTasks(s.id).length} 任務 ・ 檢核 {pGates(s.id).filter(g=>g.checked).length}/{pGates(s.id).length}</span></button>)}</div>
    {warnings.length?<div className="alert danger"><b>需要處理（{warnings.length}）</b>{warnings.map((w,i)=><p key={i}>• {w}</p>)}</div>:<div className="alert ok"><b>目前沒有卡關項目</b><p>各階段依序推進中。</p></div>}
    <div className="stages">{stages.map(stage=>{
      const open=!!expanded[stage.id], label=state(stage.id), sp=progress(stage.id), ts=pTasks(stage.id), gs=pGates(stage.id)
      return <section key={stage.id} className={`stage state-${label}`}><button className="stage-head" onClick={()=>setExpanded(c=>({...c,[stage.id]:!open}))}><span className="stage-num">{stage.stage_number}</span><span className="stage-main"><b>{stage.name}</b><small>{stage.description||''}</small></span><StatusPill text={`${label} ${sp}%`}/><span>{open?'▲':'▼'}</span></button>{open&&<div className="stage-body"><div className="section-title"><b>工作項目</b><button onClick={()=>props.onAddTask(stage.id)}>＋ 新增工作項目</button></div><div className="table-wrap"><table><thead><tr><th>期程</th><th>任務</th><th>負責</th><th>狀態</th><th>備註／連結</th><th></th></tr></thead><tbody>{ts.map(task=><tr id={`focus-策略-${task.id}`} key={task.id} className={isDone(task.status)?'done-row':''}><td className="date-cell"><b>{dLabel(task.due_offset)}</b><input type="date" value={task.due_date||''} onChange={e=>props.onUpdateTask(task.id,{due_date:e.target.value||null})}/></td><td><DebouncedInput value={task.title} onSave={v=>props.onUpdateTask(task.id,{title:v})}/><DebouncedTextarea value={task.description||''} onSave={v=>props.onUpdateTask(task.id,{description:v||null})} placeholder="任務說明"/></td><td><select value={task.assignee_id??''} onChange={e=>props.onUpdateTask(task.id,{assignee_id:e.target.value?Number(e.target.value):null})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td><select className={`status-select s-${task.status}`} value={isDone(task.status)?'已完成':task.status} onChange={e=>props.onUpdateTask(task.id,{status:e.target.value})}>{TASK_STATUS.map(x=><option key={x}>{x}</option>)}</select></td><td><DebouncedInput value={task.note||''} onSave={v=>props.onUpdateTask(task.id,{note:v||null})} placeholder="備註／連結"/></td><td><button className="text-danger" onClick={()=>props.onDeleteTask(task.id)}>刪除</button></td></tr>)}</tbody></table></div>
        <div className="gate-box"><b>通關檢核 ── 未全部勾選不得進入下一階段</b><p>開始下一階段前，請先確認以下條件。</p>{gs.map(g=><label key={g.id} className="gate-line"><input type="checkbox" checked={g.checked} onChange={e=>props.onToggleGate(g,e.target.checked)}/><span>{g.label}</span></label>)}<div className={`verdict ${passed(stage.id)?'pass':'hold'}`}>{passed(stage.id)?'✓ 本階段已通關，可進入下一階段':`尚未通關：任務 ${ts.filter(t=>isDone(t.status)).length}/${ts.length}，檢核 ${gs.filter(g=>g.checked).length}/${gs.length}`}</div><Field label="階段核准備註"><DebouncedTextarea value={stage.approval_note||''} onSave={v=>props.onUpdateStage(stage.id,{approval_note:v||null})} placeholder="原始判斷 → 新發現 → 是否修正 → 影響哪些工作"/></Field></div>
      </div>}</section>
    })}</div>
  </div></main>
}

function Simple1688ProjectView(props:ProjectViewProps) {
  const {project,stages,tasks,employees}=props
  const stage=stages[0]
  const completed=tasks.filter(t=>isDone(t.status)).length
  const overall=tasks.length?Math.round(completed/tasks.length*100):0
  return <main className="page"><div className="shell"><Header/>
    <div className="simple-project-banner"><div><span className="kind-badge kind-1688">1688 新品</span><h1>{project.name}</h1><p>非品牌商品簡化上架流程</p></div><StatusPill text={project.status||'未設定'}/></div>
    <div className="toolbar"><button className="btn" onClick={props.onBack}>← 返回專案列表</button><button className="btn" onClick={()=>window.print()}>列印／存 PDF</button><button className="btn-danger" onClick={()=>props.onDeleteProject(project)}>刪除專案</button></div>
    <section className="meta-card"><div className="meta-grid"><Field label="專案名稱"><DebouncedInput value={project.name} onSave={v=>props.onUpdateProject(project.id,{name:v})}/></Field><Field label="型號"><DebouncedInput value={project.version||''} onSave={v=>props.onUpdateProject(project.id,{version:v||null})}/></Field><Field label="主要負責人"><select value={project.owner_id??''} onChange={e=>props.onUpdateProject(project.id,{owner_id:e.target.value?Number(e.target.value):null})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field><Field label="預計上架日"><input type="date" value={project.launch_date||''} onChange={e=>props.onUpdateProject(project.id,{launch_date:e.target.value||null})}/></Field><Field label="正式定價"><input type="number" value={project.retail_price??''} onChange={e=>props.onUpdateProject(project.id,{retail_price:e.target.value?Number(e.target.value):null})}/></Field><Field label="團購／活動價"><input type="number" value={project.group_price??''} onChange={e=>props.onUpdateProject(project.id,{group_price:e.target.value?Number(e.target.value):null})}/></Field><Field label="網址" wide><DebouncedInput value={(project as any).product_url||''} onSave={v=>props.onUpdateProject(project.id,{product_url:v||null} as any)} placeholder="https://..."/></Field><Field label="備註" wide><DebouncedTextarea value={(project as any).notes||''} onSave={v=>props.onUpdateProject(project.id,{notes:v||null} as any)} placeholder="專案備註"/></Field><Field label="專案狀態"><select value={project.status||'規劃中'} onChange={e=>props.onUpdateProject(project.id,{status:e.target.value})}>{PROJECT_STATUS.map(x=><option key={x}>{x}</option>)}</select></Field></div></section>
    <section className="overall simple-overall"><div><b>1688 新品上架進度</b><p>{completed}/{tasks.length} 項任務完成</p></div><strong>{overall}%</strong><div className="overall-bar"><i style={{width:`${overall}%`}}/></div></section>
    <section className="simple-flow-card"><div className="section-title"><div><b>{stage?.name||'1688 新品上架流程'}</b><p>依序完成下列工作即可完成此商品上架。</p></div>{stage&&<button onClick={()=>props.onAddTask(stage.id)}>＋ 新增工作項目</button>}</div><div className="table-wrap"><table><thead><tr><th>工作項目</th><th>負責人</th><th>截止日</th><th>處理狀態</th><th>備註／連結</th><th></th></tr></thead><tbody>{tasks.map(task=><tr id={`focus-策略-${task.id}`} key={task.id} className={isDone(task.status)?'done-row':''}><td><DebouncedInput value={task.title} onSave={v=>props.onUpdateTask(task.id,{title:v})}/><DebouncedTextarea value={task.description||''} onSave={v=>props.onUpdateTask(task.id,{description:v||null})} placeholder="任務說明"/></td><td><select value={task.assignee_id??''} onChange={e=>props.onUpdateTask(task.id,{assignee_id:e.target.value?Number(e.target.value):null})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td><input type="date" value={task.due_date||''} onChange={e=>props.onUpdateTask(task.id,{due_date:e.target.value||null})}/></td><td><select className={`status-select s-${task.status}`} value={isDone(task.status)?'已完成':task.status} onChange={e=>props.onUpdateTask(task.id,{status:e.target.value})}>{TASK_STATUS.map(x=><option key={x}>{x}</option>)}</select></td><td><DebouncedInput value={task.note||''} onSave={v=>props.onUpdateTask(task.id,{note:v||null})} placeholder="備註／連結"/></td><td><button className="text-danger" onClick={()=>props.onDeleteTask(task.id)}>刪除</button></td></tr>)}</tbody></table></div></section>
  </div></main>
}

function ExecutionProjectView(props:ProjectViewProps & {onOpenStrategy:()=>void}) {
  const {project,executionSections:sections,executionTasks:tasks,employees}=props
  const [expandedExec,setExpandedExec]=useState<Record<number,boolean>>(()=>props.focusTask?.source==='執行'&&props.focusTask.container_id?{[props.focusTask.container_id]:true}:sections[0]?{[sections[0].id]:true}:{})
  useEffect(()=>{
    if(props.focusTask?.source==='執行'&&props.focusTask.container_id) setExpandedExec(c=>({...c,[props.focusTask!.container_id!]:true}))
  },[props.focusTask])
  const sectionTasks=(sectionId:number)=>tasks.filter(t=>t.section_id===sectionId)
  const activeTasks=tasks.filter(t=>countsInExecutionProgress(t.status))
  const completed=activeTasks.filter(t=>isDone(t.status)).length
  const overall=activeTasks.length?Math.round(completed/activeTasks.length*100):0
  const overdue=activeTasks.filter(t=>t.due_date&&t.due_date<todayIso()&&!isDone(t.status))
  const blocked=activeTasks.filter(t=>t.status==='卡關')
  const dueSoon=activeTasks.filter(t=>t.due_date&&!isDone(t.status)&&daysFromToday(t.due_date)>=0&&daysFromToday(t.due_date)<=7)
  const dependency=(task:ExecutionTask)=>task.depends_on_task_id?tasks.find(t=>t.id===task.depends_on_task_id):undefined
  const dependencyBlocked=(task:ExecutionTask)=>{const dep=dependency(task);return !!dep&&!isExecutionDone(dep.status)}
  const sectionProgress=(sectionId:number)=>{
    const list=sectionTasks(sectionId).filter(t=>countsInExecutionProgress(t.status))
    return list.length?Math.round(list.filter(t=>isDone(t.status)).length/list.length*100):0
  }
  const sectionState=(sectionId:number)=>{
    const list=sectionTasks(sectionId)
    if(list.some(t=>t.status==='卡關')) return '卡關'
    const active=list.filter(t=>countsInExecutionProgress(t.status))
    if(active.length&&active.every(t=>isDone(t.status))) return '已完成'
    if(list.some(t=>t.status!=='未開始'&&t.status!=='不適用')) return '進行中'
    return '未開始'
  }

  return <main className="page"><div className="shell"><Header/>
    <ProjectModuleTabs active="execution" onStrategy={props.onOpenStrategy} onExecution={()=>{}}/>
    <div className="toolbar"><button className="btn" onClick={props.onBack}>← 返回專案列表</button><button className="btn" onClick={()=>setExpandedExec(Object.fromEntries(sections.map(s=>[s.id,true])))}>展開全部</button><button className="btn" onClick={()=>setExpandedExec({})}>收合全部</button><button className="btn" onClick={()=>window.print()}>列印／存 PDF</button>{sections.length?<button className="btn" onClick={props.onRescheduleExecution}>依上市日重新排程</button>:null}</div>

    <section className="execution-hero"><div><span>新品執行管理</span><h1>{project.name}</h1><p>{project.version||'-'} ・ 上市日 {project.launch_date||'尚未設定'} ・ 68 項標準跨部門工作流程</p></div><strong>{overall}%</strong></section>

    {!sections.length?<div className="empty execution-empty"><h2>尚未建立新品執行模板</h2><p>建立後會自動產生 9 大工作區、{EXECUTION_TASK_COUNT} 個標準工作項目，並依上市日排定開始日與截止日。</p><button className="btn-primary" onClick={props.onCreateExecutionTemplate}>建立新品執行模板</button></div>:<>
      <div className="stats execution-stats"><Stat label="執行工作" value={tasks.length}/><Stat label="已完成" value={completed}/><Stat label="7 天內到期" value={dueSoon.length} danger={dueSoon.length>0}/><Stat label="逾期／卡關" value={overdue.length+blocked.length} danger={overdue.length+blocked.length>0}/></div>
      <section className="overall"><div><b>新品執行進度</b><p>{completed}/{activeTasks.length} 項適用工作完成 ・ {tasks.filter(t=>t.status==='不適用').length} 項不適用</p></div><strong>{overall}%</strong><div className="overall-bar"><i style={{width:`${overall}%`}}/></div></section>
      {(overdue.length||blocked.length||dueSoon.length)?<div className="execution-alerts"><ExecutionAttention title="逾期" items={overdue} employees={employees}/><ExecutionAttention title="7 天內到期" items={dueSoon} employees={employees}/><ExecutionAttention title="卡關" items={blocked} employees={employees}/></div>:<div className="alert ok"><b>目前沒有執行異常</b><p>沒有逾期或卡關工作。</p></div>}
      <div className="execution-section-cards">{sections.map(section=><button key={section.id} className={`execution-mini state-${sectionState(section.id)}`} onClick={()=>setExpandedExec(c=>({...c,[section.id]:true}))}><small>WORK {section.section_number}</small><b>{section.name}</b><div className="mini-progress"><i style={{width:`${sectionProgress(section.id)}%`}}/></div><span>{sectionTasks(section.id).filter(t=>isDone(t.status)).length}/{sectionTasks(section.id).filter(t=>countsInExecutionProgress(t.status)).length} ・ {sectionProgress(section.id)}%</span></button>)}</div>

      <div className="execution-sections">{sections.map(section=>{
        const list=sectionTasks(section.id), open=!!expandedExec[section.id], state=sectionState(section.id), progress=sectionProgress(section.id)
        return <section key={section.id} className={`stage execution-section state-${state}`}><button className="stage-head" onClick={()=>setExpandedExec(c=>({...c,[section.id]:!open}))}><span className="stage-num">{section.section_number}</span><span className="stage-main"><b>{section.name}</b><small>{section.description||''}</small></span><StatusPill text={`${state} ${progress}%`}/><span>{open?'▲':'▼'}</span></button>{open&&<div className="stage-body"><div className="section-title"><b>執行工作項目</b><button onClick={()=>props.onAddExecutionTask(section.id)}>＋ 新增工作項目</button></div><div className="table-wrap"><table className="execution-table"><thead><tr><th>工作項目</th><th>負責</th><th>審核</th><th>開始</th><th>截止</th><th>優先</th><th>狀態</th><th>前置任務</th><th>備註／連結</th><th></th></tr></thead><tbody>{list.map(task=>{
          const dep=dependency(task); const depBlocked=dependencyBlocked(task)
          return <tr id={`focus-執行-${task.id}`} key={task.id} className={`${isDone(task.status)?'done-row':''} ${task.status==='不適用'?'na-row':''}`}><td className="execution-task-name"><DebouncedInput value={task.title} onSave={v=>props.onUpdateExecutionTask(task.id,{title:v})}/><DebouncedTextarea value={task.description||''} onSave={v=>props.onUpdateExecutionTask(task.id,{description:v||null})} placeholder="工作說明"/></td><td><select value={task.assignee_id??''} onChange={e=>props.onUpdateExecutionTask(task.id,{assignee_id:e.target.value?Number(e.target.value):null})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td><select value={task.reviewer_id??''} onChange={e=>props.onUpdateExecutionTask(task.id,{reviewer_id:e.target.value?Number(e.target.value):null})}><option value="">未指定</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td className="compact-date"><small>{dLabel(task.start_offset)}</small><input type="date" value={task.start_date||''} onChange={e=>props.onUpdateExecutionTask(task.id,{start_date:e.target.value||null})}/></td><td className="compact-date"><small>{dLabel(task.due_offset)}</small><input type="date" value={task.due_date||''} onChange={e=>props.onUpdateExecutionTask(task.id,{due_date:e.target.value||null})}/></td><td><select value={task.priority||'中'} onChange={e=>props.onUpdateExecutionTask(task.id,{priority:e.target.value})}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></td><td><select className={`status-select s-${task.status}`} value={isDone(task.status)?'已完成':task.status} onChange={e=>props.onUpdateExecutionTask(task.id,{status:e.target.value})}>{EXECUTION_STATUS.map(x=><option key={x}>{x}</option>)}</select></td><td className={depBlocked?'dependency-blocked':'dependency-ok'}><select value={task.depends_on_task_id??''} onChange={e=>props.onUpdateExecutionTask(task.id,{depends_on_task_id:e.target.value?Number(e.target.value):null})}><option value="">無</option>{tasks.filter(x=>x.id!==task.id).map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select>{dep&&<small>{depBlocked?'⚠ 前置尚未完成':'✓ 前置已完成'}</small>}</td><td><DebouncedInput value={task.note||''} onSave={v=>props.onUpdateExecutionTask(task.id,{note:v||null})} placeholder="備註／連結"/></td><td><button className="text-danger" onClick={()=>props.onDeleteExecutionTask(task.id)}>刪除</button></td></tr>
        })}</tbody></table></div></div>}</section>
      })}</div>
    </>}
  </div></main>
}

function ProjectModuleTabs({active,onStrategy,onExecution}:{active:'strategy'|'execution';onStrategy:()=>void;onExecution:()=>void}) {
  return <div className="module-tabs"><button className={active==='strategy'?'active':''} onClick={onStrategy}><span>01</span><b>新品策略管理</b><small>市場判斷・受眾・定價・上市策略</small></button><button className={active==='execution'?'active':''} onClick={onExecution}><span>02</span><b>新品執行管理</b><small>拍攝・條碼・ERP・商品頁・行銷・上架</small></button></div>
}

function ExecutionAttention({title,items,employees}:{title:string;items:ExecutionTask[];employees:Employee[]}) { if(!items.length)return null;return <div className="attention execution-attention"><b>{title}（{items.length}）</b>{items.slice(0,8).map(t=><p key={t.id}>• {t.title} <small>{t.due_date||''} ・ {employees.find(e=>e.id===t.assignee_id)?.name||'未指派'}</small></p>)}</div> }

function offsetPhase(value:number|null|undefined) { return (value??0) > 0 ? 'after' : 'before' }
function offsetDays(value:number|null|undefined) { return Math.abs(Number(value??0)) }
function makeOffset(phase:string, days:number) { return phase==='after' ? Math.abs(days) : -Math.abs(days) }

function TemplateSettingsView({employees,defaults,onBack,onSave,onAdd1688,onDelete1688}:{employees:Employee[];defaults:ExecutionTemplateDefault[];onBack:()=>void;onSave:(title:string,p:Partial<ExecutionTemplateDefault>&Record<string,unknown>)=>void;onAdd1688:()=>void;onDelete1688:(title:string)=>void}) {
  const [kind,setKind]=useState<'brand'|'1688'>('brand')
  function preset(title:string, priority:string, startOffset:number|null=null, dueOffset:number|null=null){ return (defaults as any[]).find(d=>d.task_title===title&&((d.project_kind||'brand')===kind)) || {task_title:title,project_kind:kind,default_assignee_id:null,default_reviewer_id:null,default_priority:priority,default_start_offset:startOffset,default_due_offset:dueOffset,enabled:true} }
  const list1688=(defaults as any[]).filter(d=>(d.project_kind||'brand')==='1688').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
  return <main className="page"><div className="shell"><Header/><div className="page-title-row"><div><h1>新品執行模板設定</h1><p>設定之後新建立專案時要自動產生的工作項目、預設負責人，以及依上市日自動排程的開始／完成時間。</p></div><button className="btn" onClick={onBack}>← 返回首頁</button></div>
    <div className="kind-choice" style={{marginBottom:16}}><button className={kind==='brand'?'active':''} onClick={()=>setKind('brand')}><b>GUXON 品牌新品</b><small>完整新品執行模板</small></button><button className={kind==='1688'?'active':''} onClick={()=>setKind('1688')}><b>1688 新品</b><small>簡化上架模板，可自由新增項目</small></button></div>
    <div className="template-settings-note">這裡只影響「之後新建立的專案」。開始／完成時間以上市日 D0 自動換算；既有專案不會被模板設定覆蓋。</div>
    {kind==='brand'?<div className="template-settings">{EXECUTION_TEMPLATE.map((section,si)=><section className="template-section" key={section.name}><div className="template-section-head"><b>{String(si+1).padStart(2,'0')}　{section.name}</b><span>{section.tasks.length} 項</span></div><div className="table-wrap"><table><thead><tr><th>工作項目</th><th>開始時間</th><th>完成時間</th><th>預設負責人</th><th>預設審核人</th><th>優先級</th><th>預設啟用</th></tr></thead><tbody>{section.tasks.map(task=>{const d=preset(task.title,task.priority,task.startOffset,task.dueOffset);const startValue=d.default_start_offset??task.startOffset;const dueValue=d.default_due_offset??task.dueOffset;return <tr key={task.title}><td><b>{task.title}</b><small className="task-hint">{task.description}</small></td><td><div style={{display:'flex',gap:6,alignItems:'center',minWidth:180}}><select style={{width:82}} value={offsetPhase(startValue)} onChange={e=>onSave(task.title,{project_kind:'brand',default_start_offset:makeOffset(e.target.value,offsetDays(startValue))})}><option value="before">上市前</option><option value="after">上市後</option></select><input type="number" min="0" style={{width:70}} value={offsetDays(startValue)} onChange={e=>onSave(task.title,{project_kind:'brand',default_start_offset:makeOffset(offsetPhase(startValue),Number(e.target.value)||0)})}/><span>天</span></div></td><td><div style={{display:'flex',gap:6,alignItems:'center',minWidth:180}}><select style={{width:82}} value={offsetPhase(dueValue)} onChange={e=>onSave(task.title,{project_kind:'brand',default_due_offset:makeOffset(e.target.value,offsetDays(dueValue))})}><option value="before">上市前</option><option value="after">上市後</option></select><input type="number" min="0" style={{width:70}} value={offsetDays(dueValue)} onChange={e=>onSave(task.title,{project_kind:'brand',default_due_offset:makeOffset(offsetPhase(dueValue),Number(e.target.value)||0)})}/><span>天</span></div></td><td><select value={d.default_assignee_id??''} onChange={e=>onSave(task.title,{project_kind:'brand',default_assignee_id:e.target.value?Number(e.target.value):null})}><option value="">依部門自動指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td><select value={d.default_reviewer_id??''} onChange={e=>onSave(task.title,{project_kind:'brand',default_reviewer_id:e.target.value?Number(e.target.value):null})}><option value="">依部門／未指定</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td><select value={d.default_priority||task.priority} onChange={e=>onSave(task.title,{project_kind:'brand',default_priority:e.target.value})}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></td><td className="center-cell"><input type="checkbox" checked={d.enabled!==false} onChange={e=>onSave(task.title,{project_kind:'brand',enabled:e.target.checked})}/></td></tr>})}</tbody></table></div></section>)}</div>:
    <div className="template-settings"><section className="template-section"><div className="template-section-head"><b>1688 新品上架模板</b><div className="actions"><span>{list1688.length} 項</span><button className="btn-primary" onClick={onAdd1688}>＋ 新增工作項目</button></div></div><div className="table-wrap"><table><thead><tr><th>順序</th><th>工作項目／說明</th><th>預設負責人</th><th>優先級</th><th>啟用</th><th></th></tr></thead><tbody>{list1688.map((d:any)=><tr key={d.id||d.task_title}><td><input type="number" style={{width:80}} value={d.sort_order??0} onChange={e=>onSave(d.task_title,{project_kind:'1688',sort_order:Number(e.target.value)})}/></td><td><b>{d.task_title}</b><DebouncedTextarea value={d.task_description||''} onSave={v=>onSave(d.task_title,{project_kind:'1688',task_description:v||null})} placeholder="工作說明"/></td><td><select value={d.default_assignee_id??''} onChange={e=>onSave(d.task_title,{project_kind:'1688',default_assignee_id:e.target.value?Number(e.target.value):null})}><option value="">使用專案主要負責人</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></td><td><select value={d.default_priority||'中'} onChange={e=>onSave(d.task_title,{project_kind:'1688',default_priority:e.target.value})}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></td><td className="center-cell"><input type="checkbox" checked={d.enabled!==false} onChange={e=>onSave(d.task_title,{project_kind:'1688',enabled:e.target.checked})}/></td><td><button className="text-danger" onClick={()=>onDelete1688(d.task_title)}>刪除</button></td></tr>)}</tbody></table>{!list1688.length&&<div className="empty">目前沒有 1688 模板項目，請按「＋ 新增工作項目」。</div>}</div></section></div>}
  </div></main>
}

function EmployeeView({employees,onBack,onAdd,onUpdate}:{employees:Employee[];onBack:()=>void;onAdd:()=>void;onUpdate:(id:number,p:Partial<Employee>)=>void}) { return <main className="page"><div className="shell"><Header/><div className="page-title-row"><div><h1>員工管理</h1><p>建立可被指派工作的團隊成員</p></div><div className="actions"><button className="btn" onClick={onBack}>← 返回專案</button><button className="btn-primary" onClick={onAdd}>＋ 新增員工</button></div></div><div className="table-wrap panel"><table><thead><tr><th>姓名</th><th>部門／職務</th><th>Email</th><th>角色</th><th>啟用</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><DebouncedInput value={e.name} onSave={v=>onUpdate(e.id,{name:v})}/></td><td><DebouncedInput value={e.department||''} onSave={v=>onUpdate(e.id,{department:v||null})}/></td><td><DebouncedInput value={e.email||''} onSave={v=>onUpdate(e.id,{email:v||null})}/></td><td><select value={e.role} onChange={x=>onUpdate(e.id,{role:x.target.value})}><option value="member">member</option><option value="manager">manager</option><option value="admin">admin</option></select></td><td><input type="checkbox" checked={e.active} onChange={x=>onUpdate(e.id,{active:x.target.checked})}/></td></tr>)}</tbody></table></div></div></main> }

function NewProjectModal({data,setData,employees,onClose,onCreate}:{data:NewProjectForm;setData:(x:NewProjectForm)=>void;employees:Employee[];onClose:()=>void;onCreate:()=>void}) {
  const is1688=data.project_kind==='1688'
  return <div className="modal-bg"><div className="modal"><div className="modal-head"><h2>新增新品專案</h2><button onClick={onClose}>✕</button></div><div className="kind-choice"><button className={data.project_kind==='brand'?'active':''} onClick={()=>setData({...data,project_kind:'brand'})}><b>GUXON 品牌新品</b><small>可選不使用／簡易／完整策略＋執行管理</small></button><button className={data.project_kind==='1688'?'active':''} onClick={()=>setData({...data,project_kind:'1688'})}><b>1688 新品</b><small>簡化上架工作流程</small></button></div><div className="meta-grid"><Field label="專案名稱"><input value={data.name} onChange={e=>setData({...data,name:e.target.value})} placeholder={is1688?'例：1688 磁吸支架':'例：HALO 2 新品上市'}/></Field><Field label="型號"><input value={data.version} onChange={e=>setData({...data,version:e.target.value})}/></Field><Field label="主要負責人"><select value={data.owner_id} onChange={e=>setData({...data,owner_id:e.target.value})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field><Field label={is1688?'預計上架日':'上市日 D0'}><input type="date" value={data.launch_date} onChange={e=>setData({...data,launch_date:e.target.value})}/></Field><Field label="正式定價"><input type="number" value={data.retail_price} onChange={e=>setData({...data,retail_price:e.target.value})}/></Field><Field label="團購／活動價"><input type="number" value={data.group_price} onChange={e=>setData({...data,group_price:e.target.value})}/></Field>{!is1688&&<><Field label="策略管理模式"><select value={data.strategy_mode} onChange={e=>setData({...data,strategy_mode:e.target.value as 'none'|'simple'|'full'})}>{STRATEGY_MODES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label="本輪預算版本"><select value={data.budget_version} onChange={e=>setData({...data,budget_version:e.target.value})}>{BUDGETS.map(x=><option key={x} value={x}>{x||'未決定'}</option>)}</select></Field><Field label="本輪性質"><select value={data.project_type} onChange={e=>setData({...data,project_type:e.target.value})}>{PROJECT_TYPES.map(x=><option key={x} value={x}>{x||'未決定'}</option>)}</select></Field></>}{is1688&&<Field label="網址" wide><input value={data.product_url} onChange={e=>setData({...data,product_url:e.target.value})} placeholder="https://..."/></Field>}<Field label="備註" wide><textarea value={data.notes} onChange={e=>setData({...data,notes:e.target.value})} placeholder="專案備註"/></Field><Field label="專案狀態"><select value={data.status} onChange={e=>setData({...data,status:e.target.value})}>{PROJECT_STATUS.map(x=><option key={x}>{x}</option>)}</select></Field>{!is1688&&<Field label="本輪成功定義" wide><input value={data.success_goal} onChange={e=>setData({...data,success_goal:e.target.value})}/></Field>}</div><div className={`template-note ${is1688?'simple-template-note':''}`}>{is1688?<><b>1688 簡易新品模板</b><p>建立後會依「執行模板設定」中目前啟用的 1688 工作項目，自動產生上架流程。</p></>:<><b>{STRATEGY_MODES.find(x=>x.value===data.strategy_mode)?.label || '簡易策略'}＋新品執行管理</b><p>{STRATEGY_MODES.find(x=>x.value===data.strategy_mode)?.description} 新品執行管理仍會自動建立 9 大工作區／68 項跨部門工作。</p></>}</div><div className="modal-actions"><button className="btn" onClick={onClose}>取消</button><button className="btn-primary" onClick={onCreate}>建立專案</button></div></div></div>
}

function MyTaskList({items,projects,onOpen}:{items:Array<{key:string;id:number;project_id:number;container_id:number|null;title:string;due_date:string|null;assignee_id:number|null;status:string;source:'策略'|'執行'}>;projects:Project[];onOpen:(t:{id:number;project_id:number;container_id:number|null;source:'策略'|'執行'})=>void}) {
  return <div style={{marginTop:18,paddingTop:16,borderTop:'1px solid #e5e7eb'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><b>我的任務（{items.length}）</b><small style={{color:'#6b7280'}}>依截止日排序・點擊直接編輯</small></div>
    {!items.length?<div style={{padding:'14px 0',color:'#6b7280'}}>目前沒有未完成的指派任務。</div>:<div style={{display:'grid',gap:8}}>
      {items.slice(0,30).map(t=>{const project=projects.find(p=>p.id===t.project_id);return <button key={t.key} onClick={()=>onOpen(t)} style={{width:'100%',textAlign:'left',border:'1px solid #e5e7eb',background:'#fff',borderRadius:10,padding:'10px 12px',cursor:'pointer',display:'grid',gridTemplateColumns:'minmax(110px,0.8fr) minmax(180px,1.6fr) 90px 76px',gap:10,alignItems:'center'}}>
        <span className="project-tag">{project?.name||'未知專案'}</span>
        <span><b>{t.title}</b><small style={{display:'block',color:'#6b7280',marginTop:2}}>{t.source}</small></span>
        <span style={{fontSize:13}}>{t.due_date||'未設定'}</span>
        <StatusPill text={t.status}/>
      </button>})}
      {items.length>30&&<small style={{color:'#6b7280'}}>目前顯示前 30 項，共 {items.length} 項。</small>}
    </div>}
  </div>
}


type DashboardEditableTask = Task | ExecutionTask
function DashboardTaskModal({source,task,projects,employees,onClose,onUpdateTask,onUpdateExecutionTask,onOpenProject}:{source:'策略'|'執行';task:DashboardEditableTask|null;projects:Project[];employees:Employee[];onClose:()=>void;onUpdateTask:(id:number,p:Partial<Task>)=>void;onUpdateExecutionTask:(id:number,p:Partial<ExecutionTask>)=>void;onOpenProject:(projectId:number,containerId:number|null,source:'策略'|'執行',id:number)=>void}) {
  if(!task) return null
  const project=projects.find(p=>p.id===task.project_id)
  const execution=source==='執行'
  const xt=execution ? task as ExecutionTask : null
  const st=!execution ? task as Task : null
  const save=(patch:Record<string,unknown>)=>execution?onUpdateExecutionTask(task.id,patch as Partial<ExecutionTask>):onUpdateTask(task.id,patch as Partial<Task>)
  const statuses=execution?EXECUTION_STATUS:TASK_STATUS
  const containerId=execution?xt?.section_id??null:st?.stage_id??null
  return <div className="modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal" style={{maxWidth:720}}>
    <div className="modal-head"><div><h2>編輯我的任務</h2><small style={{color:'#6b7280'}}>{project?.name||'未知專案'} ・ {source}</small></div><button onClick={onClose}>✕</button></div>
    <div className="meta-grid">
      <Field label="任務名稱" wide><input value={task.title} onChange={e=>save({title:e.target.value})}/></Field>
      <Field label="狀態"><select value={task.status} onChange={e=>save({status:e.target.value})}>{statuses.map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="負責人"><select value={task.assignee_id??''} onChange={e=>save({assignee_id:e.target.value?Number(e.target.value):null})}><option value="">未指派</option>{employees.filter(e=>e.active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      {execution&&<Field label="開始日期"><input type="date" value={xt?.start_date||''} onChange={e=>save({start_date:e.target.value||null})}/></Field>}
      <Field label="截止日期"><input type="date" value={task.due_date||''} onChange={e=>save({due_date:e.target.value||null})}/></Field>
      {execution&&<Field label="優先級"><select value={xt?.priority||'中'} onChange={e=>save({priority:e.target.value})}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></Field>}
      <Field label="備註" wide><textarea value={task.note||''} onChange={e=>save({note:e.target.value||null})} placeholder="備註／連結"/></Field>
    </div>
    <div className="modal-actions"><button className="btn" onClick={()=>onOpenProject(task.project_id,containerId,source,task.id)}>查看完整專案</button><button className="btn-primary" onClick={onClose}>完成</button></div>
  </div></div>
}

function Attention({title,items,employees,projects}:{title:string;items:Array<{key:string;project_id:number;title:string;due_date:string|null;assignee_id:number|null;status:string;source:string}>;employees:Employee[];projects:Project[]}) { if(!items.length)return null;return <div className="attention"><b>{title}（{items.length}）</b>{items.slice(0,12).map(t=>{const project=projects.find(p=>p.id===t.project_id);return <p key={t.key}>• <span className="project-tag">{project?.name||'未知專案'}</span> <span className="source-tag">{t.source}</span> <span className="attention-task-title">{t.title}</span> <small>{t.due_date||''} ・ {employees.find(e=>e.id===t.assignee_id)?.name||'未指派'}</small></p>})}</div> }
function Stat({label,value,danger=false}:{label:string;value:number;danger?:boolean}) { return <div className={`stat ${danger?'stat-danger':''}`}><span>{label}</span><b>{value}</b></div> }
function StatusPill({text}:{text:string}) { const d=text.includes('卡關')||text.includes('暫停'),ok=text.includes('完成')||text.includes('通關')||text.includes('已上市')||text.includes('結案');return <span className={`pill ${d?'pill-danger':ok?'pill-ok':text.includes('進行')?'pill-run':'pill-idle'}`}>{text}</span> }
function Header({right}:{right?:ReactNode}) { return <header className="brand-head"><div><span>GUXON GOOD LIFE</span><strong>新品管理平台</strong></div>{right}</header> }
function Field({label,children,wide=false}:{label:string;children:ReactNode;wide?:boolean}) { return <label className={`field ${wide?'wide':''}`}><span>{label}</span>{children}</label> }
function DebouncedInput({value,onSave,placeholder=''}:{value:string;onSave:(v:string)=>void;placeholder?:string}) { return <input key={value} defaultValue={value} placeholder={placeholder} onBlur={e=>e.target.value!==value&&onSave(e.target.value)}/> }
function DebouncedTextarea({value,onSave,placeholder=''}:{value:string;onSave:(v:string)=>void;placeholder?:string}) { return <textarea key={value} defaultValue={value} placeholder={placeholder} onBlur={e=>e.target.value!==value&&onSave(e.target.value)}/> }
function Loading(){return <main className="page"><div className="shell"><Header/><div className="empty">讀取資料中…</div></div></main>}
function AuthScreen(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false)
  async function login(){
    if(!email.trim()||!password) return setMsg('請輸入 Email 與密碼。')
    setBusy(true); setMsg('')
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password})
    if(error) setMsg(error.message==='Invalid login credentials'?'Email 或密碼錯誤，請重新確認。':error.message)
    setBusy(false)
  }
  return <main className="auth-page"><div className="auth-card"><Header/><div className="auth-title"><h1>員工登入</h1><p>GUXON 新品管理平台</p></div><label>公司 Email<input type="email" autoComplete="username" placeholder="name@guxon.com.tw" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/></label><label>密碼<input type="password" autoComplete="current-password" placeholder="請輸入密碼" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/></label><button className="btn-primary auth-submit" disabled={busy} onClick={login}>{busy?'登入中…':'登入'}</button>{msg&&<div className="auth-error">{msg}</div>}<small>帳號由管理員建立；如無法登入，請聯絡管理員。</small></div></main>
}
function AccessDeniedScreen({email}:{email:string}){return <main className="auth-page"><div className="auth-card"><Header/><h1>尚未取得系統權限</h1><p>目前登入帳號 <b>{email}</b> 尚未綁定啟用中的員工資料。</p><button className="btn-primary" onClick={()=>supabase.auth.signOut()}>返回登入</button><small>請由管理員確認員工 Email、啟用狀態與 Auth 綁定。</small></div></main>}
