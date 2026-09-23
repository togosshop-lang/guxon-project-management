export type Project = {
  id: number
  name: string
  version: string | null
  launch_date: string | null
  retail_price: number | null
  group_price: number | null
  status: string | null
  owner_id: number | null
  budget_version: string | null
  project_type: string | null
  project_kind: 'brand' | '1688' | null
  success_goal: string | null
  created_at?: string
}

export type Stage = {
  id: number
  project_id: number
  stage_number: number
  name: string
  description: string | null
  status: string
  sort_order: number
  approval_note: string | null
}

export type Task = {
  id: number
  project_id: number
  stage_id: number
  assignee_id: number | null
  title: string
  description: string | null
  status: string
  due_date: string | null
  due_offset: number | null
  note: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type Employee = {
  id: number
  name: string
  email: string | null
  auth_user_id?: string | null
  department: string | null
  role: string
  active: boolean
  created_at?: string
}

export type StageGate = {
  id: number
  project_id: number
  stage_id: number
  label: string
  checked: boolean
  sort_order: number
}

export type ExecutionSection = {
  id: number
  project_id: number
  section_number: number
  name: string
  description: string | null
  sort_order: number
  created_at?: string
}

export type ExecutionTask = {
  id: number
  project_id: number
  section_id: number
  title: string
  description: string | null
  assignee_id: number | null
  reviewer_id: number | null
  status: string
  priority: string
  start_date: string | null
  due_date: string | null
  start_offset: number | null
  due_offset: number | null
  depends_on_task_id: number | null
  note: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type ExecutionTemplateDefault = {
  id?: number
  task_title: string
  default_assignee_id: number | null
  default_reviewer_id: number | null
  default_priority: string
  enabled: boolean
  updated_at?: string
}
